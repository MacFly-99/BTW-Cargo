export const LOGISTICS = {
  // --- CAPACITÉS PHYSIQUES RÉELLES ---
  TRUCK_CAPACITY: 2,          // Un camion prend 2 conteneurs
  TRAIN_CAPACITY: 200,        // Un train évacue 200 conteneurs (un peu plus)
  CRANE_SPEED_PER_TICK: 25,   // Les grues chargent 25 conteneurs par minute
  
  // --- GESTION DES FLUX ---
  MAX_TRUCKS_PER_TICK: 10,
  MAX_TRAINS_PER_TICK: 1,     
  
  // --- SEUILS CRITIQUES ---
  SATURATION_THRESHOLD: 75,   // On évacue dès 75% de saturation
  EMPTY_THRESHOLD: 40,        
  
  // --- TEMPS ---
  TRAVEL_TIME_TICKS: 30,      // Les navires reviennent vite
}

// Génère un code de conteneur réaliste
export function generateContainerCode(): string {
  const prefixes = ['MSKU', 'MSCU', 'CMAU', 'OOLU', 'HLXU', 'TGHU']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(Math.random() * 9000000) + 1000000
  return `${prefix}${number}`
}

// Génère une destination au hasard
export function generateDestination(): string {
  const destinations = ['SHANGHAI', 'SINGAPOUR', 'NINGBO_ZHOUSHAN', 'SHENZHEN', 'GUANGZHOU', 'BUSAN', 'ROTTERDAM', 'HONG_KONG', 'ANVERS', 'LOS_ANGELES']
  return destinations[Math.floor(Math.random() * destinations.length)]
}

// Génère une couleur au hasard
export function generateColor(): string {
  const colors = ['BLEU_MARINE', 'GRIS_METALLIQUE', 'BLANC', 'VERT', 'ORANGE', 'JAUNE']
  return colors[Math.floor(Math.random() * colors.length)]
}

// Génère un type au hasard
export function generateType(): string {
  const types = ['DRY', 'HIGH_CUBE', 'OPEN_TOP']
  return types[Math.floor(Math.random() * types.length)]
}

// Génère une zone au hasard
export function generateZone(): string {
  const zones = ['Terminal Nord', 'Terminal Sud', 'Terminal Est', 'Terminal Ouest', 'Zone de Transit']
  return zones[Math.floor(Math.random() * zones.length)]
}