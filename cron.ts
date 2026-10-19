import cron from 'node-cron'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// ==========================================
// TÂCHE 1 : Simulation de la vie des navires
// ==========================================
cron.schedule('* * * * *', async () => {
  console.log('⏱️ [CRON] Simulation du port en cours...')

  try {
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

    const shipsInTransit = await prisma.ship.findMany({
      where: { status: 'IN_TRANSIT' }
    })

    for (const ship of shipsInTransit) {
      if (Math.random() < 0.5) { 
        await prisma.ship.update({
          where: { id: ship.id },
          data: { status: 'DOCKED' }
        })
        console.log(`🚢 Le navire ${ship.name} est revenu au port.`)
      }
    }

    const maintenanceShips = await prisma.ship.findMany({
      where: { status: 'MAINTENANCE' }
    })
    
    for (const ship of maintenanceShips) {
      if (Math.random() < 0.2) {
        await prisma.ship.update({
          where: { id: ship.id },
          data: { status: 'DOCKED' }
        })
        console.log(`🔧 Le navire ${ship.name} a terminé sa maintenance.`)
      }
    }

    console.log('✅ [CRON] Simulation des navires terminée.')
  } catch (error) {
    console.error('❌ [CRON] Erreur lors de la simulation des navires:', error)
  }
})

// ==========================================
// TÂCHE 2 : Flux des conteneurs
// ==========================================
cron.schedule('*/2 * * * *', async () => {
  console.log('📦 [CRON] Mouvement des conteneurs en cours...')

  try {
    const PORT_CAPACITY = 120000
    const currentStock = await prisma.container.count({ where: { shipId: null } })
    const fillRate = (currentStock / PORT_CAPACITY) * 100

    console.log(`📊 Taux de remplissage actuel du port : ${fillRate.toFixed(2)}%`)

    let toRemove = 0
    let toAdd = 0
    const randomBase = Math.floor(Math.random() * 450) + 50

    if (fillRate > 85) {
      toRemove = randomBase * 2
      toAdd = Math.floor(randomBase / 4)
    } else if (fillRate < 40) {
      toAdd = randomBase * 2
      toRemove = Math.floor(randomBase / 4)
    } else {
      toAdd = randomBase
      toRemove = randomBase
    }

    if (toRemove > 0) {
      const containersToDelete = await prisma.container.findMany({
        where: { shipId: null },
        take: Math.floor(toRemove),
        select: { id: true }
      })
      
      if (containersToDelete.length > 0) {
        await prisma.container.deleteMany({
          where: { id: { in: containersToDelete.map(c => c.id) } }
        })
        console.log(`🚚 ${containersToDelete.length} conteneurs ont quitté le port.`)
      }
    }

    if (toAdd > 0) {
      const newContainers = []
      const types = ['DRY', 'HIGH_CUBE', 'OPEN_TOP']
      const colors = ['BLEU_MARINE', 'GRIS_METALLIQUE', 'BLANC', 'VERT', 'ORANGE', 'JAUNE']
      const destinations = ['SHANGHAI', 'SINGAPOUR', 'NINGBO_ZHOUSHAN', 'SHENZHEN', 'GUANGZHOU', 'BUSAN', 'ROTTERDAM', 'HONG_KONG', 'ANVERS', 'LOS_ANGELES']
      const zones = ['Terminal Nord', 'Terminal Sud', 'Terminal Est', 'Terminal Ouest', 'Zone de Transit']

      for (let i = 0; i < toAdd; i++) {
        const prefixes = ['MSKU', 'MSCU', 'CMAU', 'OOLU']
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
        
        newContainers.push({
          code: `${prefix}${Math.floor(Math.random() * 9000000) + 1000000}`,
          type: types[Math.floor(Math.random() * types.length)] as any,
          color: colors[Math.floor(Math.random() * colors.length)] as any,
          destination: destinations[Math.floor(Math.random() * destinations.length)] as any,
          zone: zones[Math.floor(Math.random() * zones.length)],
          row: Math.floor(Math.random() * 100) + 1,
          slot: Math.floor(Math.random() * 60) + 1,
          status: 'PENDING' as any,
        })
      }

      await prisma.container.createMany({
        data: newContainers,
        skipDuplicates: true
      })
      console.log(`🚢 ${newContainers.length} nouveaux conteneurs sont arrivés au port.`)
    }

    console.log('✅ [CRON] Mouvement des conteneurs terminé.')
  } catch (error) {
    console.error('❌ [CRON] Erreur lors du mouvement des conteneurs:', error)
  }
})