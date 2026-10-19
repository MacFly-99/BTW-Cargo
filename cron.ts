import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// On configure une tâche qui tourne toutes les minutes (pour tester)
// En production, on mettrait '0 * * * *' pour toutes les heures.
cron.schedule('* * * * *', async () => {
  console.log('⏱️ [CRON] Simulation du port en cours...')

  try {
    // 1. Les navires pleins à quai partent en mer
    const fullShips = await prisma.ship.findMany({
      where: { status: 'DOCKED' },
      include: { _count: { select: { containers: true } } }
    })

    for (const ship of fullShips) {
      if (ship._count.containers >= ship.capacity) {
        await prisma.ship.update({
          where: { id: ship.id },
          data: { status: 'IN_TRANSIT' }
        })
        console.log(`🚢 Le navire ${ship.name} a quitté le port (plein).`)
      }
    }

    // 2. Les navires en mer reviennent (on simule un retour aléatoire pour le test)
    const shipsInTransit = await prisma.ship.findMany({
      where: { status: 'IN_TRANSIT' }
    })

    for (const ship of shipsInTransit) {
      // Pour tester, on dit que 50% des navires en mer reviennent à chaque tour
      if (Math.random() < 0.5) { 
        await prisma.ship.update({
          where: { id: ship.id },
          data: { status: 'DOCKED' }
        })
        console.log(`🚢 Le navire ${ship.name} est revenu au port.`)
      }
    }

    // 3. Optionnel : On pourrait aussi simuler des navires qui sortent de maintenance
    const maintenanceShips = await prisma.ship.findMany({
      where: { status: 'MAINTENANCE' }
    })
    
    for (const ship of maintenanceShips) {
      if (Math.random() < 0.2) { // 20% de chance de finir la maintenance
        await prisma.ship.update({
          where: { id: ship.id },
          data: { status: 'DOCKED' }
        })
        console.log(`🔧 Le navire ${ship.name} a terminé sa maintenance.`)
      }
    }

    console.log('✅ [CRON] Simulation terminée.')
  } catch (error) {
    console.error('❌ [CRON] Erreur lors de la simulation:', error)
  }
})