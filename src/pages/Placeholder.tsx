import { Link } from 'react-router-dom'
import { Construction } from 'lucide-react'

export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <div className="pt-safe flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <Construction size={40} className="text-zinc-600" />
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <p className="text-sm text-zinc-400">{description ?? 'Esta pantalla todavía se está migrando.'}</p>
      <Link to="/" className="text-sm text-purple-400 underline">
        Volver al inicio
      </Link>
    </div>
  )
}
