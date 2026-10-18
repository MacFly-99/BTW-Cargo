import { PrismaClient, ShipType, ShipStatus, ContainerType, ContainerColor, Port } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config' // Pour charger la variable DATABASE_URL

// On crée l'adaptateur avec l'URL de connexion
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })

// On passe l'adaptateur au client Prisma
const prisma = new PrismaClient({ adapter })

// --- 1. DÉFINITION DES PORTS ---
const ports = [
  Port.SHANGHAI, Port.SINGAPOUR, Port.NINGBO_ZHOUSHAN, Port.SHENZHEN, 
  Port.GUANGZHOU, Port.BUSAN, Port.ROTTERDAM, Port.HONG_KONG, 
  Port.ANVERS, Port.LOS_ANGELES
]

// --- 2. DÉFINITION DES ROUTES MARITIMES ---
const routes = [
  { main: Port.SHANGHAI, secondary: [Port.NINGBO_ZHOUSHAN, Port.SHENZHEN] },
  { main: Port.SINGAPOUR, secondary: [Port.BUSAN, Port.HONG_KONG] },
  { main: Port.ROTTERDAM, secondary: [Port.ANVERS] },
  { main: Port.LOS_ANGELES, secondary: [] },
  { main: Port.GUANGZHOU, secondary: [Port.SHENZHEN] },
]

// --- 3. CONFIGURATION DES NAVIRES ---
const shipsData = [
  { name: 'Le Petit Prince', type: ShipType.SMALL, capacity: 500, status: ShipStatus.DOCKED, route: routes[0] },
  { name: 'La Perle', type: ShipType.SMALL, capacity: 500, status: ShipStatus.DOCKED, route: routes[1] },
  { name: 'L\'Étoile', type: ShipType.SMALL, capacity: 500, status: ShipStatus.IN_TRANSIT, route: routes[2] },
  { name: 'Le Corsaire', type: ShipType.SMALL, capacity: 500, status: ShipStatus.DOCKED, route: routes[3] },
  { name: 'Le Conquérant', type: ShipType.MEDIUM, capacity: 2000, status: ShipStatus.DOCKED, route: routes[4] },
  { name: 'La Sirène', type: ShipType.MEDIUM, capacity: 2000, status: ShipStatus.IN_TRANSIT, route: routes[0] },
  { name: 'Le Poséidon', type: ShipType.MEDIUM, capacity: 2000, status: ShipStatus.DOCKED, route: routes[1] },
  { name: 'L\'Océan', type: ShipType.MEDIUM, capacity: 2000, status: ShipStatus.MAINTENANCE, route: routes[2] },
  { name: 'Le Titan', type: ShipType.LARGE, capacity: 8000, status: ShipStatus.DOCKED, route: routes[3] },
  { name: 'Le Colosse', type: ShipType.LARGE, capacity: 8000, status: ShipStatus.IN_TRANSIT, route: routes[4] },
  { name: 'Le Léviathan', type: ShipType.ULTRA_LARGE, capacity: 20000, status: ShipStatus.DOCKED, route: routes[0] },
  { name: 'Le Béhémoth', type: ShipType.ULTRA_LARGE, capacity: 20000, status: ShipStatus.DOCKED, route: routes[1] },
]

// --- 4. DÉFINITION DES ZONES ET DE LEUR CAPACITÉ ---
// Chaque rangée a 60 slots (10x6). On définit les rangées par terminal.
const ZONES = [
  { name: 'Terminal Nord', startRow: 1, endRow: 500 },       // 30 000 places
  { name: 'Terminal Sud', startRow: 501, endRow: 1000 },     // 30 000 places
  { name: 'Terminal Est', startRow: 1001, endRow: 1400 },    // 24 000 places
  { name: 'Terminal Ouest', startRow: 1401, endRow: 1700 },  // 18 000 places
  { name: 'Zone de Transit', startRow: 1701, endRow: 2000 }, // 18 000 places
]

// --- 5. LOGIQUE DE COULEUR SELON LE TYPE ---
const getColorForType = (type: ContainerType): ContainerColor => {
  switch (type) {
    case ContainerType.DRY:
      return Math.random() > 0.5 ? ContainerColor.BLEU_MARINE : ContainerColor.GRIS_METALLIQUE
    case ContainerType.HIGH_CUBE:
      return Math.random() > 0.5 ? ContainerColor.BLANC : ContainerColor.VERT
    case ContainerType.OPEN_TOP:
      return Math.random() > 0.5 ? ContainerColor.ORANGE : ContainerColor.JAUNE
  }
}

