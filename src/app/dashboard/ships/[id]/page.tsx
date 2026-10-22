import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Ship as ShipIcon, Anchor, Navigation, MapPin, Box, PackageOpen } from 'lucide-react'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { DeleteShipButton } from '@/components/DeleteShipButton'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

export default async function ShipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  let isAdmin = false
  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
      isAdmin = payload.role === 'ADMIN'
    } catch {}
  }

  const ship = await prisma.ship.findUnique({
    where: { id },
    include: {
      containers: {
        take: 50,
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: { containers: true }
      }
    }
  })

  if (!ship) {
    notFound()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DOCKED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'IN_TRANSIT': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'MAINTENANCE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getTypeIcon = () => {
    switch (ship.type) {
      case 'SMALL': return <Navigation size={32} />
      case 'MEDIUM': return <ShipIcon size={32} />
      case 'LARGE': return <ShipIcon size={40} />
      case 'ULTRA_LARGE': return <Anchor size={40} />
      default: return <ShipIcon size={32} />
    }
  }

  return (
    <div className="p-8">
      <Link 
        href="/dashboard/ships" 
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Retour à la flotte
      </Link>

      {/* En-tête du Navire */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-8 relative">
        <div className="h-64 w-full relative">
          <img 
            src={ship.imageUrl || "/Le_Titan.jpg"} 
            alt={ship.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent"></div>
        </div>

        <div className="p-8 relative -mt-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-slate-900 rounded-xl text-blue-400 shadow-inner border border-slate-700">
                {getTypeIcon()}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{ship.name}</h1>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-400">Type : <span className="text-slate-200 font-medium">{ship.type.replace('_', ' ')}</span></span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">Destination : <span className="text-slate-200 font-medium">{ship.destination}</span></span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              {isAdmin && (
                <DeleteShipButton 
                  shipId={ship.id} 
                  shipName={ship.name} 
                  containerCount={ship._count.containers} 
                />
              )}

              <span className={`text-sm font-medium px-4 py-1.5 rounded-full border ${getStatusColor(ship.status)}`}>
                {ship.status === 'DOCKED' ? 'À Quai' : ship.status === 'IN_TRANSIT' ? 'En Mer' : 'En Maintenance'}
              </span>
              <div className="text-right mt-2">
                <p className="text-xs text-slate-400 mb-1">Taux de remplissage</p>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${Math.min((ship._count.containers / ship.capacity) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-white">
                    {Math.round((ship._count.containers / ship.capacity) * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {ship._count.containers.toLocaleString()} / {ship.capacity.toLocaleString()} TEU
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des conteneurs */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Conteneurs à bord</h2>
            <p className="text-slate-400 text-sm mt-1">Affichage des 50 derniers conteneurs chargés.</p>
          </div>
        </div>

        {ship.containers.length === 0 ? (
          <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700">
            <PackageOpen className="mx-auto text-slate-500 mb-4" size={48} />
            <h3 className="text-lg font-bold text-white">Navire vide</h3>
            <p className="text-slate-400">Aucun conteneur n'est actuellement chargé sur ce navire.</p>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Code Conteneur</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Destination</th>
                  <th className="px-6 py-4">Emplacement</th>
                  <th className="px-6 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {ship.containers.map((container) => (
                  <tr key={container.id} className="hover:bg-slate-750 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-white">
                      <Link href={`/dashboard/containers/${container.id}`} className="hover:text-blue-400 transition-colors">
                        {container.code}
                      </Link>
                    </td>
                    <td className="px-6 py-4">{container.type}</td>
                    <td className="px-6 py-4 flex items-center gap-2">
                      <MapPin size={14} className="text-slate-500" />
                      {container.destination}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md text-xs font-medium">
                        <Box size={12} className="text-slate-400" />
                        {container.zone} - R{container.row} S{container.slot}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        container.status === 'VALIDATED' ? 'bg-emerald-500/20 text-emerald-400' : 
                        container.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {container.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}