import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { MessageSquare, Info, AlertTriangle, Radio } from 'lucide-react'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export default async function MessagesPage() {
  // 1. On marque tous les messages comme lus (l'utilisateur voit la page, donc il est au courant)
  await prisma.broadcast.updateMany({
    where: { isRead: false },
    data: { isRead: true }
  })

  // 2. On récupère les messages
  const messages = await prisma.broadcast.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  return (
  <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <MessageSquare className="text-blue-500" size={32} />
          Journal du Tour de Contrôle
        </h1>
        <p className="text-slate-400 mt-2">Retrouvez ici toutes les instructions reçues du QG.</p>
      </div>

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="text-center p-12 bg-slate-800 rounded-xl border border-slate-700">
            <Radio className="mx-auto text-slate-500 mb-4" size={48} />
            <h3 className="text-lg font-bold text-white">Aucun message</h3>
            <p className="text-slate-400">Le silence radio est total pour le moment.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`p-5 rounded-xl border flex items-start gap-4 ${
                msg.type === 'URGENT' ? 'bg-red-500/10 border-red-500/30' :
                msg.type === 'WARNING' ? 'bg-amber-500/10 border-amber-500/30' :
                'bg-slate-800 border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-full ${
                msg.type === 'URGENT' ? 'bg-red-500/20 text-red-500' :
                msg.type === 'WARNING' ? 'bg-amber-500/20 text-amber-500' :
                'bg-blue-500/20 text-blue-500'
              }`}>
                {msg.type === 'URGENT' ? <AlertTriangle size={20} /> : 
                 msg.type === 'WARNING' ? <AlertTriangle size={20} /> : 
                 <Info size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    msg.type === 'URGENT' ? 'bg-red-500/20 text-red-400' :
                    msg.type === 'WARNING' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>{msg.type}</span>
                  <span className="text-xs text-slate-500">
                    {new Date(msg.createdAt).toLocaleString('fr-FR')}
                  </span>
                </div>
                <p className="text-white font-medium mt-2">{msg.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}