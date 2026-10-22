'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Ship, Anchor, Navigation, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

type ShipWithCount = {
  id: string
  name: string
  type: string
  status: string
  capacity: number
  destination: string | null
  imageUrl: string | null
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
  const [actionFilter, setActionFilter] = useState<string>('')

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams()
    if (currentType && key !== 'type') params.set('type', currentType)
    if (currentStatus && key !== 'status') params.set('status', currentStatus)
    if (value) params.set(key, value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DOCKED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'IN_TRANSIT': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'MAINTENANCE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'SMALL': return <Navigation size={16} />
      case 'MEDIUM': return <Ship size={16} />
      case 'LARGE': return <Ship size={20} />
      case 'ULTRA_LARGE': return <Anchor size={20} />
      default: return <Ship size={16} />
    }
  }

  const getLogisticsState = (ship: ShipWithCount) => {
    const fillRate = (ship._count.containers / ship.capacity) * 100
    
    if (ship.status === 'MAINTENANCE') {
      return { label: 'En maintenance', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', code: 'maintenance' }
    }
    if (ship.status === 'DOCKED' && fillRate >= 100) {
      return { label: 'Prêt à partir', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', code: 'ready' }
    }
    if (ship.status === 'DOCKED' && fillRate < 100) {
      return { label: 'À charger', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', code: 'load' }
    }
    if (ship.status === 'IN_TRANSIT') {
      return { label: 'À décharger', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20', code: 'unload' }
    }
    return { label: 'Inconnu', color: 'text-slate-400', code: 'unknown' }
  }

  const filteredShips = ships.filter(ship => {
    if (!actionFilter) return true
    return getLogisticsState(ship).code === actionFilter
  })

  return (
    <div className="space-y-6">
      {/* Barre de Filtres */}
      <div className="flex flex-wrap gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Type :</span>
          <select value={currentType || ''} onChange={(e) => updateFilter('type', e.target.value)} className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
            <option value="">Tous les types</option>
            <option value="SMALL">Petit</option>
            <option value="MEDIUM">Moyen</option>
            <option value="LARGE">Grand</option>
            <option value="ULTRA_LARGE">Ultra-Grand</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Statut :</span>
          <select value={currentStatus || ''} onChange={(e) => updateFilter('status', e.target.value)} className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
            <option value="">Tous les statuts</option>
            <option value="DOCKED">À Quai</option>
            <option value="IN_TRANSIT">En Mer</option>
            <option value="MAINTENANCE">En Maintenance</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Opération :</span>
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
            <option value="">Toutes les opérations</option>
            <option value="load">À charger (Quai)</option>
            <option value="unload">À décharger (Mer)</option>
            <option value="ready">Prêt à partir</option>
          </select>
        </div>
        
        {(currentType || currentStatus || actionFilter) && (
          <button onClick={() => { setActionFilter(''); router.push(pathname) }} className="text-sm text-red-400 hover:text-red-300 transition-colors ml-auto">
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Grille de Navires */}
      {filteredShips.length === 0 ? (
        <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700">
          <Search className="mx-auto text-slate-500 mb-4" size={48} />
          <h3 className="text-lg font-bold text-white">Aucun navire trouvé</h3>
          <p className="text-slate-400">Essayez de modifier vos filtres de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShips.map((ship) => {
            const logistics = getLogisticsState(ship)
            const fillRate = Math.min((ship._count.containers / ship.capacity) * 100, 100)
            
            return (
              <Link 
                key={ship.id} 
                href={`/dashboard/ships/${ship.id}`}
                className="group block bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-blue-500/50 hover:bg-slate-750 transition-all flex flex-col"
              >
                {/* L'image du navire */}
                <div className="h-32 w-full rounded-lg overflow-hidden mb-4 relative bg-slate-900">
                  <img 
                    src={ship.imageUrl || "/Le_Titan.jpg"} 
                    alt={ship.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-transparent"></div>
                </div>

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
                
                <div className="space-y-3 mb-4 flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Destination</span>
                    <span className="text-slate-300 font-medium">{ship.destination || 'N/A'}</span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Chargement</span>
                      <span className="text-slate-300">{ship._count.containers.toLocaleString()} / {ship.capacity.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${fillRate >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${fillRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/50 mt-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">Opération requise</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded border ${logistics.color}`}>
                      {logistics.label}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}