'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { z } from 'zod'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

// --- SÉCURITÉ : Vérifier si l'utilisateur est Admin ---
async function isAdmin() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  if (!sessionCookie) return false
  
  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    return payload.role === 'ADMIN'
  } catch {
    return false
  }
}

// --- SCHÉMA DE VALIDATION ---
const CreateUserSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères."),
  email: z.string().email("Email invalide."),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères."),
  role: z.enum(['USER', 'ADMIN']),
})

// --- ACTION : CRÉER UN UTILISATEUR ---
export async function createUser(formData: FormData) {
  if (!(await isAdmin())) return { error: 'Accès refusé. Seul un administrateur peut faire cela.' }

  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  }

  const validated = CreateUserSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: validated.error.issues[0].message }
  }

  const data = validated.data

  try {
    // On vérifie si l'email existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } })
    if (existingUser) return { error: 'Cet email est déjà utilisé.' }

    // On hash le mot de passe
    const hashedPassword = await bcrypt.hash(data.password, 10)

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      }
    })

    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Erreur lors de la création de l\'utilisateur.' }
  }
}

// --- ACTION : SUPPRIMER UN UTILISATEUR ---
export async function deleteUser(id: string) {
  if (!(await isAdmin())) return { error: 'Accès refusé.' }

  try {
    // Sécurité : Empêcher l'admin de se supprimer lui-même
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('session')
    if (!sessionCookie) return { error: 'Session invalide.' }

    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    
    if (payload.id === id) {
      return { error: 'Vous ne pouvez pas supprimer votre propre compte.' }
    }

    await prisma.user.delete({ where: { id } })
    revalidatePath('/dashboard/admin')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Erreur lors de la suppression.' }
  }
}

export async function updatePassword(formData: FormData) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  if (!sessionCookie) return { error: 'Session invalide.' }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    const userId = payload.id as string

    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      return { error: 'Les nouveaux mots de passe ne correspondent pas.' }
    }

    if (newPassword.length < 6) {
      return { error: 'Le nouveau mot de passe doit faire au moins 6 caractères.' }
    }

    // On récupère l'utilisateur pour vérifier l'ancien mot de passe
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { error: 'Utilisateur introuvable.' }

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return { error: 'Le mot de passe actuel est incorrect.' }
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    })

    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors de la mise à jour du mot de passe.' }
  }
}