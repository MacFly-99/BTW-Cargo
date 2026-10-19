'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Search, Ship, MapPin, ChevronLeft, ChevronRight, Package, Trash2, Pencil } from 'lucide-react'
import { deleteContainer } from '@/app/actions/containers'

const colorMap: Record<string, string> = {
  BLEU_MARINE: 'bg-blue-900',
  GRIS_METALLIQUE: 'bg-slate-500',
  BLANC: 'bg-white',
  VERT: 'bg-green-600',
  ORANGE: 'bg-orange-500',
  JAUNE: 'bg-yellow-400',
}

const DESTINATIONS = ['SHANGHAI', 'SINGAPOUR', 'NINGBO_ZHOUSHAN', 'SHENZHEN', 'GUANGZHOU', 'BUSAN', 'ROTTERDAM', 'HONG_KONG', 'ANVERS', 'LOS_ANGELES']

export function ContainerList({ 
  containers, 
  totalPages, 
  currentPage, 
  totalCount,
  currentSearch,
  currentType,
  currentStatus,
  currentDestination,
  currentColor,
  destinations,
  colors,
  isAdmin // <--- NOUVEAU PARAMÈTRE
}: any) {
  const router = useRouter()
  const pathname = usePathname()
  const [searchTerm, setSearchTerm] = useState(currentSearch)
  const [editingId, setEditingId] = useState<string | null>(null)

  const updateUrl = (newParams: Record<string, string>) => {
    const params = new URLSearchParams()
    const merged = { 
      search: currentSearch, type: currentType, status: currentStatus,
      destination: currentDestination, color: currentColor, page: currentPage.toString(),
      ...newParams 
    }
    Object.entries(merged).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    if (newParams.page === undefined) params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== currentSearch) updateUrl({ search: searchTerm })
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleDelete = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce conteneur ?')) {
      const res = await deleteContainer(id)
      if (res.error) alert(res.error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtres (inchangés) */}
      <div className="flex flex-col gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Rechercher par code (ex: MSKU...)" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white pl-10 pr-4 py-2 rounded-lg focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <select value={currentType || ''} onChange={(e) => updateUrl({ type: e.target.value })} className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
            <option value="">Tous les types</option>
            <option value="DRY">Dry</option>
            <option value="HIGH_CUBE">High Cube</option>
            <option value="OPEN_TOP">Open Top</option>
          </select>
          <select value={currentDestination || ''} onChange={(e) => updateUrl({ destination: e.target.value })} className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
            <option value="">Toutes destinations</option>
            {destinations.map((dest: string) => <option key={dest} value={dest}>{dest.replace('_', ' ')}</option>)}
          </select>
          <select value={currentColor || ''} onChange={(e) => updateUrl({ color: e.target.value })} className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
            <option value="">Toutes couleurs</option>
            {colors.map((color: string) => <option key={color} value={color}>{color.replace('_', ' ')}</option>)}
          </select>
          <select value={currentStatus || ''} onChange={(e) => updateUrl({ status: e.target.value })} className="bg-slate-900 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
            <option value="">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="VALIDATED">Validé</option>
            <option value="SHIPPED">Expédié</option>
          </select>
        </div>
        {(currentType || currentStatus || currentDestination || currentColor || currentSearch) && (
          <button onClick={() => router.push(pathname)} className="text-sm text-red-400 hover:text-red-300 self-end">Réinitialiser</button>
        )}
      </div>

      {/* Tableau */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Code</th>
              <th className="px-6 py-4">Couleur</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Destination</th>
              <th className="px-6 py-4">Emplacement</th>
              <th className="px-6 py-4">Navire</th>
              <th className="px-6 py-4">Statut</th>
              {isAdmin && <th className="px-6 py-4 text-right">Actions</th>} {/* UNIQUEMENT ADMIN */}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {containers.map((container: any) => (
              <tr key={container.id} className="hover:bg-slate-750 transition-colors">
                <td className="px-6 py-4 font-mono font-medium text-white">{container.code}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full border border-slate-600 shadow-sm ${colorMap[container.color] || 'bg-slate-500'}`}></span>
                    <span className="text-xs text-slate-400 hidden lg:inline">{container.color}</span>
                  </div>
                </td>
                <td className="px-6 py-4">{container.type}</td>
                
                <td className="px-6 py-4 text-xs font-mono text-slate-400">{container.zone} - R{container.row} S{container.slot}</td>
                <td className="px-6 py-4">
                  {container.ship ? (
                    <span className="inline-flex items-center gap-1.5 text-blue-400"><Ship size={14} /> {container.ship.name}</span>
                  ) : (
                    <span className="text-slate-500 italic">En stock</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    container.status === 'VALIDATED' ? 'bg-emerald-500/20 text-emerald-400' : 
                    container.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 
                    'bg-blue-500/20 text-blue-400'
                  }`}>{container.status}</span>
                </td>
                
                {/* BOUTON SUPPRIMER UNIQUEMENT POUR ADMIN */}
                {isAdmin && (
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(container.id)} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Supprimer">
                      <Trash2 size={18} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {containers.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-slate-500">
                  <Package size={48} className="mx-auto mb-4 opacity-50" />
                  Aucun conteneur trouvé pour ces critères.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
        <div className="text-sm text-slate-400">
          Page <span className="text-white font-medium">{currentPage}</span> sur <span className="text-white font-medium">{totalPages || 1}</span>
          <span className="ml-2 hidden sm:inline">({totalCount.toLocaleString()} résultats)</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => updateUrl({ page: (currentPage - 1).toString() })} disabled={currentPage <= 1} className="p-2 rounded-lg border border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={20} /></button>
          <button onClick={() => updateUrl({ page: (currentPage + 1).toString() })} disabled={currentPage >= totalPages} className="p-2 rounded-lg border border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>
    </div>
  )
}