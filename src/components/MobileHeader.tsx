'use client'

import { useState } from 'react'
import { Menu, X, Ship, LayoutDashboard, Container, ShieldAlert, Users, UserCircle, LogOut, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

export function MobileHeader({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Barre du haut (visible uniquement sur mobile) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-500">🚢 BTW-Cargo</span>
        </div>
        <button onClick={() => setIsOpen(true)} className="p-2 text-slate-300 hover:text-white">
          <Menu size={24} />
        </button>
      </div>

      {/* Menu déroulant (Overlay) */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 md:hidden backdrop-blur-sm">
          <div className="bg-slate-950 w-64 h-full flex flex-col p-4 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold text-blue-500">🚢 Menu</span>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto">
              <Link href="/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300">
                <LayoutDashboard size={20} /> Tableau de bord
              </Link>
              <Link href="/dashboard/ships" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300">
                <Ship size={20} /> Navires
              </Link>
              <Link href="/dashboard/containers" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300">
                <Container size={20} /> Inventaire
              </Link>
              
              {session.role !== 'ADMIN' && (
                <Link href="/dashboard/messages" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300">
                  <MessageSquare size={20} /> Messages
                </Link>
              )}

              {session.role === 'ADMIN' && (
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <p className="px-4 text-xs font-semibold text-slate-500 uppercase mb-2">Admin</p>
                  <Link href="/dashboard/admin" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300">
                    <ShieldAlert size={20} /> Supervision
                  </Link>
                  <Link href="/dashboard/admin/broadcast" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300">
                    <MessageSquare size={20} /> Tour de Contrôle
                  </Link>
                  <Link href="/dashboard/users" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300">
                    <Users size={20} /> Utilisateurs
                  </Link>
                </div>
              )}
            </nav>

            <div className="border-t border-slate-800 pt-4 mt-4">
              <Link href="/dashboard/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 text-slate-300">
                <UserCircle size={20} /> Mon Profil
              </Link>
              <form action={logout}>
                <button className="flex w-full items-center gap-3 px-4 py-2 mt-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors">
                  <LogOut size={18} /> Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}