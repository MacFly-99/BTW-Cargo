import { describe, it, expect, vi } from 'vitest'

// On mocke le JWT pour renvoyer un rôle ADMIN
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: () => ({ value: "fake-admin-token" })
  })
}))

vi.mock('jose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('jose')>()
  return {
    ...actual,
    jwtVerify: async () => ({
      payload: { id: 'admin-id', role: 'ADMIN', name: 'Super Admin' }
    })
  }
})

import { deleteUser } from '@/app/actions/users'
import { updateContainerDestination } from '@/app/actions/containers'

describe('Sécurité : Un ADMIN a les droits', () => {
  
  it('doit autoriser la suppression d\'un utilisateur', async () => {
    const result = await deleteUser('some-user-id')
    // Si ce n'est pas "Accès refusé", c'est que le rôle a été accepté
    expect(result.error).not.toBe('Accès refusé.')
  })

  it('doit autoriser la modification d\'un conteneur', async () => {
    const result = await updateContainerDestination('some-container-id', 'ROTTERDAM')
    expect(result.error).not.toBe('Accès refusé. Seul un administrateur peut modifier la destination.')
  })
})