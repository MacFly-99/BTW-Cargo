import { PrismaClient } from '@prisma/client'
import { LOGISTICS } from './logistics'

export async function simulateTrainEvacuation(prisma: PrismaClient, urgency: boolean = false) {
  // Si c'est une urgence, le train est plus long
  const trainCapacity = urgency ? LOGISTICS.TRAIN_CAPACITY * 2 : LOGISTICS.TRAIN_CAPACITY
  
  console.log(`🚂 Un train de ${trainCapacity} conteneurs arrive pour évacuer...`)
  
  // On récupère les conteneurs en stock (pas sur un navire)
  const containersToEvacuate = await prisma.container.findMany({
    where: { shipId: null },
    take: trainCapacity,
    select: { id: true }
  })

  if (containersToEvacuate.length > 0) {
    await prisma.container.deleteMany({
      where: { id: { in: containersToEvacuate.map(c => c.id) } }
    })
    console.log(`🚂 ${containersToEvacuate.length} conteneurs évacués par le train.`)
    return containersToEvacuate.length
  } else {
    console.log(`🚂 Aucun conteneur à évacuer (le port est vide).`)
    return 0
  }
}