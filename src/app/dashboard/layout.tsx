import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Ship, Container, LayoutDashboard, LogOut, Users, ShieldAlert, UserCircle, MessageSquare } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { SessionGuard } from '@/components/SessionGuard'
import { GlobalCapacityAlert } from '@/components/GlobalCapacityAlert'

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

// On initialise Prisma pour compter les messages
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) {
    redirect('/login')
  }

  let session: any
  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    session = payload
  } catch (error) {
    redirect('/login')
  }

  // On compte les messages non lus (uniquement pour les opérateurs)
  let unreadCount = 0
  if (session.role !== 'ADMIN') {
    unreadCount = await prisma.broadcast.count({ where: { isRead: false } })
  }

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <SessionGuard />
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-blue-500">🚢 BTW-Cargo</h1>
          <p className="text-xs text-slate-500 mt-1">Logistique Maritime</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
            <LayoutDashboard size={20} />
            Tableau de bord
          </Link>
          
          {/* Lien Messages (Opérateurs uniquement) avec BADGE */}
          {session.role !== 'ADMIN' && (
            <Link href="/dashboard/messages" className="flex items-center justify-between px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white group">
              <div className="flex items-center gap-3">
                <MessageSquare size={20} />
                Messages
              </div>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
          )}

          <Link href="/dashboard/ships" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
            <Ship size={20} />
            Navires
          </Link>
          <Link href="/dashboard/containers" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
            <Container size={20} />
            Inventaire Conteneurs
          </Link>
          
          {session.role === 'ADMIN' && (
            <div className="pt-4 mt-4 border-t border-slate-800">
              <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Administration</p>
              <Link href="/dashboard/admin" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                <ShieldAlert size={20} />
                Supervision
              </Link>
              <Link href="/dashboard/admin/broadcast" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                <MessageSquare size={20} />
                Tour de Contrôle
              </Link>
              <Link href="/dashboard/users" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
                <Users size={20} />
                Utilisateurs
              </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 mb-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-300 hover:text-white">
            <UserCircle size={20} />
            Mon Profil
          </Link>

          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {session.name?.[0] || 'A'}
            </div>
            <div className="text-sm">
              <p className="font-medium">{session.name}</p>
              <p className="text-xs text-slate-500">{session.role}</p>
            </div>
          </div>
          <form action={logout}>
            <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
              <LogOut size={18} />
              Déconnexion
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {/* L'alerte apparaît ici, collée en haut, uniquement pour l'admin */}
        {session.role === 'ADMIN' && <GlobalCapacityAlert />}
        
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}