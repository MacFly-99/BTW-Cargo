import { PrismaClient, ShipType, ShipStatus, ContainerType, ContainerColor, Port } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const ports = [
  Port.SHANGHAI, Port.SINGAPOUR, Port.NINGBO_ZHOUSHAN, Port.SHENZHEN, 
  Port.GUANGZHOU, Port.BUSAN, Port.ROTTERDAM, Port.HONG_KONG, 
  Port.ANVERS, Port.LOS_ANGELES
]

const routes = [
  { main: Port.SHANGHAI, secondary: [Port.NINGBO_ZHOUSHAN, Port.SHENZHEN] },
  { main: Port.SINGAPOUR, secondary: [Port.BUSAN, Port.HONG_KONG] },
  { main: Port.ROTTERDAM, secondary: [Port.ANVERS] },
  { main: Port.LOS_ANGELES, secondary: [] },
  { main: Port.GUANGZHOU, secondary: [Port.SHENZHEN] },
]

// --- IMAGES LOCALES DES NAVIRES ---
const shipsData = [
  { name: 'Le Petit Prince', type: ShipType.SMALL, capacity: 500, status: ShipStatus.DOCKED, route: routes[0], imageUrl: "/Le_Petit_Prince.jpg" },
  { name: 'La Perle', type: ShipType.SMALL, capacity: 500, status: ShipStatus.DOCKED, route: routes[1], imageUrl: "/La_Perle.jpg" },
  { name: 'L\'Étoile', type: ShipType.SMALL, capacity: 500, status: ShipStatus.IN_TRANSIT, route: routes[2], imageUrl: "/L_Etoile.jpg" },
  { name: 'Le Corsaire', type: ShipType.SMALL, capacity: 500, status: ShipStatus.DOCKED, route: routes[3], imageUrl: "/Le_Corsaire.jpg" },
  { name: 'Le Conquérant', type: ShipType.MEDIUM, capacity: 2000, status: ShipStatus.DOCKED, route: routes[4], imageUrl: "/Le_Conquerant.jpg" },
  { name: 'La Sirène', type: ShipType.MEDIUM, capacity: 2000, status: ShipStatus.IN_TRANSIT, route: routes[0], imageUrl: "/La_Sirene.jpg" },
  { name: 'Le Poséidon', type: ShipType.MEDIUM, capacity: 2000, status: ShipStatus.DOCKED, route: routes[1], imageUrl: "/Le_Poseidon.jpg" },
  { name: 'L\'Océan', type: ShipType.MEDIUM, capacity: 2000, status: ShipStatus.MAINTENANCE, route: routes[2], imageUrl: "/L_Ocean.jpg" },
  { name: 'Le Titan', type: ShipType.LARGE, capacity: 8000, status: ShipStatus.DOCKED, route: routes[3], imageUrl: "/Le_Titan.jpg" },
  { name: 'Le Colosse', type: ShipType.LARGE, capacity: 8000, status: ShipStatus.IN_TRANSIT, route: routes[4], imageUrl: "/Le_Colosse.jpg" },
  { name: 'Le Léviathan', type: ShipType.ULTRA_LARGE, capacity: 20000, status: ShipStatus.DOCKED, route: routes[0], imageUrl: "/Le_Leviathan.jpg" },
  { name: 'Le Béhémoth', type: ShipType.ULTRA_LARGE, capacity: 20000, status: ShipStatus.DOCKED, route: routes[1], imageUrl: "/Le_Behemoth.jpg" },
]

const ZONES = [
  { name: 'Terminal Nord', startRow: 1, endRow: 500 },
  { name: 'Terminal Sud', startRow: 501, endRow: 1000 },
  { name: 'Terminal Est', startRow: 1001, endRow: 1400 },
  { name: 'Terminal Ouest', startRow: 1401, endRow: 1700 },
  { name: 'Zone de Transit', startRow: 1701, endRow: 2000 },
]

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
  await prisma.user.deleteMany()
  await prisma.broadcast.deleteMany()

  // --- UTILISATEURS ---
  console.log('👤 Création des utilisateurs...')
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@btwcargo.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
  const hashedAdminPassword = await bcrypt.hash(adminPassword, 10)
  
  await prisma.user.create({
    data: { email: adminEmail, password: hashedAdminPassword, name: 'Capitaine Admin', role: 'ADMIN' }
  })

  const operatorEmail = process.env.OPERATOR_EMAIL || 'operateur@btwcargo.com'
  const operatorPassword = process.env.OPERATOR_PASSWORD || 'operateur123'
  const hashedOperatorPassword = await bcrypt.hash(operatorPassword, 10)
  
  await prisma.user.create({
    data: { email: operatorEmail, password: hashedOperatorPassword, name: 'Agent de Quai', role: 'USER' }
  })

  // --- NAVIRES ---
  console.log('⛴️ Création des 12 navires...')
  const shipsWithFillTracker: any[] = []

  for (const ship of shipsData) {
    const createdShip = await prisma.ship.create({
      data: {
        name: ship.name,
        type: ship.type,
        capacity: ship.capacity,
        status: ship.status,
        destination: ship.route.main,
        imageUrl: ship.imageUrl
      }
    })
    
    shipsWithFillTracker.push({ ...createdShip, currentFill: 0, route: ship.route })
  }

  // --- CONTENEURS ---
  // ON COMMENCE AVEC 70 000 POUR UN DÉMARRAGE À ~58%
  console.log('📦 Génération de 70 000 conteneurs...')
  const totalContainers = 70000
  const batchSize = 5000 

  for (let i = 0; i < totalContainers; i += batchSize) {
    const containersBatch = []
    
    for (let j = 0; j < batchSize; j++) {
      const globalIndex = i + j
      const globalRow = Math.floor(globalIndex / 60) + 1 
      const slot = (globalIndex % 60) + 1
      
      const zoneObj = ZONES.find(z => globalRow >= z.startRow && globalRow <= z.endRow)
      const localRow = zoneObj ? globalRow - zoneObj.startRow + 1 : 1
      const zoneName = zoneObj ? zoneObj.name : 'Zone Inconnue'

      let assignedShip = null
      let containerDestination = ports[Math.floor(Math.random() * ports.length)]
      
      // On n'assigne un conteneur à un navire que 50% du temps
      // Ça permet de garder du stock au port et de ne pas vider tous les navires d'un coup
      const shouldAssignToShip = Math.random() < 0.5

      if (shouldAssignToShip) {
        const availableShip = shipsWithFillTracker.find(ship => {
          const isDestinationValid = ship.route.main === containerDestination || ship.route.secondary.includes(containerDestination)
          return isDestinationValid && ship.currentFill < ship.capacity
        })

        if (availableShip) {
          assignedShip = availableShip
          assignedShip.currentFill += 1
        }
      }

      const containerType = assignedShip 
        ? getTypeForShip(assignedShip.type)
        : (Math.random() < 0.5 ? ContainerType.DRY : ContainerType.HIGH_CUBE)
      
      const containerColor = getColorForType(containerType)

      containersBatch.push({
        code: generateContainerCode(),
        type: containerType,
        color: containerColor,
        destination: containerDestination,
        zone: zoneName,
        row: localRow,
        slot: slot,
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