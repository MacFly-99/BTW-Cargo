import { describe, it, expect } from 'vitest'
import { login } from '@/app/actions/auth'

describe('Sécurité : Rate Limiting (Anti-Brute Force)', () => {
  
  it('doit bloquer après 5 tentatives échouées', async () => {
    const formData = new FormData()
    formData.append('email', 'hacker@test.com')
    formData.append('password', 'wrong-password')

    // On simule 5 échecs (la map de rate limiting en mémoire va compter)
    for (let i = 0; i < 5; i++) {
      const res = await login(null, formData)
      expect(res?.error).toBe('Identifiants incorrects.')
    }

    // La 6ème tentative doit être bloquée (message différent)
    const res6 = await login(null, formData)
    expect(res6?.error).toContain('Trop de tentatives')
  })
})