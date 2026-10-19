'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ==========================================
// 1. VALIDATION D'UN CONTENEUR (Opérateur)
// ==========================================
export async function validateContainer(containerId: string) {
  try {
    await prisma.container.update({
      where: { id: containerId },
      data: { status: 'VALIDATED' }
    })
    
    // On rafraîchit le dashboard de l'opérateur
    revalidatePath('/dashboard')
    
    return { success: true }
  } catch (error) {
    return { error: 'Impossible de valider ce conteneur.' }
  }
}

// Schéma de validation
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

  // Validation
  const validated = CreateContainerSchema.safeParse(rawData)
  if (!validated.success) {
    return { error: 'Données invalides.' }
  }

  const data = validated.data

  // --- LOGIQUE DE PLACEMENT ---
  // On cherche la dernière rangée utilisée dans cette zone pour continuer à remplir
  const lastContainer = await prisma.container.findFirst({
    where: { zone: data.zone },
    orderBy: { row: 'desc' },
    select: { row: true, slot: true }
  })

  let newRow = 1
  let newSlot = 1

  if (lastContainer) {
    if (lastContainer.slot < 60) {
      // S'il reste de la place dans la rangée, on ajoute au slot suivant
      newRow = lastContainer.row
      newSlot = lastContainer.slot + 1
    } else {
      // La rangée est pleine (60 slots), on passe à la suivante
      newRow = lastContainer.row + 1
      newSlot = 1
    }
  }

  // Génération du code
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
        status: 'PENDING', // Par défaut en attente de validation
      }
    })

    revalidatePath('/dashboard/containers')
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors de la création du conteneur.' }
  }
}

// Action pour Supprimer un conteneur
export async function deleteContainer(id: string) {
  try {
    await prisma.container.delete({ where: { id } })
    revalidatePath('/dashboard/containers')
    return { success: true }
  } catch (error) {
    return { error: 'Erreur lors de la suppression.' }
  }
}