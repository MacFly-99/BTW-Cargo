import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  try {
    // 1. Les navires à quai et pleins partent en mer
    const fullShips = await prisma.ship.findMany({
      where: { status: 'DOCKED' },
      include: { _count: { select: { containers: true } } }
    })

    for (const ship of fullShips) {
      if (ship._count.containers >= ship.capacity) {
        await prisma.ship.update({
          where: { id: ship.id },
          data: { status: 'IN_TRANSIT' }
        })
      }
    }

    // 2. Les navires en mer (simulation : on les fait revenir au port aléatoirement)
    // Dans la vraie vie, on comparerait la date de départ + durée du trajet.
    // Ici, on va dire que 1 navire sur 3 revient au port pour le déchargement.
    const shipsInTransit = await prisma.ship.findMany({
      where: { status: 'IN_TRANSIT' }
    })

    for (const ship of shipsInTransit) {
      if (Math.random() < 0.33) { // 33% de chance de revenir
        await prisma.ship.update({
          where: { id: ship.id },
          data: { status: 'DOCKED' }
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Simulation effectuée.' })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur de simulation.' }, { status: 500 })
  }
}