'use client'

import { useState } from 'react'
import { updatePassword } from '@/app/actions/users'
import { Loader2, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

export function UserProfileForm() {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await updatePassword(formData)

    if (result.error) {
      setError(result.error)
      toast.error("Erreur", { description: result.error })
    } else {
      toast.success("Mot de passe mis à jour", { description: "Votre nouveau mot de passe est actif." })
      e.currentTarget.reset()
    }
    setIsPending(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Mot de passe actuel</label>
        <input 
          name="currentPassword" 
          type="password" 
          required 
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Nouveau mot de passe</label>
          <input 
            name="newPassword" 
            type="password" 
            required 
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Confirmer</label>
          <input 
            name="confirmPassword" 
            type="password" 
            required 
            className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500" 
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button 
          type="submit" 
          disabled={isPending}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
          Mettre à jour
        </button>
      </div>
    </form>
  )
}