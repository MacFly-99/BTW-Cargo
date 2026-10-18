'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import Link from 'next/link'
import { Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  // useActionState prend l'action, un état initial, et renvoie [état, actionForm]
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-800 p-8 shadow-xl border border-slate-700">
        
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white">🚢 BTW-Cargo</h2>
          <p className="mt-2 text-sm text-slate-400">Connectez-vous à votre espace</p>
        </div>

        {/* Affichage de l'erreur si elle existe */}
        {state?.error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400 border border-red-500/20">
            <AlertCircle size={16} />
            <p>{state.error}</p>
          </div>
        )}

        <form action={formAction} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                disabled={isPending}
                className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                placeholder="admin@btwcargo.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                disabled={isPending}
                className="mt-1 block w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 transition-all"
          >
            {isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-300 transition-colors">← Retour à l'accueil</Link>
        </p>
      </div>
    </div>
  )
}