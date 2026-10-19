import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { ContainerList } from '@/components/ContainerList'
import { CreateContainerModal } from '@/components/CreateContainerModal'
import { Box } from 'lucide-react'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

const ITEMS_PER_PAGE = 25

export default async function ContainersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; type?: string; status?: string; destination?: string; color?: string }>
}) {
  const params = await searchParams
  
  // --- RÉCUPÉRATION DU RÔLE ---
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  let isAdmin = false
  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
      isAdmin = payload.role === 'ADMIN'
    } catch {}
  }

  const currentPage = Number(params.page) || 1
  const search = params.search || ''
  const typeFilter = params.type || ''
  const statusFilter = params.status || ''
  const destinationFilter = params.destination || ''
  const colorFilter = params.color || ''

  const skip = (currentPage - 1) * ITEMS_PER_PAGE

  const whereCondition: any = {
    AND: [
      search ? { code: { contains: search, mode: 'insensitive' } } : {},
      typeFilter ? { type: typeFilter as any } : {},
      statusFilter ? { status: statusFilter as any } : {},
      destinationFilter ? { destination: destinationFilter as any } : {},
      colorFilter ? { color: colorFilter as any } : {},
    ]
  }

  const [containers, totalCount] = await Promise.all([
    prisma.container.findMany({
      where: whereCondition,
      take: ITEMS_PER_PAGE,
      skip: skip,
      orderBy: { createdAt: 'desc' },
      include: { ship: { select: { name: true } } }
    }),
    prisma.container.count({ where: whereCondition })
  ])

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)
  const destinations = ['SHANGHAI', 'SINGAPOUR', 'NINGBO_ZHOUSHAN', 'SHENZHEN', 'GUANGZHOU', 'BUSAN', 'ROTTERDAM', 'HONG_KONG', 'ANVERS', 'LOS_ANGELES']
  const colors = ['BLEU_MARINE', 'GRIS_METALLIQUE', 'BLANC', 'VERT', 'ORANGE', 'JAUNE']

  return (
    <div className="p-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Box className="text-blue-500" size={32} />
            Inventaire des Conteneurs
          </h1>
          <p className="text-slate-400 mt-2">
            Gérez et recherchez parmi les {totalCount.toLocaleString()} conteneurs correspondants.
          </p>
        </div>
        <CreateContainerModal />
      </div>

      <ContainerList 
        containers={containers}
        totalPages={totalPages}
        currentPage={currentPage}
        totalCount={totalCount}
        currentSearch={search}
        currentType={typeFilter}
        currentStatus={statusFilter}
        currentDestination={destinationFilter}
        currentColor={colorFilter}
        destinations={destinations}
        colors={colors}
        isAdmin={isAdmin}
      />
    </div>
  )
}