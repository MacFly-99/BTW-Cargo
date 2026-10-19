'use client'

import { useState } from 'react'
import { createUser, deleteUser } from '@/app/actions/users'
import { UserPlus, Trash2, Shield, User as UserIcon, Loader2, AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'

export function UserManagement({ initialUsers }: { initialUsers: any[] }) {
  const [isCreating, setIsCreating] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Modale d'erreur
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await createUser(formData)

    if (result.error) {
      setError(result.error)
      toast.error("Erreur", { description: result.error })
      setIsPending(false)
    } else {
      toast.success("Utilisateur créé", { description: "Le nouvel opérateur peut se connecter." })
      setIsCreating(false)
      setIsPending(false)
      window.location.reload()
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    setIsDeleting(true)
    const res = await deleteUser(deleteId)
    
    if (res.error) {
      // Si c'est l'erreur de suppression de son propre compte, on affiche la modale
      if (res.error.includes('votre propre compte')) {
        setDeleteId(null)
        setDeleteError(res.error)
      } else {
        toast.error("Erreur", { description: res.error })
        setDeleteId(null)
      }
    } else {
      toast.success("Utilisateur supprimé", { description: "L'accès a été révoqué." })
      setDeleteId(null)
      window.location.reload()
    }
    setIsDeleting(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button 
          onClick={() => setIsCreating(true)} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus size={18} />
          Nouvel Utilisateur
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-medium">
            <tr>
              <th className="px-6 py-4">Nom</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Rôle</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {initialUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-750 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{user.name || 'Sans nom'}</td>
                <td className="px-6 py-4">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    user.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {user.role === 'ADMIN' ? <Shield size={12} /> : <UserIcon size={12} />}
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setDeleteId(user.id)} 
                    className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    title="Supprimer l'utilisateur"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {initialUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODALE DE CRÉATION --- */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Créer un utilisateur</h2>
              <button onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nom complet</label>
                <input name="name" placeholder="ex: Jean Dupont" required className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input name="email" type="email" placeholder="jean@btwcargo.com" required className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mot de passe</label>
                <input name="password" type="password" placeholder="••••••••" required className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Rôle</label>
                <select name="role" className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="USER">Opérateur (USER)</option>
                  <option value="ADMIN">Administrateur (ADMIN)</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={isPending} className="flex-1 flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50">
                  {isPending ? <Loader2 className="animate-spin" size={18} /> : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODALE DE SUPPRESSION --- */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Supprimer cet utilisateur ?</h3>
            <p className="text-slate-400 mb-6">
              Cette action est <span className="text-red-400 font-bold">irréversible</span>. L'utilisateur perdra immédiatement l'accès à la plateforme.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} disabled={isDeleting} className="flex-1 px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors">
                Annuler
              </button>
              <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALE D'ERREUR (Auto-suppression) --- */}
      {deleteError && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <Shield className="text-red-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Action impossible</h3>
            <p className="text-slate-400 mb-6">
              {deleteError}
            </p>
            <button 
              onClick={() => setDeleteError(null)} 
              className="w-full px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </div>
  )
}