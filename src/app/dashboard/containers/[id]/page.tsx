import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Ship, Box, Calendar, Palette, Tag, Hash } from 'lucide-react'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

// Images locales pour les conteneurs selon leur couleur
const CONTAINER_IMAGES: Record<string, string> = {
  BLEU_MARINE: "/blue-container.jpg",
  GRIS_METALLIQUE: "/metal-gray-container.jpg",
  BLANC: "/white-container.jpg",
  VERT: "/green-container.jpg",
  ORANGE: "/orange-container.jpg",
  JAUNE: "/yellow-container.jpg",
}

const colorMap: Record<string, { bg: string, text: string, label: string }> = {
  BLEU_MARINE: { bg: 'bg-blue-900', text: 'text-blue-100', label: 'Bleu Marine' },
  GRIS_METALLIQUE: { bg: 'bg-slate-500', text: 'text-slate-100', label: 'Gris Métallique' },
  BLANC: { bg: 'bg-white', text: 'text-slate-900', label: 'Blanc' },
  VERT: { bg: 'bg-green-600', text: 'text-green-100', label: 'Vert' },
  ORANGE: { bg: 'bg-orange-500', text: 'text-orange-100', label: 'Orange' },
  JAUNE: { bg: 'bg-yellow-400', text: 'text-yellow-900', label: 'Jaune' },
}

export default async function ContainerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const container = await prisma.container.findUnique({
    where: { id },
    include: {
      ship: {
        select: { name: true, destination: true, status: true }
      }
    }
  })

  if (!container) {
    notFound()
  }

  const colorInfo = colorMap[container.color] || { bg: 'bg-slate-500', text: 'text-white', label: container.color }
  const imageUrl = CONTAINER_IMAGES[container.color] || CONTAINER_IMAGES.GRIS_METALLIQUE

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'VALIDATED': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'PENDING': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'SHIPPED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-slate-500/20 text-slate-400'
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link 
        href="/dashboard/containers" 
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Retour à l'inventaire
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <h1 className="text-4xl font-bold text-white font-mono">{container.code}</h1>
          <span className={`text-sm px-3 py-1 rounded-full border ${getStatusStyle(container.status)}`}>
            {container.status}
          </span>
        </div>
        <p className="text-slate-400">Fiche détaillée du conteneur.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          {/* L'image du conteneur */}
          <div className="w-full h-48 rounded-xl overflow-hidden mb-6 bg-slate-900 relative">
            <img 
              src={imageUrl} 
              alt={`Conteneur ${container.color}`}
              className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-white">
              {container.code}
            </div>
          </div>

          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Box className="text-blue-500" size={20} />
            Informations Générales
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400 flex items-center gap-2"><Tag size={16} /> Type</span>
              <span className="font-medium text-white">{container.type.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400 flex items-center gap-2"><Palette size={16} /> Couleur</span>
              <div className="flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full border border-slate-600 ${colorInfo.bg}`}></span>
                <span className="font-medium text-white">{colorInfo.label}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400 flex items-center gap-2"><MapPin size={16} /> Destination</span>
              <span className="font-medium text-white">{container.destination.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-400 flex items-center gap-2"><Calendar size={16} /> Créé le</span>
              <span className="font-medium text-white">{new Date(container.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Ship className="text-emerald-500" size={20} />
            Logistique
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Zone</span>
              <span className="font-medium text-white">{container.zone}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400 flex items-center gap-2"><Hash size={16} /> Emplacement</span>
              <span className="font-mono font-medium text-white bg-slate-900 px-2 py-1 rounded">
                Rangée {container.row} - Slot {container.slot}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
              <span className="text-slate-400">Statut Navire</span>
              <span className="font-medium text-slate-200">
                {container.ship ? (
                  <span className="text-blue-400 flex items-center gap-1 justify-end">
                    <Ship size={14} /> {container.ship.name}
                  </span>
                ) : (
                  <span className="text-slate-300 bg-slate-700 px-2 py-1 rounded text-xs">En stock</span>
                )}
              </span>
            </div>
          </div>
          
          {container.ship && (
            <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
              <p className="text-sm text-blue-300">
                Ce conteneur est actuellement chargé sur le navire <strong>{container.ship.name}</strong> en direction de <strong>{container.ship.destination}</strong>.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}