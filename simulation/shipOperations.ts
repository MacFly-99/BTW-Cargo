import { PrismaClient } from '@prisma/client'
import { LOGISTICS } from './logistics'

export async function simulateShipOperations(prisma: PrismaClient) {
  // 1. DÉPART DES NAVIRES PLEINS
  const fullShips = await prisma.ship.findMany({
    where: { status: 'DOCKED' },
    include: { _count: { select: { containers: true } } }
  })

  for (const ship of fullShips) {
    const fillRate = (ship._count.containers / ship.capacity) * 100
    
    if (fillRate >= 95) {
      await prisma.ship.update({
        where: { id: ship.id },
        data: { status: 'IN_TRANSIT' }
      })
      console.log(`🚢 Le navire ${ship.name} quitte le port (plein à ${fillRate.toFixed(1)}%).`)
    }
  }

  // 2. RETOUR DES NAVIRES (simulation aléatoire pour l'instant)
  const shipsInTransit = await prisma.ship.findMany({
    where: { status: 'IN_TRANSIT' }
  })

  for (const ship of shipsInTransit) {
    // 30% de chance de revenir à chaque tick
    if (Math.random() < 0.3) {
      await prisma.ship.update({
        where: { id: ship.id },
        data: { status: 'DOCKED' }
      })
      console.log(`🚢 Le navire ${ship.name} est de retour au port.`)
    }
  }

  // 3. CHARGEMENT/DÉCHARGEMENT (Les grues travaillent à vitesse réelle)
  const dockedShips = await prisma.ship.findMany({
    where: { status: 'DOCKED' },
    include: { _count: { select: { containers: true } } }
  })

  for (const ship of dockedShips) {
    const currentFill = ship._count.containers
    const capacity = ship.capacity
    
    // A. DÉCHARGEMENT : Si le navire a des conteneurs, on en décharge
    if (currentFill > 0) {
      const toUnload = Math.min(LOGISTICS.CRANE_SPEED_PER_TICK, currentFill)
      
      const containersToUnload = await prisma.container.findMany({
        where: { shipId: ship.id },
        take: toUnload,
        select: { id: true }
      })

      if (containersToUnload.length > 0) {
        await prisma.container.updateMany({
          where: { id: { in: containersToUnload.map(c => c.id) } },
          data: { shipId: null }
        })
        console.log(`🏗️ ${containersToUnload.length} conteneurs déchargés de ${ship.name}.`)
      }
    }
    
    // B. CHARGEMENT : Si le navire a de la place, on en charge
    const availableSpace = capacity - currentFill
    if (availableSpace > 0) {
      const toLoad = Math.min(LOGISTICS.CRANE_SPEED_PER_TICK, availableSpace)
      
      const containersToLoad = await prisma.container.findMany({
        where: { shipId: null },
        take: toLoad,
        select: { id: true }
      })

      if (containersToLoad.length > 0) {
        await prisma.container.updateMany({
          where: { id: { in: containersToLoad.map(c => c.id) } },
          data: { shipId: ship.id }
        })
        console.log(`🏗️ ${containersToLoad.length} conteneurs chargés sur ${ship.name}.`)
      }
    }
  }
}