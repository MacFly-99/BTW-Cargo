'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { revalidatePath } from 'next/cache'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function validateContainer(containerId: string) {
  try {
    await prisma.container.update({
      where: { id: containerId },
      data: { status: 'VALIDATED' }
    })
    
    // On dit à Next.js de rafraîchir les données de la page
    revalidatePath('/dashboard')
    
    return { success: true }
  } catch (error) {
    return { error: 'Impossible de valider ce conteneur.' }
  }
}