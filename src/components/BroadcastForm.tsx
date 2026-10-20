'use client'

import { useState } from 'react'
import { sendBroadcast } from '@/app/actions/broadcast'
import { Send, Loader2, AlertTriangle, Info } from 'lucide-react'
import { toast } from 'sonner'

const TEMPLATES = [
  { label: "Arrivage imminent", text: "Un navire arrive au port. Préparez les équipes de déchargement sur le Terminal Sud." },
  { label: "Accélérer la cadence", text: "Ordre de la direction : accélérez le chargement, nous avons du retard sur le planning." },
  { label: "Ralentir / Pause", text: "Ralentissez la cadence. Les camions sont bloqués sur l'autoroute, le port est saturé." },
  { label: "Départ de navire", text: "Le navire est prêt à partir. Terminez les dernières validations immédiatement." },
]

export function BroadcastForm() {
  const [isPending, setIsPending] = useState(false)
  const [message, setMessage] = useState('')
  const [type, setType] = useState('INFO')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    setError(null)

    const formData = new FormData()
    formData.append('message', message)
    formData.append('type', type)

    const result = await sendBroadcast(formData)

    if (result.error) {
      setError(result.error)
      toast.error("Erreur", { description: result.error })
    } else {
      toast.success("Message diffusé", { description: "Tous les opérateurs ont été notifiés." })
      setMessage('')
      setType('INFO')
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

      {/* Modèles rapides */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Modèles rapides</label>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((tpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setMessage(tpl.text)}
              className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-600"
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Type de message */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Niveau d'urgence</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setType('INFO')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
              type === 'INFO' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-slate-900 border-slate-600 text-slate-400'
            }`}
          >
            <Info size={16} /> Info
          </button>
          <button
            type="button"
            onClick={() => setType('WARNING')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
              type === 'WARNING' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-900 border-slate-600 text-slate-400'
            }`}
          >
            <AlertTriangle size={16} /> Attention
          </button>
          <button
            type="button"
            onClick={() => setType('URGENT')}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border transition-colors ${
              type === 'URGENT' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-slate-900 border-slate-600 text-slate-400'
            }`}
          >
            <AlertTriangle size={16} /> Urgent
          </button>
        </div>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Message aux opérateurs</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={4}
          placeholder="Tapez votre instruction ici..."
          className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || message.length < 5}
        className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
      >
        {isPending ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        Diffuser à tous les opérateurs
      </button>
    </form>
  )
}