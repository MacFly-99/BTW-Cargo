'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function RealtimeRefresher({ interval = 10000 }: { interval?: number }) {
  const router = useRouter()

  useEffect(() => {
    // On configure un intervalle qui rafraîchit les données du Server Component
    const timer = setInterval(() => {
      router.refresh()
    }, interval)

    // On nettoie l'intervalle quand on quitte la page
    return () => clearInterval(timer)
  }, [router, interval])

  return null // Ce composant est invisible
}