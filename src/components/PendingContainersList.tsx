'use client'

import { useState } from 'react'
import { validateContainer } from '@/app/actions/containers'
import { CheckCircle2, Clock, Loader2 } from 'lucide-react'

export function PendingContainersList({ initialContainers }: { initialContainers: any[] }) {
  const [containers, setContainers] = useState(initialContainers)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleValidate = async (id: string) => {
    setLoadingId(id)
    const result = await validateContainer(id)
    
    if (result.success) {
      // On retire le conteneur de la liste locale pour un effet instantané
      setContainers((prev) => prev.filter(c => c.id !== id))
    }
    setLoadingId(null)
  }

  if (containers.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-800 rounded-xl border border-slate-700">
        <CheckCircle2 className="mx-auto text-emerald-500 mb-4" size={48} />
        <h3 className="text-lg font-bold text-white">Tout est à jour !</h3>
        <p className="text-slate-400">Aucun chargement en attente de validation.</p>
      </div>
    )
  }

  return (
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
            disabled={loadingId === container.id}
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
  )
}