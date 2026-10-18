'use client'

import { useEffect, useState } from 'react'
import { Users, Container, Ship, Activity } from 'lucide-react'

export function AdminRealtimeStats() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fonction pour récupérer les données
    const fetchData = async () => {
      try {
        const res = await fetch('/api/admin-stats')
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Erreur de chargement", error)
      } finally {
        setLoading(false)
      }
    }

    // On appelle une première fois
    fetchData()

    // Puis on configure un intervalle de 2 secondes pour le "temps réel"
    const interval = setInterval(fetchData, 2000)

    // On nettoie l'intervalle si on quitte la page
    return () => clearInterval(interval)
  }, [])

  if (loading || !data) {
    return <div className="animate-pulse text-slate-500">Synchronisation des données...</div>
  }

  return (
    <div className="space-y-6">
      {/* Cartes de stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Utilisateurs</p>
            <p className="text-2xl font-bold">{data.totalUsers}</p>
          </div>
          <Users className="text-blue-500" size={32} />
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Conteneurs</p>
            <p className="text-2xl font-bold">{data.totalContainers.toLocaleString()}</p>
          </div>
          <Container className="text-emerald-500" size={32} />
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Navires en mer</p>
            <p className="text-2xl font-bold">{data.shipsInTransit}</p>
          </div>
          <Ship className="text-purple-500" size={32} />
        </div>
      </div>

      {/* Fil d'actualité (Activité récente) */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="text-amber-500" size={20} />
          Activité Récente (Temps Réel)
        </h3>
        <div className="space-y-3">
          {data.recentContainers.map((container: any) => (
            <div key={container.id} className="flex justify-between items-center text-sm border-b border-slate-700/50 pb-2 last:border-0">
              <span className="font-mono text-slate-300">{container.code}</span>
              <span className="text-slate-500">{container.type}</span>
              <span className="text-xs text-slate-600">
                {new Date(container.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}