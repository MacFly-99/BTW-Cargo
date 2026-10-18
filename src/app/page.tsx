import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 text-white p-8">
      <h1 className="text-6xl font-bold tracking-tight">
        🚢 BTW-Cargo
      </h1>
      <p className="mt-4 text-xl text-slate-300">
        Optimisation de la logistique maritime
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 transition"
        >
          Se connecter
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-600 px-6 py-3 font-semibold hover:bg-slate-800 transition"
        >
          Voir le Dashboard
        </Link>
      </div>
    </main>
  );
}