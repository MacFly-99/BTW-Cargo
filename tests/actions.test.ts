import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// On force l'URL de la base de TEST ici pour éviter les conflits
const adapter = new PrismaPg({ 
  connectionString: "postgresql://user:password@localhost:5432/btw_cargo_test?schema=public" 
})
const prisma = new PrismaClient({ adapter })

describe('Intégration : Création de conteneur', () => {
  beforeAll(async () => {
    await prisma.container.deleteMany()
  })

  afterAll(async () => {
    await prisma.container.deleteMany()
    await prisma.$disconnect()
  })

  it('doit créer un conteneur en base de données avec succès', async () => {
    const newContainer = await prisma.container.create({
      data: {
        code: 'TEST1234567',
        type: 'DRY',
        color: 'BLEU_MARINE',
        destination: 'SHANGHAI',
        zone: 'Terminal Nord',
        row: 1,
        slot: 1,
        status: 'PENDING',
      }
    })

    expect(newContainer.code).toBe('TEST1234567')
    expect(newContainer.status).toBe('PENDING')
  })
})