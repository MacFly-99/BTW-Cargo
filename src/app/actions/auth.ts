'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT } from 'jose'
import { jwtVerify } from 'jose'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// On récupère la clé secrète
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

export async function login(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Veuillez remplir tous les champs.' }
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return { error: 'Identifiants incorrects.' }
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    return { error: 'Identifiants incorrects.' }
  }

  // --- CRÉATION DU JWT SÉCURISÉ ---
  const token = await new SignJWT({ 
    id: user.id, 
    role: user.role, 
    name: user.name 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Expire dans 1 jour
    .sign(getJwtSecret())

  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 1, // 1 jour
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
    // Si le token est invalide, on le supprime
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