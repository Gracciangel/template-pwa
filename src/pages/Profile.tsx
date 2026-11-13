import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Building2, Users } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/ui/Avatar'

const sections = [
  { title: 'Ministerios', links: [{ to: '/ministerios', label: 'Ver', icon: Building2 }] },
  { title: 'Grupos', links: [{ to: '/groups', label: 'Ver', icon: Users }] },
]

export function ProfilePage() {
  const { usuario, noLeidas, refrescarNoLeidas, cargando } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!cargando && !usuario) navigate('/login', { replace: true })
  }, [usuario, cargando, navigate])

  useEffect(() => {
    refrescarNoLeidas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!usuario) return null

  const initials = `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`
  const nombre = `${usuario.nombre?.[0]?.toUpperCase() ?? ''}${usuario.nombre?.slice(1) ?? ''}`
  const apellido = `${usuario.apellido?.[0]?.toUpperCase() ?? ''}${usuario.apellido?.slice(1) ?? ''}`

  return (
    <div className="">
      <div className="relative px-6 pt-20">
        <Link to="/notificaciones" aria-label="Notificaciones" className="absolute right-12 top-3 text-white">
          <span className="relative inline-block">
            <Bell size={22} />
            {noLeidas > 0 && (
              <span className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {noLeidas > 99 ? '99+' : noLeidas}
              </span>
            )}
          </span>
        </Link>

        <div className="mb-6 flex items-center justify-evenly">
          <Avatar uri={usuario.avatar_url} size={64} initials={initials} />
          <p className="text-xl font-bold text-white">{`${nombre} ${apellido}`.trim()}</p>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="mb-6 rounded-xl bg-zinc-900 p-5">
            <h2 className="mb-3 text-lg font-bold text-white">{section.title}</h2>
            <div className="flex items-center gap-3">
              {section.links.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to} className="flex flex-1 flex-col items-center rounded-lg bg-zinc-800 p-4 text-white hover:bg-zinc-700">
                  <Icon size={24} />
                  <span className="mt-2 text-sm">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        <div className="mb-6 rounded-xl bg-zinc-900 p-5">
          <h2 className="mb-3 text-lg font-bold text-white">Cuenta</h2>
          <div className="flex items-center gap-3">
            <Link to="/notificaciones" className="relative flex flex-1 flex-col items-center rounded-lg bg-zinc-800 p-4 text-white hover:bg-zinc-700">
              <span className="relative">
                <Bell size={24} />
                {noLeidas > 0 && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {noLeidas > 99 ? '99+' : noLeidas}
                  </span>
                )}
              </span>
              <span className="mt-2 text-sm">Notificaciones</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
