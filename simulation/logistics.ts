import { PrismaClient } from '@prisma/client'

// =========================================================
// PARAMÈTRES DE LA SIMULATION (1 tick = 30 secondes)
// =========================================================
export const LOGISTICS = {
  PORT_CAPACITY: 120000,

  // --- Régulation douce (aucune coupure brutale) ---
  TARGET_FILL: 60,            // % visé : les entrées s'ajustent autour de cette valeur
  SATURATION_THRESHOLD: 70,   // % : déclenche un train d'urgence (baissé à 70 pour plus de mouvement)
  HARD_LIMIT: 92,             // % : portes fermées, plus de déchargement, navires en rade

  // --- Camions ---
  TRUCK_CAPACITY: 2,          // conteneurs par camion
  TRUCK_IN_PEAK_PER_MIN: 28,  // camions/min à l'heure de pointe (la moyenne sur 24h est ~55 % de ça)
  DWELL_MINUTES: 2160,        // séjour moyen d'un conteneur au parc (1,5 jour)

  // --- Trains ---
  TRAIN_CAPACITY: 200,
  RAIL_RATE_PER_TICK: 20,     // conteneurs manipulés par minute sur une voie
  TRAIN_ARRIVAL_HOURS: [1, 7, 13, 19],
  TRAIN_DEPARTURE_HOURS: [4, 10, 16, 22],
  EMERGENCY_TRAIN_COOLDOWN_MS: 60 * 60_000, // 1 train d'urgence max par heure

  // --- Navires ---
  MAX_BERTHS: 5,              // postes à quai simultanés
  MAX_ULTRA_BERTHS: 1,        // un seul poste en eau profonde pour les ULTRA_LARGE
  MAX_BERTH_TICKS: 900,       // un navire repart au plus tard après 15h à quai
  YARD_FLOOR_FILL: 20,        // % : sous ce seuil, les grues ne chargent plus (rien à charger)

  // --- Maintenance en rotation (un navire différent à chaque période) ---
  MAINTENANCE_ANCHOR: '2026-11-01', // début de la 1re période (avant cette date : on ne touche à rien)
  MAINTENANCE_EVERY_DAYS: 60,       // une maintenance tous les ~2 mois
  MAINTENANCE_DURATION_DAYS: 10,    // durée d'immobilisation du navire
}

// Profil par type de navire : cadence des grues (conteneurs/min) et
// durée moyenne en mer (en minutes) avant de revenir au port.
// Les petits navires font la navette (feeders), les gros ont de longues rotations.
export const SHIP_PROFILES: Record<string, { crane: number; transitMean: number }> = {
  SMALL: { crane: 8, transitMean: 360 },        // ~6h en mer
  MEDIUM: { crane: 20, transitMean: 900 },      // ~15h
  LARGE: { crane: 45, transitMean: 1800 },      // ~30h
  ULTRA_LARGE: { crane: 60, transitMean: 2880 }, // ~48h
}

export function getShipProfile(ship: { type?: unknown; capacity: number }) {
  const byType = SHIP_PROFILES[String(ship.type)]
  if (byType) return byType
  if (ship.capacity <= 1000) return SHIP_PROFILES.SMALL
  if (ship.capacity <= 4000) return SHIP_PROFILES.MEDIUM
  if (ship.capacity <= 10000) return SHIP_PROFILES.LARGE
  return SHIP_PROFILES.ULTRA_LARGE
}

// =========================================================
// OUTILS ALÉATOIRES / TEMPORELS
// =========================================================
export const rand = (min: number, max: number) => min + Math.random() * (max - min)

// Nombre d'événements sur un tick : Poisson (approx. normale si moyenne élevée)
export function sampleCount(mean: number): number {
  if (mean <= 0) return 0
  if (mean > 30) {
    const g = (Math.random() + Math.random() + Math.random() + Math.random() - 2) * Math.sqrt(3)
    return Math.max(0, Math.round(mean + g * Math.sqrt(mean)))
  }
  const L = Math.exp(-mean)
  let k = 0
  let p = 1
  do {
    k++
    p *= Math.random()
  } while (p > L)
  return k - 1
}

