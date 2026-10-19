import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import { redirect } from 'next/navigation'
import { UserProfileForm } from '@/components/UserProfileForm'
import { UserCircle, Shield } from 'lucide-react'

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')
  
  if (!sessionCookie) redirect('/login')

  let session: any
  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    session = payload
  } catch {
    redirect('/login')
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <UserCircle className="text-blue-500" size={32} />
          Mon Profil
        </h1>
        <p className="text-slate-400 mt-2">Gérez vos informations personnelles et votre sécurité.</p>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white">
            {session.name?.[0] || 'U'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{session.name}</h2>
            <p className="text-slate-400 text-sm">{session.role === 'ADMIN' ? 'Administrateur' : 'Opérateur'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-slate-500 mb-1">Identifiant unique</p>
            <p className="font-mono text-slate-300 text-xs break-all">{session.id}</p>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg">
            <p className="text-slate-500 mb-1">Rôle de sécurité</p>
            <p className="text-slate-300 flex items-center gap-2">
              <Shield size={14} className="text-blue-400" />
              {session.role}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Sécurité</h3>
        <UserProfileForm />
      </div>
    </div>
  )
}