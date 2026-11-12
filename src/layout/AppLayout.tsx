import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BookOpen, Home, Share2, UserCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/ui/Avatar'
import { ProfileMenu } from '../components/ProfileMenu'

const PUBLIC_TABS = [
  { to: '/', label: 'Inicio', icon: Home, end: true },
  { to: '/bible', label: 'Biblia', icon: BookOpen, end: false },
  { to: '/social', label: 'Redes', icon: Share2, end: false },
]

export function AppLayout() {
  const { usuario, noLeidas } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  const estaLogueado = !!usuario
  const enPerfil = location.pathname === '/profile'
  const initials = usuario ? `${usuario.nombre?.[0] ?? ''}${usuario.apellido?.[0] ?? ''}`.toUpperCase() : ''

  const handlePerfil = () => {
    if (!estaLogueado) {
      navigate('/login')
      return
    }
    if (enPerfil) setMenuOpen(true)
    else navigate('/profile')
  }

  return (
    <div className="flex min-h-full flex-col bg-black">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-zinc-900 bg-black pb-safe">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around px-2">
          {PUBLIC_TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`
              }
            >
              <Icon size={24} />
              <span className="text-[10px]">{label}</span>
            </NavLink>
          ))}

          <button
            type="button"
            aria-label={estaLogueado ? 'Perfil' : 'Login'}
            onClick={handlePerfil}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors ${
              estaLogueado && enPerfil ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {estaLogueado ? (
              <span className="relative">
                <Avatar uri={usuario?.avatar_url} size={24} initials={initials} />
                {noLeidas > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {noLeidas > 99 ? '99+' : noLeidas}
                  </span>
                )}
              </span>
            ) : (
              <UserCircle size={24} />
            )}
            <span className="text-[10px]">{estaLogueado ? 'Perfil' : 'Login'}</span>
          </button>
        </div>
      </nav>

      <ProfileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}
