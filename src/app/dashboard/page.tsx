import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { redirect } from 'next/navigation'
import { UserDashboardClient } from '@/components/UserDashboardClient'
import { RealtimeRefresher } from '@/components/RealtimeRefresher'
import { BroadcastBanner } from '@/components/BroadcastBanner'
import { Ship, Container, Anchor, MapPin, ClipboardCheck, TrendingUp, PieChart } from 'lucide-react'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

export default async function DashboardPage() {
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
    // On récupère les conteneurs à valider ET le dernier message de tour de contrôle
    const [pendingContainers, latestBroadcast] = await Promise.all([
      prisma.container.findMany({
        where: { status: 'PENDING' },
        take: 10,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.broadcast.findFirst({
        orderBy: { createdAt: 'desc' }
      })
    ])

    return (
      <div className="p-8">
        <RealtimeRefresher interval={10000} />
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ClipboardCheck className="text-blue-500" size={32} />
            Espace Opérateur
          </h1>
          <p className="text-slate-400 mt-2">Voici les actions qui vous attendent aujourd'hui.</p>
        </div>

       {/* BANDEAU DE MESSAGE DE TOUR DE CONTRÔLE */}
        {latestBroadcast && (
          <BroadcastBanner message={latestBroadcast} />
        )}
        <UserDashboardClient initialContainers={pendingContainers} />
      </div>
    )
  }

  // ==========================================
  // VUE ADMIN (STATISTIQUES GLOBALES + GRAPHIQUES)
  // ==========================================
  const [
    totalContainers,
    containersOnShips,
    totalShips,
    shipsInTransit,
    shipsDocked,
    shipsInMaintenance,
    containersByType,
    containersByDestination
  ] = await Promise.all([
    prisma.container.count(),
    prisma.container.count({ where: { shipId: { not: null } } }),
    prisma.ship.count(),
    prisma.ship.count({ where: { status: 'IN_TRANSIT' } }),
    prisma.ship.count({ where: { status: 'DOCKED' } }),
    prisma.ship.count({ where: { status: 'MAINTENANCE' } }),
    prisma.container.groupBy({
      by: ['type'],
      _count: { _all: true }
    }),
    prisma.container.groupBy({
      by: ['destination'],
      _count: { _all: true },
      orderBy: { _count: { destination: 'desc' } },
      take: 5
    })
  ])

  const containersInStock = totalContainers - containersOnShips

  // Couleurs pour le graphique des types
  const typeColors: Record<string, string> = {
    DRY: 'bg-blue-500',
    HIGH_CUBE: 'bg-emerald-500',
    OPEN_TOP: 'bg-amber-500'
  }

  return (
    <div className="p-8">
      <RealtimeRefresher interval={10000} />
      
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-slate-400 mt-2">Vue d'ensemble de votre flotte et de vos stocks.</p>
        </div>
        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
          <TrendingUp size={16} />
          <span className="text-sm font-medium">Données en direct</span>
        </div>
      </div>

      {/* Cartes de Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Total Conteneurs</p>
              <p className="text-3xl font-bold mt-2">{totalContainers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400"><Container size={24} /></div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">En Stock (Port)</p>
              <p className="text-3xl font-bold mt-2">{containersInStock.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400"><MapPin size={24} /></div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Navires en Mer</p>
              <p className="text-3xl font-bold mt-2">{shipsInTransit}</p>
            </div>
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400"><Ship size={24} /></div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-400">Navires à Quai</p>
              <p className="text-3xl font-bold mt-2">{shipsDocked}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400"><Anchor size={24} /></div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        
        {/* Graphique : Répartition par type */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <PieChart className="text-blue-500" size={20} />
            Répartition des conteneurs par type
          </h3>
          <div className="space-y-4">
            {containersByType.map((item) => {
              const percentage = (item._count._all / totalContainers) * 100
              return (
                <div key={item.type}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300 font-medium">{item.type.replace('_', ' ')}</span>
                    <span className="text-slate-400">{item._count._all.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${typeColors[item.type] || 'bg-slate-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Graphique : Top 5 destinations */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <MapPin className="text-emerald-500" size={20} />
            Top 5 des destinations
          </h3>
          <div className="space-y-3">
            {containersByDestination.map((item, index) => {
              const maxCount = containersByDestination[0]._count._all
              const percentage = (item._count._all / maxCount) * 100
              return (
                <div key={item.destination} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500 w-4">#{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{item.destination.replace('_', ' ')}</span>
                      <span className="text-slate-500">{item._count._all.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* État de la flotte */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold mb-4">État de la flotte</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-sm text-slate-400">En mer</p>
            <p className="text-2xl font-bold text-emerald-400">{shipsInTransit}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-sm text-slate-400">À quai</p>
            <p className="text-2xl font-bold text-blue-400">{shipsDocked}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-sm text-slate-400">En maintenance</p>
            <p className="text-2xl font-bold text-amber-400">{shipsInMaintenance}</p>
          </div>
        </div>
        <p className="text-slate-400 mt-4 text-sm">
          Total : <span className="text-white font-bold">{totalShips}</span> navires • 
          <span className="text-white font-bold"> {containersOnShips.toLocaleString()} </span> conteneurs actuellement chargés.
        </p>
      </div>
    </div>
  )
}