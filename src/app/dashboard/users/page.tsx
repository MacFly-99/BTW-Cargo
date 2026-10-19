import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { UserManagement } from '@/components/UserManagement'
import { Users } from 'lucide-react'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Users className="text-blue-500" size={32} />
          Gestion des Utilisateurs
        </h1>
        <p className="text-slate-400 mt-2">Gérez les accès et les rôles des opérateurs de la plateforme.</p>
      </div>

      <UserManagement initialUsers={users} />
    </div>
  )
}