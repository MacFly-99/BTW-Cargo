'use client'

import { useState } from 'react'
import { createShip } from '@/app/actions/ships'
import { X, Ship, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function CreateShipModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createShip(formData)

    if (result.error) {
      setError(result.error)
      toast.error("Erreur", { description: result.error })
    } else {
      toast.success("Navire créé", { description: "Le navire a été ajouté à la flotte." })
      setIsOpen(false)
      // On force le rechargement pour voir le nouveau navire
      window.location.reload()
    }
    setIsPending(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <Ship size={18} />
        Nouveau Navire
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Ship className="text-blue-500" />
            Nouveau Navire
          </h2>
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nom du navire</label>
            <input name="name" placeholder="ex: Le Magnifique" required className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Type de navire</label>
            <select name="type" required className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2">
              <option value="SMALL">Petit (500 TEU)</option>
              <option value="MEDIUM">Moyen (2 000 TEU)</option>
              <option value="LARGE">Grand (8 000 TEU)</option>
              <option value="ULTRA_LARGE">Ultra-Grand (20 000 TEU)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Destination principale</label>
            <select name="destination" required className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2">
              <option value="SHANGHAI">Shanghai</option>
              <option value="SINGAPOUR">Singapour</option>
              <option value="NINGBO_ZHOUSHAN">Ningbo-Zhoushan</option>
              <option value="SHENZHEN">Shenzhen</option>
              <option value="GUANGZHOU">Guangzhou</option>
              <option value="BUSAN">Busan</option>
              <option value="ROTTERDAM">Rotterdam</option>
              <option value="HONG_KONG">Hong Kong</option>
              <option value="ANVERS">Anvers</option>
              <option value="LOS_ANGELES">Los Angeles</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {isPending ? <Loader2 className="animate-spin" size={18} /> : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}