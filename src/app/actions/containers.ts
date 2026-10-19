'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

// --- UTILITAIRE : Vérifier si l'utilisateur est Admin ---
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

// ==========================================
// 1. VALIDATION (Tous les utilisateurs connectés)
// ==========================================
export async function validateContainer(containerId: string) {
  try {
    await prisma.container.update({
      where: { id: containerId },
      data: { status: 'VALIDATED' }
    })
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    return { error: 'Impossible de valider ce conteneur.' }
  }
}

// ==========================================
// 2. CRÉATION (Tous les utilisateurs connectés)
// ==========================================
const CreateContainerSchema = z.object({
  type: z.enum(['DRY', 'HIGH_CUBE', 'OPEN_TOP']),
  color: z.enum(['BLEU_MARINE', 'GRIS_METALLIQUE', 'BLANC', 'VERT', 'ORANGE', 'JAUNE']),
  destination: z.enum(['SHANGHAI', 'SINGAPOUR', 'NINGBO_ZHOUSHAN', 'SHENZHEN', 'GUANGZHOU', 'BUSAN', 'ROTTERDAM', 'HONG_KONG', 'ANVERS', 'LOS_ANGELES']),
  zone: z.enum(['Terminal Nord', 'Terminal Sud', 'Terminal Est', 'Terminal Ouest', 'Zone de Transit']),
})

export async function createContainer(formData: FormData) {
  const rawData = {
    type: formData.get('type'),
    color: formData.get('color'),
    destination: formData.get('destination'),
    zone: formData.get('zone'),
  }

  const validated = CreateContainerSchema.safeParse(rawData)
  if (!validated.success) return { error: 'Données invalides.' }

  const data = validated.data

  const lastContainer = await prisma.container.findFirst({
    where: { zone: data.zone },
    orderBy: [{ row: 'desc' }, { slot: 'desc' }],
    select: { row: true, slot: true }
  })

  let newRow = 1
  let newSlot = 1

  if (lastContainer) {
    if (lastContainer.slot < 60) {
      newRow = lastContainer.row
      newSlot = lastContainer.slot + 1
    } else {
      newRow = lastContainer.row + 1
      newSlot = 1
    }
  }

  const prefixes = ['MSKU', 'MSCU', 'CMAU', 'OOLU']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const code = `${prefix}${Math.floor(Math.random() * 9000000) + 1000000}`

  try {
    await prisma.container.create({
      data: {
        code,
        type: data.type,
        color: data.color,
        destination: data.destination,
        zone: data.zone,
        row: newRow,
        slot: newSlot,
        status: 'PENDING',
      }
    })
    revalidatePath('/dashboard/containers')
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors de la création du conteneur.' }
  }
}

// ==========================================
// 3. SUPPRESSION (Admin uniquement)
// ==========================================
export async function deleteContainer(id: string) {
  if (!(await isAdmin())) {
    return { error: 'Accès refusé. Seul un administrateur peut supprimer un conteneur.' }
  }

  try {
    await prisma.container.delete({ where: { id } })
    revalidatePath('/dashboard/containers')
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors de la suppression.' }
  }
}