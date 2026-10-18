'use server'

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SignJWT } from 'jose'

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