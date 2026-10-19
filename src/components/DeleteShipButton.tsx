'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteShip } from '@/app/actions/ships'
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteShipButton({ 
  shipId, 
  shipName, 
  containerCount 
}: { 
  shipId: string
  shipName: string
  containerCount: number 
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    const res = await deleteShip(shipId)
    
    if (res.error) {
      toast.error("Suppression impossible", { description: res.error })
      setIsOpen(false)
    } else {
      toast.success("Navire supprimé", { description: `Le navire ${shipName} a été retiré de la flotte.` })
      router.push('/dashboard/ships')
    }
    setIsDeleting(false)
  }

  const isBlocked = containerCount > 0

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg border border-red-500/20 transition-colors"
      >
        <Trash2 size={14} />
        Supprimer le navire
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Supprimer ce navire ?</h3>
            
            {isBlocked ? (
              <p className="text-amber-400 bg-amber-500/10 p-3 rounded-lg text-sm mb-6 border border-amber-500/20">
                Impossible de supprimer <strong>{shipName}</strong>. Il contient encore <strong>{containerCount.toLocaleString()}</strong> conteneurs. Veuillez les décharger d'abord.
              </p>
            ) : (
              <p className="text-slate-400 mb-6">
                Êtes-vous sûr de vouloir supprimer le navire <strong>{shipName}</strong> ? Cette action est <span className="text-red-400 font-bold">irréversible</span>.
              </p>
            )}

            <div className="flex gap-3">
              <button 
                onClick={() => setIsOpen(false)} 
                disabled={isDeleting} 
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              
              {!isBlocked && (
                <button 
                  onClick={handleDelete} 
                  disabled={isDeleting} 
                  className="flex-1 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={18} /> : 'Supprimer'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}