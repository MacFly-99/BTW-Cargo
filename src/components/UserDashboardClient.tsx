'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react'
import { validateContainer } from '@/app/actions/containers'

export function UserDashboardClient({ initialContainers }: { initialContainers: any[] }) {
  
  const [containers, setContainers] = useState(initialContainers)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  // Timer de 15 minutes pour rafraîchir depuis le serveur
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, 900000) // 15 minutes

    return () => clearInterval(interval)
  }, [router])

  const handleValidate = async (id: string) => {
    setLoadingId(id)
    
    // On retire immédiatement le conteneur de la liste locale (Optimistic UI)
    const newList = containers.filter(c => c.id !== id)
    setContainers(newList)

    // On lance la validation en arrière-plan
    const result = await validateContainer(id)
    
    if (!result.success) {
      // En cas d'erreur, on remet le conteneur (rollback)
      setContainers((prev) => [...prev, containers.find(c => c.id === id)])
    }

    setLoadingId(null)

    // Si la liste est vide après cette validation, on tente de recharger
    if (newList.length === 0) {
      setIsRefreshing(true)
      router.refresh()
      setTimeout(() => setIsRefreshing(false), 1000)
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    // On laisse un petit temps pour que le serveur traite la demande
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const nextContainer = containers.length > 0 ? containers[0] : null

  return (
    <div className="space-y-8">
      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-white/80 font-medium mb-1">Conteneurs en attente</h3>
            <p className="text-4xl font-bold text-white">{containers.length}</p>
            <p className="text-blue-200 text-sm mt-2">À valider pour embarquement</p>
          </div>
          <Clock className="absolute -right-4 -bottom-4 text-blue-500/30" size={120} />
        </div>

        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
          <h3 className="text-slate-400 font-medium mb-1">Votre prochaine action</h3>
          <p className="text-lg font-bold text-white mt-2">
            {nextContainer 
              ? `Valider le conteneur ${nextContainer.code}` 
              : isRefreshing ? "Recherche de nouveaux conteneurs..." : "Tout est à jour !"}
          </p>
          
          {nextContainer && (
            <a href="#pending-list" className="inline-block mt-4 text-sm bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors">
              Aller à la liste ↓
            </a>
          )}

          {isRefreshing && (
            <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm">
              <RefreshCw className="animate-spin" size={16} />
              Actualisation en cours...
            </div>
          )}
        </div>
      </div>

      {/* File d'attente */}
      <div id="pending-list" className="max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">File d'attente de validation</h2>
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={isRefreshing ? "animate-spin" : ""} size={16} />
            Actualiser
          </button>
        </div>
        
        {containers.length === 0 ? (
          <div className="text-center p-8 bg-slate-800 rounded-xl border border-slate-700">
            <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
            <h3 className="text-lg font-bold text-white">Tout est à jour !</h3>
            <p className="text-slate-400">Aucun chargement en attente. La page s'actualisera automatiquement dans 15 minutes.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {containers.map((container) => (
              <div key={container.id} className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-mono font-bold text-white">{container.code}</p>
                    <p className="text-xs text-slate-400">
                      {container.type} • {container.destination} • Zone {container.zone}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => handleValidate(container.id)}
                  disabled={loadingId === container.id || isRefreshing}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {loadingId === container.id ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                  Valider
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}