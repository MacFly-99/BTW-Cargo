import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { ShipList } from '@/components/ShipList'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

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
      {/* Barre d'actions avec le bouton Retour */}
      <div className="mb-6 flex justify-between items-center">
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} />
          Nouveau Navire
        </button>
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