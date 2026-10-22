import { describe, it, expect } from 'vitest'
import { generateContainerCode, generateDestination, generateType, getShipProfile } from '../simulation/logistics'

describe('Générateurs de données logistiques', () => {
  it('doit générer un code conteneur au format valide (ex: MSKU1234567)', () => {
    const code = generateContainerCode()
    // Vérifie 4 lettres majuscules suivies de 7 chiffres
    expect(code).toMatch(/^[A-Z]{4}\d{7}$/)
  })

  it('doit générer une destination valide', () => {
    const destination = generateDestination()
    const validDestinations = ['SHANGHAI', 'SINGAPOUR', 'NINGBO_ZHOUSHAN', 'SHENZHEN', 'GUANGZHOU', 'BUSAN', 'ROTTERDAM', 'HONG_KONG', 'ANVERS', 'LOS_ANGELES']
    expect(validDestinations).toContain(destination)
  })

  it('doit générer un type de conteneur valide', () => {
    const type = generateType()
    expect(['DRY', 'HIGH_CUBE', 'OPEN_TOP']).toContain(type)
  })
})

describe('Profils des navires', () => {
  it('doit retourner le bon profil pour un ULTRA_LARGE', () => {
    const profile = getShipProfile({ type: 'ULTRA_LARGE', capacity: 20000 })
    expect(profile.crane).toBe(60)
    expect(profile.transitMean).toBe(2880)
  })

  it('doit retourner le profil SMALL par défaut si le type est inconnu mais la capacité est petite', () => {
    const profile = getShipProfile({ type: 'UNKNOWN', capacity: 500 })
    expect(profile.crane).toBe(8)
  })
})