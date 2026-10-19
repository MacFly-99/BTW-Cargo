'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { z } from 'zod'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

// Sécurité Admin
async function isAdmin() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  if (!sessionCookie) return false
  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    return payload.role === 'ADMIN'
  } catch { return false }
}

const CreateShipSchema = z.object({
  name: z.string().min(2, "Le nom doit faire au moins 2 caractères."),
  type: z.enum(['SMALL', 'MEDIUM', 'LARGE', 'ULTRA_LARGE']),
  destination: z.enum(['SHANGHAI', 'SINGAPOUR', 'NINGBO_ZHOUSHAN', 'SHENZHEN', 'GUANGZHOU', 'BUSAN', 'ROTTERDAM', 'HONG_KONG', 'ANVERS', 'LOS_ANGELES']),
})

export async function createShip(formData: FormData) {
  if (!(await isAdmin())) return { error: 'Accès refusé.' }

  const rawData = {
    name: formData.get('name'),
    type: formData.get('type'),
    destination: formData.get('destination'),
  }

  const validated = CreateShipSchema.safeParse(rawData)
  if (!validated.success) return { error: validated.error.issues[0].message }

  const data = validated.data

  // On définit la capacité automatiquement selon le type
  const capacities: Record<string, number> = {
    SMALL: 500,
    MEDIUM: 2000,
    LARGE: 8000,
    ULTRA_LARGE: 20000
  }

  try {
    await prisma.ship.create({
      data: {
        name: data.name,
        type: data.type,
        destination: data.destination,
        capacity: capacities[data.type],
        status: 'DOCKED', // Par défaut à quai
      }
    })

    revalidatePath('/dashboard/ships')
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors de la création du navire.' }
  }
}

export async function deleteShip(id: string) {
  if (!(await isAdmin())) {
    return { error: 'Accès refusé. Seul un administrateur peut supprimer un navire.' }
  }

  try {
    // Sécurité : On ne supprime un navire QUE s'il est vide
    const ship = await prisma.ship.findUnique({
      where: { id },
      include: { _count: { select: { containers: true } } }
    })

    if (!ship) return { error: 'Navire introuvable.' }
    
    if (ship._count.containers > 0) {
      return { error: `Impossible de supprimer ce navire : ${ship._count.containers} conteneurs sont encore à bord.` }
    }

    await prisma.ship.delete({ where: { id } })
    
    revalidatePath('/dashboard/ships')
    return { success: true }
  } catch (error) {
    console.error(error)
    return { error: 'Erreur lors de la suppression du navire.' }
  }
}