import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

const PORT_CAPACITY = 120000 // On centralise la capacité ici

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  } catch {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  // On récupère les données ET le nombre total de conteneurs
  const [
    totalUsers,
    recentContainers,
    totalContainers,
    shipsInTransit
  ] = await Promise.all([
    prisma.user.count(),
    prisma.container.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, code: true, type: true, createdAt: true }
    }),
    prisma.container.count(),
    prisma.ship.count({ where: { status: 'IN_TRANSIT' } })
  ])

  // Calcul de l'espace restant
  const remainingSpace = PORT_CAPACITY - totalContainers

  return NextResponse.json({
    totalUsers,
    totalContainers,
    shipsInTransit,
    recentContainers,
    remainingSpace,
    portCapacity: PORT_CAPACITY
  })
}