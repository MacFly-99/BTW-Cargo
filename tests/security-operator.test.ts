import { describe, it, expect, vi } from 'vitest'
import { SignJWT } from 'jose'

// 1. On prépare un faux jeton d'OPÉRATEUR
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'test-secret-123')

// 2. On dit à Vitest de simuler les cookies AVANT d'importer les actions
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => ({
      // On génère un faux token à la volée (ou on le met en dur)
      value: "fake-operator-token" 
    })
  })
}))

// 3. On mocke aussi la vérification du JWT pour qu'elle renvoie le rôle USER
vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>()
  return {
    ...actual,
    jwtVerify: async () => ({
      payload: { id: 'fake-id', role: 'USER', name: 'Test Operator' }
    })
  }
})

// 4. MAINTENANT on importe les actions (elles verront les mocks)
import { deleteUser } from '@/app/actions/users'
import { updateContainerDestination, deleteContainer } from '@/app/actions/containers'

describe('Sécurité : Un OPÉRATEUR ne peut pas faire d\'actions Admin', () => {
  
  it('doit refuser la suppression d\'un utilisateur', async () => {
    const result = await deleteUser('some-user-id')
    expect(result.error).toBe('Accès refusé.')
  })

  it('doit refuser la modification d\'un conteneur', async () => {
    const result = await updateContainerDestination('some-container-id', 'ROTTERDAM')
    expect(result.error).toBe('Accès refusé. Seul un administrateur peut modifier la destination.')
  })

  it('doit refuser la suppression d\'un conteneur', async () => {
    const result = await deleteContainer('some-container-id')
    expect(result.error).toBe('Accès refusé. Seul un administrateur peut supprimer un conteneur.')
  })
})