'use client'

import { useEffect, useState } from 'react'
import { Users, Container, Ship, Activity, AlertTriangle, X } from 'lucide-react'

export function AdminRealtimeStats() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // État pour la modale des utilisateurs
  const [showUsersModal, setShowUsersModal] = useState(false)

  useEffect(() => {
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

    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !data) {
    return <div className="animate-pulse text-slate-500">Synchronisation des données...</div>
  }

  const isCritical = data.remainingSpace <= 10000
  const portFillRate = Math.min((data.totalContainers / data.portCapacity) * 100, 100)

  return (
    <div className="space-y-6">
      
      {/* BANDEAU D'ALERTE (Si critique) */}
      {isCritical && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-4 animate-pulse">
          <div className="p-2 bg-red-500/20 rounded-full">
            <AlertTriangle className="text-red-500" size={24} />
          </div>
          <div>
            <h3 className="text-red-400 font-bold text-lg">Alerte de capacité portuaire !</h3>
            <p className="text-red-300/80 text-sm">
              Il ne reste plus que <strong>{data.remainingSpace?.toLocaleString()}</strong> emplacements libres.
            </p>
          </div>
        </div>
      )}

      {/* CARTES DE STATISTIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CARTE 1 : UTILISATEURS */}
        <button 
          onClick={() => setShowUsersModal(true)}
          className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between hover:bg-slate-750 hover:border-blue-500/50 transition-all text-left group"
        >
          <div>
            <p className="text-sm text-slate-400 group-hover:text-blue-400 transition-colors">Utilisateurs connectés</p>
            <p className="text-2xl font-bold text-emerald-400">
              {data.activeUsers}
              <span className="text-sm text-slate-500 font-normal ml-2">
                / {data.totalUsers}
              </span>
            </p>
          </div>
          <Users className="text-blue-500 group-hover:scale-110 transition-transform" size={32} />
        </button>

        {/* CARTE 2 : CONTENEURS AVEC JAUGE */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm text-slate-400">Conteneurs</p>
              <p className="text-2xl font-bold">{data.totalContainers.toLocaleString()}</p>
            </div>
            <Container className="text-emerald-500" size={32} />
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Capacité port</span>
              <span>{portFillRate.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  portFillRate > 85 ? 'bg-red-500' : 
                  portFillRate > 60 ? 'bg-amber-500' : 
                  'bg-emerald-500'
                }`}
                style={{ width: `${portFillRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* CARTE 3 : NAVIRES EN MER */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Navires en mer</p>
            <p className="text-2xl font-bold">{data.shipsInTransit}</p>
          </div>
          <Ship className="text-purple-500" size={32} />
        </div>
      </div>

      {/* FIL D'ACTUALITÉ */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="text-amber-500" size={20} />
            Activité Récente (Temps Réel)
          </h3>
        </div>
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

      {/* --- MODALE : LISTE DES UTILISATEURS CONNECTÉS --- */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-emerald-500" />
                Utilisateurs en ligne
              </h2>
              <button onClick={() => setShowUsersModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
              {data.activeUsersList.length === 0 ? (
                <p className="text-slate-400 text-center py-4">Personne n'est connecté actuellement.</p>
              ) : (
                data.activeUsersList.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                          {user.name?.[0] || 'U'}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-800 rounded-full"></span>
                      </div>
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.role}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">
                      Vu à {new Date(user.lastSeen).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}