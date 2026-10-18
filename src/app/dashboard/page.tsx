import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Ship, Container, Anchor, MapPin } from 'lucide-react'
import { AdminRealtimeStats } from '@/components/AdminRealtimeStats' // <-- IMPORT

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export default async function DashboardPage() {
  // On fait les requêtes en parallèle pour aller plus vite
  const [
    totalContainers,
    containersOnShips,
    totalShips,
    shipsInTransit,
    shipsDocked
  ] = await Promise.all([
    prisma.container.count(),
    prisma.container.count({ where: { shipId: { not: null } } }),
    prisma.ship.count(),
    prisma.ship.count({ where: { status: 'IN_TRANSIT' } }),
    prisma.ship.count({ where: { status: 'DOCKED' } }),
  ])

  const containersInStock = totalContainers - containersOnShips

   return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Gestion Globale (Admin)</h1>
      <p className="text-slate-400 mb-8">Supervision de l'application en temps réel.</p>
      
      {/* On appelle notre composant d'affichage en temps réel */}
      <AdminRealtimeStats />
    </div>
   )


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

        {/* Carte : Navires Actifs */}
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
          <span className="text-emerald-400 font-bold"> {shipsInTransit} </span> sont actuellement en mer et 
          <span className="text-blue-400 font-bold"> {shipsDocked} </span> sont à quai.
        </p>
        <p className="text-slate-400 mt-2">
          Vous avez actuellement <span className="text-white font-bold">{containersOnShips.toLocaleString()}</span> conteneurs chargés sur des navires.
        </p>
      </div>
}