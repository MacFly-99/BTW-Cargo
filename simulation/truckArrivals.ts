import { PrismaClient } from '@prisma/client'
import { 
  LOGISTICS, 
  generateContainerCode, 
  generateDestination, 
  generateColor, 
  generateType, 
  generateZone 
} from './logistics'

export async function simulateTruckArrivals(prisma: PrismaClient) {
  // On simule l'arrivée d'un convoi de camions (entre 5 et MAX_TRUCKS_PER_TICK)
  const truckCount = Math.floor(Math.random() * LOGISTICS.MAX_TRUCKS_PER_TICK) + 5
  
  const totalContainers = truckCount * LOGISTICS.TRUCK_CAPACITY
  
  console.log(`🚚 Convoi de ${truckCount} camions en approche (${totalContainers} conteneurs)...`)
  
  const newContainers = []
  
  for (let i = 0; i < totalContainers; i++) {
    newContainers.push({
      code: generateContainerCode(),
      type: generateType() as any,
      color: generateColor() as any,
      destination: generateDestination() as any,
      zone: generateZone(),
      row: Math.floor(Math.random() * 100) + 1,
      slot: Math.floor(Math.random() * 60) + 1,
      status: 'PENDING' as any,
    })
  }

  if (newContainers.length > 0) {
    await prisma.container.createMany({
      data: newContainers,
      skipDuplicates: true
    })
    console.log(`📦 ${newContainers.length} conteneurs déchargés par les camions.`)
  }
}