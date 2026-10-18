import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

export async function GET() {
  // 1. Vérification de sécurité (Seul l'admin peut appeler cette API)
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  } catch {
    return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
  }

  // 2. Récupération des données
  const [
    totalUsers,
    recentContainers,
    totalContainers,
    shipsInTransit
  ] = await Promise.all([
    prisma.user.count(),
    // On récupère les 5 derniers conteneurs ajoutés (pour le fil d'actualité)
    prisma.container.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, code: true, type: true, createdAt: true }
    }),
    prisma.container.count(),
    prisma.ship.count({ where: { status: 'IN_TRANSIT' } })
  ])

  // 3. On renvoie tout ça en JSON
  return NextResponse.json({
    totalUsers,
    totalContainers,
    shipsInTransit,
    recentContainers
  })
}