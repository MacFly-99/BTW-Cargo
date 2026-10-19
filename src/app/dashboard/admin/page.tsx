import { AdminRealtimeStats } from '@/components/AdminRealtimeStats'
import { ShieldAlert } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <ShieldAlert className="text-amber-500" size={32} />
          Supervision Globale
        </h1>
        <p className="text-slate-400 mt-2">Vue d'ensemble de l'activité du port en temps réel.</p>
      </div>
      
      <AdminRealtimeStats />
    </div>
  )
}