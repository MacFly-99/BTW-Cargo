import { PrismaClient } from '@prisma/client'
import { LOGISTICS, getShipProfile, rand, addContainers } from './logistics'

// Cycle d'un navire :
//   en mer → arrive avec sa cargaison (import) → DÉCHARGE vers le parc
//   → CHARGE des conteneurs du parc (export) → repart (cargaison sortie du système)
//
// Cadence des grues et durée en mer dépendent du type de navire (SHIP_PROFILES).
// Les navires en MAINTENANCE sont ignorés.
//
// L'état de quai (phase) est gardé en mémoire. Après un redémarrage du serveur,
// un navire à quai repart en phase DÉCHARGEMENT (aucun conteneur n'est perdu).

type Phase = 'UNLOADING' | 'LOADING'
interface Berth {
  phase: Phase
  loadTarget: number
  sinceTick: number
}

const berths = new Map<any, Berth>()
let tickNo = 0

const isUltra = (ship: { type?: unknown; capacity: number }) =>
  String(ship.type) === 'ULTRA_LARGE' || ship.capacity > 10000

export async function simulateShipOperations(prisma: PrismaClient, stock: number) {
  tickNo++

  const yardMax = Math.floor((LOGISTICS.PORT_CAPACITY * LOGISTICS.HARD_LIMIT) / 100)
  const yardFloor = Math.floor((LOGISTICS.PORT_CAPACITY * LOGISTICS.YARD_FLOOR_FILL) / 100)
  let spaceLeft = Math.max(0, yardMax - stock)
  let unloaded = 0 // bateau → parc
  let loaded = 0 // parc → bateau

  // On lit les deux listes AVANT toute modification (pas de départ/retour dans le même tick)
  const inTransit = await prisma.ship.findMany({
    where: { status: 'IN_TRANSIT' },
    include: { _count: { select: { containers: true } } },
  })
  const docked = await prisma.ship.findMany({
    where: { status: 'DOCKED' },
    include: { _count: { select: { containers: true } } },
  })
  let dockedCount = docked.length
  let dockedUltra = docked.filter(isUltra).length

  // ---------- 1. NAVIRES À QUAI ----------
  for (const ship of docked) {
    const onboard = ship._count.containers
    const profile = getShipProfile(ship)

    let berth = berths.get(ship.id)
    if (!berth) {
      berth = { phase: 'UNLOADING', loadTarget: 0, sinceTick: tickNo }
      berths.set(ship.id, berth)
    }

    const crane = Math.max(1, Math.round(profile.crane * rand(0.6, 1.1)))

    if (berth.phase === 'UNLOADING') {
      if (onboard === 0) {
        berth.phase = 'LOADING'
        berth.loadTarget = Math.round(ship.capacity * rand(0.55, 0.9))
        console.log(`🏗️ ${ship.name} : déchargement terminé, début du chargement (cible ${berth.loadTarget}).`)
        continue
      }

      // Si le parc est saturé, les grues s'arrêtent : le navire attend
      const n = Math.min(crane, onboard, spaceLeft)
      if (n > 0) {
        const rows = await prisma.container.findMany({
          where: { shipId: ship.id },
          take: n,
          select: { id: true },
        })
        if (rows.length > 0) {
          await prisma.container.updateMany({
            where: { id: { in: rows.map((r) => r.id) } },
            data: { shipId: null },
          })
          unloaded += rows.length
          spaceLeft -= rows.length
        }
      }
      continue
    }

    // phase LOADING
    const timeout = tickNo - berth.sinceTick > LOGISTICS.MAX_BERTH_TICKS
    if (onboard >= berth.loadTarget || timeout) {
      // Départ : la cargaison quitte le système
      await prisma.container.deleteMany({ where: { shipId: ship.id } })
      await prisma.ship.update({ where: { id: ship.id }, data: { status: 'IN_TRANSIT' } })
      berths.delete(ship.id)
      dockedCount--
      if (isUltra(ship)) dockedUltra--
      console.log(`🚢 ${ship.name} quitte le port avec ${onboard} conteneurs${timeout ? ' (départ forcé)' : ''}.`)
      continue
    }

    // On ne vide pas le parc : sous le plancher, les grues attendent
    const loadable = Math.max(0, stock + unloaded - loaded - yardFloor)
    const n = Math.min(crane, berth.loadTarget - onboard, loadable)
    if (n > 0) {
      const rows = await prisma.container.findMany({
        where: { shipId: null },
        take: n,
        select: { id: true },
      })
      if (rows.length > 0) {
        await prisma.container.updateMany({
          where: { id: { in: rows.map((r) => r.id) } },
          data: { shipId: ship.id },
        })
        loaded += rows.length
      }
    }
  }

  // ---------- 2. ARRIVÉES (retour de mer) ----------
  for (const ship of inTransit) {
    if (dockedCount >= LOGISTICS.MAX_BERTHS) break // tous les postes sont occupés
    if (isUltra(ship) && dockedUltra >= LOGISTICS.MAX_ULTRA_BERTHS) continue // poste profond pris

    const profile = getShipProfile(ship)
    if (Math.random() >= 1 / profile.transitMean) continue

    // Conteneurs déjà à bord (anciennes données) : ils comptent dans la cargaison
    const existing = ship._count.containers
    const cargo = Math.max(0, Math.round(ship.capacity * rand(0.45, 0.85)) - existing)
    if (spaceLeft < cargo + existing) continue // pas la place pour sa cargaison : reste au mouillage

    await prisma.ship.update({ where: { id: ship.id }, data: { status: 'DOCKED' } })
    const created = existing + (await addContainers(prisma, cargo, ship.id))
    berths.set(ship.id, { phase: 'UNLOADING', loadTarget: 0, sinceTick: tickNo })
    dockedCount++
    if (isUltra(ship)) dockedUltra++
    console.log(`⚓ ${ship.name} accoste avec ${created} conteneurs à décharger.`)
  }

  return { unloaded, loaded }
}