// Rythme journalier : creux la nuit, pointes vers 10h et 15h
function activityAt(hour: number): number {
  const g = (c: number, s: number) => Math.exp(-0.5 * ((hour - c) / s) ** 2)
  return Math.min(1, 0.2 + 0.75 * g(10, 2.5) + 0.7 * g(15, 2.5))
}

export const MEAN_ACTIVITY = (() => {
  let s = 0
  for (let m = 0; m < 1440; m++) s += activityAt(m / 60)
  return s / 1440
})()

export function activityFactor(date: Date = new Date()): number {
  return activityAt(date.getHours() + date.getMinutes() / 60)
}

// Dérive lente de la demande (jours calmes / chargés), ±15 % environ
let drift = 0
export function demandDrift(): number {
  drift = drift * 0.995 + (Math.random() - 0.5) * 0.05
  return Math.min(1.4, Math.max(0.6, 1 + drift))
}

// Les entrées s'adaptent progressivement au remplissage (appointments / gate)
export function inboundFactor(fillRate: number): number {
  if (fillRate >= LOGISTICS.HARD_LIMIT) return 0
  return Math.min(2, Math.max(0, 1 + (LOGISTICS.TARGET_FILL - fillRate) / 25))
}

// =========================================================
// GÉNÉRATEURS DE CONTENEURS
// =========================================================
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

export function generateContainerCode(): string {
  const prefix = pick(['MSKU', 'MSCU', 'CMAU', 'OOLU', 'HLXU', 'TGHU'])
  const number = Math.floor(Math.random() * 9000000) + 1000000
  return `${prefix}${number}`
}

export const generateDestination = () =>
  pick([
    'SHANGHAI', 'SINGAPOUR', 'NINGBO_ZHOUSHAN', 'SHENZHEN', 'GUANGZHOU',
    'BUSAN', 'ROTTERDAM', 'HONG_KONG', 'ANVERS', 'LOS_ANGELES',
  ])

export const generateColor = () =>
  pick(['BLEU_MARINE', 'GRIS_METALLIQUE', 'BLANC', 'VERT', 'ORANGE', 'JAUNE'])

export const generateType = () => pick(['DRY', 'HIGH_CUBE', 'OPEN_TOP'])

export const generateZone = () =>
  pick(['Terminal Nord', 'Terminal Sud', 'Terminal Est', 'Terminal Ouest', 'Zone de Transit'])

// =========================================================
// HELPERS BASE DE DONNÉES
// =========================================================
export async function countYard(prisma: PrismaClient): Promise<number> {
  return prisma.container.count({ where: { shipId: null } })
}

// Crée n conteneurs (au parc, ou à bord d'un navire si shipId est fourni)
export async function addContainers(
  prisma: PrismaClient,
  n: number,
  shipId?: string | number
): Promise<number> {
  let created = 0
  const CHUNK = 2000
  for (let done = 0; done < n; done += CHUNK) {
    const size = Math.min(CHUNK, n - done)
    const data = Array.from({ length: size }, () => ({
      code: generateContainerCode(),
      type: generateType() as any,
      color: generateColor() as any,
      destination: generateDestination() as any,
      zone: generateZone(),
      row: Math.floor(Math.random() * 100) + 1,
      slot: Math.floor(Math.random() * 60) + 1,
      status: 'PENDING' as any,
      ...(shipId !== undefined ? { shipId: shipId as any } : {}),
    }))
    const res = await prisma.container.createMany({ data, skipDuplicates: true })
    created += res.count
  }
  return created
}

// Fait sortir n conteneurs du parc (camion / train)
export async function removeFromYard(prisma: PrismaClient, n: number): Promise<number> {
  if (n <= 0) return 0
  const rows = await prisma.container.findMany({
    where: { shipId: null },
    take: n,
    select: { id: true },
  })
  if (rows.length === 0) return 0
  const res = await prisma.container.deleteMany({
    where: { id: { in: rows.map((r) => r.id) } },
  })
  return res.count
}