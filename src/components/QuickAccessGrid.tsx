import { Link } from 'react-router-dom'
import { CalendarDays, FileText, Mic2, Music, Video, type LucideIcon } from 'lucide-react'

type QuickLink = {
  to: string
  label: string
  icon: LucideIcon
}

const links: QuickLink[] = [
  { to: '/events-register', label: 'Eventos', icon: CalendarDays },
  { to: '/notes', label: 'Mis Notas', icon: FileText },
  { to: '/audios?type=P', label: 'Prédicas', icon: Mic2 },
  { to: '/musica', label: 'Música', icon: Music },
  { to: '/video', label: 'Videos', icon: Video },
]

export function QuickAccessGrid() {
  const esImpar = links.length % 2 !== 0

  return (
    <div className="mt-6 px-6">
      <h2 className="mb-3 text-center text-xl font-bold text-white">Recursos</h2>
      <div className="-m-1.5 flex flex-wrap">
        {links.map((link, i) => {
          const esUltimoImpar = esImpar && i === links.length - 1
          const Icon = link.icon
          return (
            <div key={link.to} className="p-1.5" style={{ width: esUltimoImpar ? '100%' : '50%' }}>
              <Link
                to={link.to}
                className="group relative flex flex-col items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black transition-colors hover:border-zinc-700"
                style={{ aspectRatio: esUltimoImpar ? '3.3' : '1.64' }}
              >
                <Icon size={44} className="text-zinc-400 transition-colors group-hover:text-white" strokeWidth={1.5} />
                <span className="mt-1 text-sm font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">{link.label}</span>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
