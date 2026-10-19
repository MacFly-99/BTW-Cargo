import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { ShipList } from '@/components/ShipList'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { RealtimeRefresher } from '@/components/RealtimeRefresher'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { CreateShipModal } from '@/components/CreateShipModal'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export default async function ShipsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>
}) {
  const params = await searchParams
  const typeFilter = params.type
  const statusFilter = params.status

  // Récupération du rôle
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  let isAdmin = false
  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie.value, new TextEncoder().encode(process.env.JWT_SECRET))
      isAdmin = payload.role === 'ADMIN'
    } catch {}
  }

  const ships = await prisma.ship.findMany({
    where: {
      type: typeFilter ? (typeFilter as any) : undefined,
      status: statusFilter ? (statusFilter as any) : undefined,
    },
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { containers: true }
      }
    }
  })

  return (
    <div className="p-8">
      <RealtimeRefresher interval={300000} /> {/* Rafraîchit toutes les 5 minutes */}
      {/* Barre d'actions avec le bouton Retour */}
      <div className="mb-6 flex justify-between items-center">
        {isAdmin && (
          <CreateShipModal />
        )}
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Flotte de Navires</h1>
        <p className="text-slate-400 mt-2">Gérez et surveillez vos porte-conteneurs.</p>
      </div>

      <ShipList 
        ships={ships} 
        currentType={typeFilter} 
        currentStatus={statusFilter} 
      />
    </div>
  )
}