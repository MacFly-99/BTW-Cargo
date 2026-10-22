import { PrismaClient } from '@prisma/client'
import {
  LOGISTICS,
  MEAN_ACTIVITY,
  activityFactor,
  demandDrift,
  inboundFactor,
  sampleCount,
  addContainers,
  removeFromYard,
} from './logistics'

// Flux routier, dans les deux sens :
//  - ENTRÉES : camions qui déposent des conteneurs (export), selon l'heure, la demande
//    du moment et le remplissage du port (le gate ralentit quand le parc se remplit)
//  - SORTIES : camions qui récupèrent des conteneurs (import). Plus le stock est grand,
//    plus il en part : le port se stabilise tout seul, sans coupure brutale.
export async function simulateTruckOperations(
  prisma: PrismaClient,
  stock: number,
  fillRate: number
) {
  const activity = activityFactor()

  // Entrées
  const inMean = LOGISTICS.TRUCK_IN_PEAK_PER_MIN * activity * demandDrift() * inboundFactor(fillRate)
  const trucksIn = sampleCount(inMean)
  const added = await addContainers(prisma, trucksIn * LOGISTICS.TRUCK_CAPACITY)

  // Sorties (loi de séjour : une fraction du stock repart chaque minute)
  const outContainersMean = (stock / LOGISTICS.DWELL_MINUTES) * (activity / MEAN_ACTIVITY)
  const trucksOut = sampleCount(outContainersMean / LOGISTICS.TRUCK_CAPACITY)
  const removed = await removeFromYard(prisma, trucksOut * LOGISTICS.TRUCK_CAPACITY)

  return { trucksIn, trucksOut, added, removed }
}