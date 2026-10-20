'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { verifySession, updateLastSeen } from '@/app/actions/auth'

export function SessionGuard() {
  const router = useRouter()

  useEffect(() => {
    // 1. Vérifie la validité du token (toutes les 5 sec)
    const sessionInterval = setInterval(async () => {
      const result = await verifySession()
      if (!result.valid) {
        router.push('/login')
      }
    }, 5000)

    // 2. Met à jour le lastSeen (toutes les 2 minutes)
    // On le fait une première fois au chargement
    updateLastSeen() 
    
    const heartbeatInterval = setInterval(async () => {
      await updateLastSeen()
    }, 60000) // 60 000 ms = 1 minute

    return () => {
      clearInterval(sessionInterval)
      clearInterval(heartbeatInterval)
    }
  }, [router])

  return null
}