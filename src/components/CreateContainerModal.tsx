'use client'

import { useState } from 'react'
import { createContainer } from '@/app/actions/containers'
import { X, PackagePlus, Loader2 } from 'lucide-react'

export function CreateContainerModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createContainer(formData)

    if (result.error) {
      setError(result.error)
    } else {
      setIsOpen(false)
    }
    setIsPending(false)
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        <PackagePlus size={18} />
        Nouveau Conteneur
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PackagePlus className="text-blue-500" />
            Nouveau Conteneur
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
            <label className="block text-sm font-medium text-slate-300 mb-1">Type de conteneur</label>
            <select name="type" required className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2">
              <option value="DRY">Dry (Produits secs)</option>
              <option value="HIGH_CUBE">High Cube (Volumineux)</option>
              <option value="OPEN_TOP">Open Top (Hors gabarit)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Couleur</label>
            <select name="color" required className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2">
              <option value="BLEU_MARINE">Bleu Marine</option>
              <option value="GRIS_METALLIQUE">Gris Métallique</option>
              <option value="BLANC">Blanc</option>
              <option value="VERT">Vert</option>
              <option value="ORANGE">Orange</option>
              <option value="JAUNE">Jaune</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Destination</label>
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

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Zone de stockage</label>
            <select name="zone" required className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2">
              <option value="Terminal Nord">Terminal Nord</option>
              <option value="Terminal Sud">Terminal Sud</option>
              <option value="Terminal Est">Terminal Est</option>
              <option value="Terminal Ouest">Terminal Ouest</option>
              <option value="Zone de Transit">Zone de Transit</option>
            </select>
            <p className="text-xs text-slate-500 mt-2">L'emplacement exact (rangée/slot) sera calculé automatiquement.</p>
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
              {isPending ? <Loader2 className="animate-spin" size={18} /> : 'Créer le conteneur'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}