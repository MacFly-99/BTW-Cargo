import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get('session')?.value

  // Si pas de cookie, on redirige vers login (si on est sur une route protégée)
  if (!sessionCookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si on a un cookie, on vérifie qu'il est valide
  if (sessionCookie) {
    try {
      await jwtVerify(sessionCookie, getJwtSecret())
      
      // Si on est déjà connecté et qu'on va sur /login, on redirige
      if (request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    } catch (error) {
      // Le cookie est invalide ou expiré
      if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('session')
        return response
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}