// --- 6. LOGIQUE DE TYPE SELON LE NAVIRE ---
const getTypeForShip = (shipType: ShipType): ContainerType => {
  const rand = Math.random()
  if (shipType === ShipType.SMALL) {
    return rand < 0.7 ? ContainerType.DRY : (rand < 0.9 ? ContainerType.HIGH_CUBE : ContainerType.OPEN_TOP)
  } else if (shipType === ShipType.MEDIUM || shipType === ShipType.LARGE) {
    return rand < 0.4 ? ContainerType.DRY : (rand < 0.8 ? ContainerType.HIGH_CUBE : ContainerType.OPEN_TOP)
  } else {
    return rand < 0.2 ? ContainerType.DRY : (rand < 0.7 ? ContainerType.HIGH_CUBE : ContainerType.OPEN_TOP)
  }
}

function generateContainerCode() {
  const prefixes = ['MSKU', 'MSCU', 'CMAU', 'OOLU', 'HLXU', 'TGHU', 'EGHU']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(Math.random() * 9000000) + 1000000
  return `${prefix}${number}`
}

async function main() {
  console.log('🚀 Début du remplissage de la base de données...')

  await prisma.container.deleteMany()
  await prisma.ship.deleteMany()

  console.log('⛴️ Création des 12 navires...')
  
  const shipsWithFillTracker: any[] = []

  for (const ship of shipsData) {
    const createdShip = await prisma.ship.create({
      data: {
        name: ship.name,
        type: ship.type,
        capacity: ship.capacity,
        status: ship.status,
        destination: ship.route.main
      }
    })
    
    shipsWithFillTracker.push({
      ...createdShip,
      currentFill: 0,
      route: ship.route
    })
  }

  console.log('📦 Génération de 100 000 conteneurs...')
  
  const totalContainers = 100000
  const batchSize = 5000 

  for (let i = 0; i < totalContainers; i += batchSize) {
    const containersBatch = []
    
    for (let j = 0; j < batchSize; j++) {
      const globalIndex = i + j
      
      // --- A. ADRESSAGE PHYSIQUE ---
      // On calcule la rangée globale (1 à 2000)
      const globalRow = Math.floor(globalIndex / 60) + 1 
      const slot = (globalIndex % 60) + 1
      
      // On trouve la zone correspondante à cette rangée globale
      const zoneObj = ZONES.find(z => globalRow >= z.startRow && globalRow <= z.endRow)
      
      // On calcule la rangée LOCALE à l'intérieur de la zone (ex: Row 1 à 500 pour Terminal Nord)
      const localRow = zoneObj ? globalRow - zoneObj.startRow + 1 : 1
      const zoneName = zoneObj ? zoneObj.name : 'Zone Inconnue'

      // --- B. CHOIX DU NAVIRE ET DE LA DESTINATION ---
      let assignedShip = null
      let containerDestination = ports[Math.floor(Math.random() * ports.length)]
      
      const availableShip = shipsWithFillTracker.find(ship => {
        const isDestinationValid = ship.route.main === containerDestination || ship.route.secondary.includes(containerDestination)
        return isDestinationValid && ship.currentFill < ship.capacity
      })

      if (availableShip) {
        assignedShip = availableShip
        assignedShip.currentFill += 1
      }

      // --- C. DÉTERMINATION DU TYPE ET DE LA COULEUR ---
      const containerType = assignedShip 
        ? getTypeForShip(assignedShip.type)
        : (Math.random() < 0.5 ? ContainerType.DRY : ContainerType.HIGH_CUBE)
      
      const containerColor = getColorForType(containerType)

      containersBatch.push({
        code: generateContainerCode(),
        type: containerType,
        color: containerColor,
        destination: containerDestination,
        zone: zoneName,     // Ex: "Terminal Nord"
        row: localRow,      // Ex: 1 à 500
        slot: slot,         // Ex: 1 à 60
        shipId: assignedShip ? assignedShip.id : null
      })
    }

    await prisma.container.createMany({
      data: containersBatch,
      skipDuplicates: true,
    })
    
    console.log(`✅ ${i + batchSize} / ${totalContainers} conteneurs insérés...`)
  }

  console.log('🎉 Base de données remplie avec succès !')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })