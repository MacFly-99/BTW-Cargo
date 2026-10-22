import { PrismaClient } from '@prisma/client'
import { LOGISTICS } from './logistics'

// Rotation de maintenance, sans champ supplémentaire en base :
// le calendrier est calculé à partir de la date, donc il survit aux redémarrages.
//  - le temps est découpé en périodes de MAINTENANCE_EVERY_DAYS à partir de MAINTENANCE_ANCHOR
//  - au début de chaque période, un navire entre en maintenance pendant MAINTENANCE_DURATION_DAYS
//  - la période n choisit le navire n (modulo la taille de la flotte) : ce n'est jamais le même d'affilée
//  - un navire à quai termine son escale et repart avant d'entrer en maintenance
//  - les autres navires en MAINTENANCE sont remis en service

const DAY = 86_400_000
let calls = 0

export async function updateMaintenance(prisma: PrismaClient) {
  // Vérification une fois par heure (le premier appel passe immédiatement)
  if (calls++ % 60 !== 0) return

  const anchor = new Date(LOGISTICS.MAINTENANCE_ANCHOR).getTime()
  const now = Date.now()
  if (now < anchor) return // rotation pas encore commencée

  const period = LOGISTICS.MAINTENANCE_EVERY_DAYS * DAY
  const index = Math.floor((now - anchor) / period)
  const inWindow = (now - anchor) % period < LOGISTICS.MAINTENANCE_DURATION_DAYS * DAY

  const fleet = await prisma.ship.findMany({ orderBy: { id: 'asc' } })
  if (fleet.length === 0) return
  const scheduled = inWindow ? fleet[index % fleet.length] : null

  // 1. Remise en service
  for (const ship of fleet) {
    if (String(ship.status) === 'MAINTENANCE' && ship.id !== scheduled?.id) {
      await prisma.ship.update({ where: { id: ship.id }, data: { status: 'IN_TRANSIT' } })
      console.log(`🔧✅ ${ship.name} sort de maintenance et reprend la mer.`)
    }
  }

  // 2. Entrée en maintenance (uniquement depuis la mer ; à quai, on attend son départ)
  if (scheduled && String(scheduled.status) === 'IN_TRANSIT') {
    await prisma.container.deleteMany({ where: { shipId: scheduled.id } })
    await prisma.ship.update({ where: { id: scheduled.id }, data: { status: 'MAINTENANCE' } })
    console.log(`🔧 ${scheduled.name} entre en maintenance pour ${LOGISTICS.MAINTENANCE_DURATION_DAYS} jours.`)
  }
}