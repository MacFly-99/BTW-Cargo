import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'

const getJwtSecret = () => new TextEncoder().encode(process.env.JWT_SECRET)

export default async function AdminPage() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('session')

  if (!sessionCookie) redirect('/login')

  let session: any
  try {
    const { payload } = await jwtVerify(sessionCookie.value, getJwtSecret())
    session = payload
  } catch (error) {
    redirect('/login')
  }

  // Sécurité : Si l'utilisateur n'est pas ADMIN, on le renvoie vers le dashboard classique
  if (session.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Gestion Globale (Admin)</h1>
      <p className="text-slate-400 mb-8">Supervision de l'application en temps réel.</p>
      
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <p className="text-slate-300">Chargement des données en temps réel...</p>
      </div>
    </div>
  )
}