import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { redirect } from 'next/navigation'
import { PendingContainersList } from '@/components/PendingContainersList'
import { Ship, Container, Anchor, MapPin, ClipboardCheck } from 'lucide-react'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

export default async function DashboardPage() {
  // 1. Récupération et vérification de la session
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) redirect('/login')

  let session: any
  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    session = payload
  } catch (error) {
    redirect('/login')
  }

  // ==========================================
  // VUE UTILISATEUR (MÉTIER / OPÉRATEUR)
  // ==========================================
  if (session.role !== 'ADMIN') {
    // On récupère les 10 derniers conteneurs en attente de validation
    const pendingContainers = await prisma.container.findMany({
      where: { status: 'PENDING' },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="text-blue-500" size={32} />
            Espace Opérateur
          </h1>
          <p className="text-slate-400 mt-2">Validez les chargements avant embarquement.</p>
        </div>

        <div className="max-w-4xl">
          <h2 className="text-xl font-semibold mb-4 text-white">Conteneurs en attente de validation</h2>
          <PendingContainersList initialContainers={pendingContainers} />
        </div>
      </div>
    )
  }

  // ==========================================
  // VUE ADMIN (STATISTIQUES GLOBALES)
  // ==========================================
  const [
    totalContainers,
    containersOnShips,
    totalShips,
    shipsInTransit,
    shipsDocked,
    shipsInMaintenance 
  ] = await Promise.all([
    prisma.container.count(),
    prisma.container.count({ where: { shipId: { not: null } } }),
    prisma.ship.count(),
    prisma.ship.count({ where: { status: 'IN_TRANSIT' } }),
    prisma.ship.count({ where: { status: 'DOCKED' } }),
    prisma.ship.count({ where: { status: 'MAINTENANCE' } }),
  ])

  const containersInStock = totalContainers - containersOnShips

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-slate-400 mt-2">Vue d'ensemble de votre flotte et de vos stocks.</p>
      </div>

      {/* Grid de Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Carte : Total Conteneurs */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Conteneurs</p>
              <p className="text-3xl font-bold mt-2">{totalContainers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
              <Container size={24} />
            </div>
          </div>
        </div>

        {/* Carte : Conteneurs en Stock */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">En Stock (Port)</p>
              <p className="text-3xl font-bold mt-2">{containersInStock.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400">
              <MapPin size={24} />
            </div>
          </div>
        </div>

        {/* Carte : Navires en Mer */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Navires en Mer</p>
              <p className="text-3xl font-bold mt-2">{shipsInTransit}</p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Ship size={24} />
            </div>
          </div>
        </div>

        {/* Carte : Navires à Quai */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Navires à Quai</p>
              <p className="text-3xl font-bold mt-2">{shipsDocked}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
              <Anchor size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Section Info */}
      <div className="mt-8 bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold mb-4">État de la flotte</h2>
        <p className="text-slate-400">
          Sur un total de <span className="text-white font-bold">{totalShips}</span> navires, 
          <span className="text-emerald-400 font-bold"> {shipsInTransit} </span> sont en mer, 
          <span className="text-blue-400 font-bold"> {shipsDocked} </span> sont à quai et 
          <span className="text-amber-400 font-bold"> {shipsInMaintenance} </span> sont en maintenance.
        </p>
        <p className="text-slate-400 mt-2">
          Vous avez actuellement <span className="text-white font-bold">{containersOnShips.toLocaleString()}</span> conteneurs chargés sur des navires.
        </p>
      </div>
    </div>
  )
}