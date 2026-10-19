import { AdminRealtimeStats } from '@/components/AdminRealtimeStats'
import { ShieldAlert } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldAlert className="text-amber-500" size={32} />
          Gestion Globale
        </h1>
        <p className="text-slate-400 mt-2">Supervision de l'application et gestion des utilisateurs.</p>
      </div>
      
      {/* Les stats temps réel */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-white">Aperçu en temps réel</h2>
        <AdminRealtimeStats />
      </div>

      {/* Gestion des utilisateurs*/}
      <div className="border-t border-slate-700 pt-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Utilisateurs de la plateforme</h2>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center text-slate-400">
          Chargement de la liste des utilisateurs...
        </div>
      </div>
    </div>
  )
}