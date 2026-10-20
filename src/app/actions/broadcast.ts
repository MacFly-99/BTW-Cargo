'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { revalidatePath } from 'next/cache' // <-- IMPORT ESSENTIEL
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

// 1. ENVOYER UN MESSAGE (Admin uniquement)
export async function sendBroadcast(formData: FormData) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  if (!sessionCookie) return { error: 'Session invalide.' }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    if (payload.role !== 'ADMIN') return { error: 'Accès refusé.' }

    const message = formData.get('message') as string
    const type = formData.get('type') as string

    if (!message || message.length < 5) {
      return { error: 'Le message est trop court.' }
    }

    await prisma.broadcast.create({
      data: {
        message,
        type,
        authorId: payload.id as string
      }
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/admin')
    revalidatePath('/dashboard/admin/broadcast')
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors de l\'envoi.' }
  }
}

// 2. MARQUER UN MESSAGE COMME LU
export async function markBroadcastAsRead(id: string) {
  try {
    await prisma.broadcast.update({
      where: { id },
      data: { isRead: true }
    })
    
    // On vide le cache pour que le bandeau ne réapparaisse pas
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/messages')
    revalidatePath('/dashboard/admin')
    
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors du marquage.' }
  }
}