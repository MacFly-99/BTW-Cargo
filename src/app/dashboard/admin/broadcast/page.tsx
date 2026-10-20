import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { BroadcastForm } from '@/components/BroadcastForm'
import { Radio, History } from 'lucide-react'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export default async function BroadcastPage() {
  // On récupère l'historique des 10 derniers messages
  const history = await prisma.broadcast.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Radio className="text-red-500 animate-pulse" size={32} />
          Tour de Contrôle
        </h1>
        <p className="text-slate-400 mt-2">Envoyez des instructions en temps réel à tous les opérateurs.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulaire d'envoi */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Nouveau message</h2>
          <BroadcastForm />
        </div>

        {/* Historique */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <History size={20} className="text-slate-400" />
            Historique des diffusions
          </h2>
          <div className="space-y-3">
            {history.length === 0 ? (
              /* --- L'EMPTY STATE EST ICI --- */
              <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                <Radio className="mx-auto text-slate-600 mb-3" size={36} />
                <p className="text-slate-400 font-medium">Le silence radio est total.</p>
                <p className="text-slate-500 text-sm mt-1">Aucun message n'a été diffusé pour le moment.</p>
              </div>
            ) : (
              history.map((msg) => (
                <div key={msg.id} className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      msg.type === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                      msg.type === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>{msg.type}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(msg.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}