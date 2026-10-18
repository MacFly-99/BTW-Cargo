'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { verifySession } from '@/app/actions/auth'

export function SessionGuard() {
  const router = useRouter()

  useEffect(() => {
    // On vérifie la session toutes les 3 secondes
    const interval = setInterval(async () => {
      const result = await verifySession()
      
      // Si la session n'est plus valide, on redirige immédiatement vers login
      if (!result.valid) {
        router.push('/login')
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [router])

  return null // Ce composant n'affiche rien, il travaille en arrière-plan
}