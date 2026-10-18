'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Ship, Anchor, Navigation, Wrench, Search } from 'lucide-react'
import Link from 'next/link'

// On définit les types pour TypeScript
type ShipWithCount = {
  id: string
  name: string
  type: string
  status: string
  capacity: number
  destination: string | null
  _count: { containers: number }
}

export function ShipList({ 
  ships, 
  currentType, 
  currentStatus 
}: { 
  ships: ShipWithCount[]
  currentType?: string
  currentStatus?: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  // Fonction pour mettre à jour l'URL quand on change un filtre
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams()
    if (currentType && key !== 'type') params.set('type', currentType)
    if (currentStatus && key !== 'status') params.set('status', currentStatus)
    
    if (value) {
      params.set(key, value)
    }
    
    router.push(`${pathname}?${params.toString()}`)
  }

  // Couleurs selon le statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DOCKED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'IN_TRANSIT': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'MAINTENANCE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  // Icônes selon le type
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SMALL': return <Navigation size={16} />
      case 'MEDIUM': return <Ship size={16} />
      case 'LARGE': return <Ship size={20} />
      case 'ULTRA_LARGE': return <Anchor size={20} />
      default: return <Ship size={16} />
    }
  }

  return (
    <div className="space-y-6">
      {/* Barre de Filtres */}
      <div className="flex flex-wrap gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Type :</span>
          <select 
            value={currentType || ''} 
            onChange={(e) => updateFilter('type', e.target.value)}
            className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tous les types</option>
            <option value="SMALL">Petit</option>
            <option value="MEDIUM">Moyen</option>
            <option value="LARGE">Grand</option>
            <option value="ULTRA_LARGE">Ultra-Grand</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Statut :</span>
          <select 
            value={currentStatus || ''} 
            onChange={(e) => updateFilter('status', e.target.value)}
            className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Tous les statuts</option>
            <option value="DOCKED">À Quai</option>
            <option value="IN_TRANSIT">En Mer</option>
            <option value="MAINTENANCE">En Maintenance</option>
          </select>
        </div>
        
        {(currentType || currentStatus) && (
          <button 
            onClick={() => router.push(pathname)}
            className="text-sm text-red-400 hover:text-red-300 transition-colors ml-auto"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Grille de Navires */}
      {ships.length === 0 ? (
        <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700">
          <Search className="mx-auto text-slate-500 mb-4" size={48} />
          <h3 className="text-lg font-bold text-white">Aucun navire trouvé</h3>
          <p className="text-slate-400">Essayez de modifier vos filtres de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ships.map((ship) => (
            <Link 
            key={ship.id} 
            href={`/dashboard/ships/${ship.id}`}
            className="group block bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-blue-500/50 hover:bg-slate-750 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-slate-900 rounded-lg text-slate-300 group-hover:text-blue-400 transition-colors">
                  {getTypeIcon(ship.type)}
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStatusColor(ship.status)}`}>
                  {ship.status === 'DOCKED' ? 'À Quai' : ship.status === 'IN_TRANSIT' ? 'En Mer' : 'Maintenance'}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-1">{ship.name}</h3>
              <p className="text-sm text-slate-400 mb-4">Type : {ship.type.replace('_', ' ')}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Destination</span>
                  <span className="text-slate-300 font-medium">{ship.destination || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Capacité</span>
                  <span className="text-slate-300 font-medium">{ship.capacity.toLocaleString()} TEU</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Chargement actuel</span>
                  <span className="text-blue-400 font-bold">{ship._count.containers.toLocaleString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}