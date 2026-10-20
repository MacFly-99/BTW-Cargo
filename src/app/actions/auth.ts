'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT, jwtVerify } from 'jose'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

// --- SYSTÈME DE RATE LIMITING (Anti-Brute Force) ---
const loginAttempts = new Map<string, { count: number, lastAttempt: number }>()
const MAX_ATTEMPTS = 5
const LOCKOUT_TIME = 60 * 20 * 1000 // 20 minutes

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Veuillez remplir tous les champs.' }
  }

  // 1. VÉRIFICATION DU RATE LIMIT
  const now = Date.now()
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: now }

  if (attempts.count >= MAX_ATTEMPTS && now - attempts.lastAttempt < LOCKOUT_TIME) {
    const remainingTime = Math.ceil((LOCKOUT_TIME - (now - attempts.lastAttempt)) / 1000)
    return { error: `Trop de tentatives. Veuillez réessayer dans ${remainingTime} secondes.` }
  }

  // Si le temps de lockout est passé, on réinitialise le compteur
  if (now - attempts.lastAttempt > LOCKOUT_TIME) {
    attempts.count = 0
  }

  // 2. RECHERCHE DE L'UTILISATEUR
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    loginAttempts.set(email, { count: attempts.count + 1, lastAttempt: now })
    return { error: 'Identifiants incorrects.' }
  }

  // 3. VÉRIFICATION DU MOT DE PASSE
  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    loginAttempts.set(email, { count: attempts.count + 1, lastAttempt: now })
    return { error: 'Identifiants incorrects.' }
  }

  // Succès : on efface l'historique des échecs
  loginAttempts.delete(email)

  // 4. CRÉATION DU JWT
  const token = await new SignJWT({ 
    id: user.id, 
    role: user.role, 
    name: user.name 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret())

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  redirect('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/login')
}

export async function verifySession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie) return { valid: false }

  try {
    await jwtVerify(sessionCookie.value, getJwtSecret())
    return { valid: true }
  } catch (error) {
    cookieStore.delete('session')
    return { valid: false }
  }
}

export async function updateLastSeen() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  if (!sessionCookie) return { success: false }

  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    const userId = payload.id as string

    await prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() }
    })

    return { success: true }
  } catch (error) {
    return { success: false }
  }
}