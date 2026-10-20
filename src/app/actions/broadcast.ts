'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

// --- FONCTION DE SÉCURITÉ : SANITIZATION ---
// Elle retire toutes les balises HTML/JS potentielles d'un texte
function sanitize(input: string): string {
  return input.replace(/<[^>]*>?/gm, '')
}

export async function sendBroadcast(formData: FormData) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  if (!sessionCookie) return { error: 'Session invalide.' }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    if (payload.role !== 'ADMIN') return { error: 'Accès refusé.' }

    const rawMessage = formData.get('message') as string
    const type = formData.get('type') as string

    if (!rawMessage || rawMessage.length < 5) {
      return { error: 'Le message est trop court.' }
    }

    // ON NETTOIE LE MESSAGE AVANT DE LE SAUVEGARDER
    const cleanMessage = sanitize(rawMessage)

    await prisma.broadcast.create({
      data: {
        message: cleanMessage,
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

export async function markBroadcastAsRead(id: string) {
  try {
    await prisma.broadcast.update({
      where: { id },
      data: { isRead: true }
    })
    
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/messages')
    revalidatePath('/dashboard/admin')
    
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors du marquage.' }
  }
}