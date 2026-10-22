import { PrismaClient } from '@prisma/client'
import { LOGISTICS, rand, addContainers, removeFromYard } from './logistics'

// Trains à horaires fixes. Un train n'est pas traité d'un coup : il est mis en file
// et manipulé progressivement (RAIL_RATE_PER_TICK par minute), comme sur une vraie voie.
//  - Trains ARRIVÉE : déposent des conteneurs au parc
//  - Trains DÉPART  : emportent des conteneurs du parc
//  - Train d'urgence : départ supplémentaire (2× la capacité) si le parc dépasse
//    SATURATION_THRESHOLD (70), avec un délai de carence d'1h

interface RailJob {
  direction: 'IN' | 'OUT'
  remaining: number
  urgent: boolean
}

const railQueue: RailJob[] = []
let lastEmergency = 0

export async function simulateTrainOperations(
  prisma: PrismaClient,
  fillRate: number,
  now: Date = new Date()
) {
  // --- Horaires ---
  if (now.getMinutes() === 0) {
    const h = now.getHours()
    if (LOGISTICS.TRAIN_ARRIVAL_HOURS.includes(h)) {
      const n = Math.round(LOGISTICS.TRAIN_CAPACITY * rand(0.6, 1))
      railQueue.push({ direction: 'IN', remaining: n, urgent: false })
      console.log(`🚆 Train d'arrivée : ${n} conteneurs à décharger.`)
    }
    if (LOGISTICS.TRAIN_DEPARTURE_HOURS.includes(h)) {
      const n = Math.round(LOGISTICS.TRAIN_CAPACITY * rand(0.7, 1))
      railQueue.push({ direction: 'OUT', remaining: n, urgent: false })
      console.log(`🚆 Train de départ : ${n} conteneurs à charger.`)
    }
  }

  // --- Train d'urgence (seuil à 70%) ---
  if (
    fillRate > LOGISTICS.SATURATION_THRESHOLD &&
    Date.now() - lastEmergency > LOGISTICS.EMERGENCY_TRAIN_COOLDOWN_MS &&
    !railQueue.some((j) => j.urgent)
  ) {
    lastEmergency = Date.now()
    const n = LOGISTICS.TRAIN_CAPACITY * 2
    railQueue.push({ direction: 'OUT', remaining: n, urgent: true })
    console.log(`🚨 Saturation (${fillRate.toFixed(1)}%) : train d'urgence de ${n} conteneurs.`)
  }

  // --- Traitement : une voie « entrée » et une voie « sortie » en parallèle ---
  let added = 0
  let removed = 0

  const jobIn = railQueue.find((j) => j.direction === 'IN')
  if (jobIn) {
    const n = Math.min(LOGISTICS.RAIL_RATE_PER_TICK, jobIn.remaining)
    if (fillRate < LOGISTICS.HARD_LIMIT) {
      added = await addContainers(prisma, n)
      jobIn.remaining -= n
    } // parc plein : le train attend
  }

  const jobOut = railQueue.find((j) => j.direction === 'OUT')
  if (jobOut) {
    const n = Math.min(LOGISTICS.RAIL_RATE_PER_TICK, jobOut.remaining)
    removed = await removeFromYard(prisma, n)
    jobOut.remaining = removed < n ? 0 : jobOut.remaining - n // plus rien à charger : le train part
  }

  // Nettoyage des trains terminés
  for (let i = railQueue.length - 1; i >= 0; i--) {
    if (railQueue[i].remaining <= 0) railQueue.splice(i, 1)
  }

  return { added, removed }
}