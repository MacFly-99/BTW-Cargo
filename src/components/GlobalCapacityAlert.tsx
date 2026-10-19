'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export function GlobalCapacityAlert() {
  const [isVisible, setIsVisible] = useState(false)
  const [remainingSpace, setRemainingSpace] = useState<number>(0)
  const [portCapacity, setPortCapacity] = useState<number>(120000)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    const checkCapacity = async () => {
      try {
        const res = await fetch('/api/admin-stats')
        if (res.ok) {
          const data = await res.json()
          
          const isCritical = data.remainingSpace <= 10000
          
          // Si c'est critique ET que l'utilisateur ne l'a pas fermé
          if (isCritical && !isDismissed) {
            setRemainingSpace(data.remainingSpace)
            setPortCapacity(data.portCapacity)
            setIsVisible(true)
          } else {
            setIsVisible(false)
            // Si l'espace redevient bon, on réinitialise le "dismissed"
            if (!isCritical) setIsDismissed(false)
          }
        }
      } catch (error) {
        console.error("Erreur de vérification de capacité", error)
      }
    }

    // Vérification immédiate, puis toutes les 10 secondes
    checkCapacity()
    const interval = setInterval(checkCapacity, 10000)
    return () => clearInterval(interval)
  }, [isDismissed])

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
  }

  if (!isVisible) return null

  return (
    <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-red-500/20 rounded-full animate-pulse">
          <AlertTriangle className="text-red-500" size={20} />
        </div>
        <div>
          <p className="text-red-400 font-bold text-sm">Alerte de capacité portuaire !</p>
          <p className="text-red-300/80 text-xs">
            Il ne reste que <strong>{remainingSpace.toLocaleString()}</strong> emplacements libres sur {portCapacity.toLocaleString()}.
          </p>
        </div>
      </div>
      <button 
        onClick={handleDismiss}
        className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2 rounded-lg transition-colors"
        title="Masquer l'alerte"
      >
        <X size={20} />
      </button>
    </div>
  )
}