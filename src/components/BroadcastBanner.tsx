'use client'

import { useState, useEffect } from 'react'
import { Info, X, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { markBroadcastAsRead } from '@/app/actions/broadcast'

export function BroadcastBanner({ message }: { message: any }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // On vérifie si ce message a déjà été vu dans cette session
    const seenId = sessionStorage.getItem('lastSeenBroadcast')
    
    if (seenId !== message.id) {
      setIsVisible(true)
      
      // On le marque comme lu en base de données (pour le badge)
      markBroadcastAsRead(message.id)
      
      // On le mémorise pour ne plus l'afficher
      sessionStorage.setItem('lastSeenBroadcast', message.id)

      // Fermeture auto après 10 secondes
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [message.id])

  if (!isVisible) return null

  const isUrgent = message.type === 'URGENT'
  const isWarning = message.type === 'WARNING'

  return (
    <div className={`mb-6 p-4 rounded-xl border flex items-start gap-4 relative animate-in fade-in slide-in-from-top-4 duration-500 ${
      isUrgent ? 'bg-red-500/10 border-red-500/30' :
      isWarning ? 'bg-amber-500/10 border-amber-500/30' :
      'bg-blue-500/10 border-blue-500/30'
    }`}>
      <div className={`p-2 rounded-full ${
        isUrgent ? 'bg-red-500/20 text-red-500' :
        isWarning ? 'bg-amber-500/20 text-amber-500' :
        'bg-blue-500/20 text-blue-500'
      }`}>
        {isUrgent || isWarning ? <AlertTriangle size={20} className={isUrgent ? 'animate-pulse' : ''} /> : <Info size={20} />}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Message du Tour de Contrôle
          </span>
          <span className="text-xs text-slate-500">
            • {new Date(message.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <p className="text-white font-medium">{message.message}</p>
      </div>

      <div className="flex flex-col items-end gap-2">
        <button 
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-white transition-colors p-1"
        >
          <X size={20} />
        </button>
        <Link href="/dashboard/messages" className="text-xs text-blue-400 hover:text-blue-300 underline">
          Voir tout
        </Link>
      </div>
    </div>
  )
}