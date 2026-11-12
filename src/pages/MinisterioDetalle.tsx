import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Cog,
  Eye,
  MapPin,
  Music,
  Users,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/ui/Avatar'
import { Spinner } from '../components/ui/Spinner'
import { supabase } from '../lib/supabase'

type Miembro = {
  id: string
  nombre: string
  apellido: string
  avatar_url: string | null
}

function ActionCard({
  to,
  icon: Icon,
  iconColor,
  title,
  subtitle,
  tone = 'purple',
}: {
  to: string
  icon: typeof Music
  iconColor: string
  title: string
  subtitle: string
  tone?: 'purple' | 'dark'
}) {
  return (
    <Link
      to={to}
      className={`mb-4 block w-full rounded-2xl border border-zinc-700/50 px-5 py-6 text-center transition-colors ${
        tone === 'purple' ? 'bg-zinc-500/80 hover:bg-zinc-500' : 'bg-zinc-800/80 hover:bg-zinc-800'
      }`}
    >
      <Icon size={40} className="mx-auto" style={{ color: iconColor }} />
      <p className="mt-2 text-xl font-bold text-white">{title}</p>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
    </Link>
  )
}

export function MinisterioDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, ministerios } = useAuth()

  const nombre =
    (location.state as { nombre?: string } | null)?.nombre ??
    searchParams.get('nombre') ??
    ministerios.find((m) => String(m.id) === id)?.nombre ??
    ''

  const ministerioActual = ministerios.find((m) => String(m.id) === id)
  const esDanza = nombre.toLowerCase() === 'danza'
  const esMiembroDanza = esDanza && !!ministerioActual
  const esLiderDanza = esMiembroDanza && ministerioActual?.es_lider === true
  const esLiderDeEsteMinisterio = ministerioActual?.es_lider === true

  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    setCargando(true)
    void (async () => {
      const idNum = Number(id)
      const [{ data: allUsers }, { data: allUms }] = await Promise.all([
        supabase.rpc('get_all_usuarios'),
        supabase.rpc('get_all_usuario_ministerios'),
      ])
      if (cancelled) return
      const ids = new Set(
        ((allUms as Record<string, unknown>[]) || [])
          .filter((u) => Number(u.ministerio_id) === idNum)
          .map((u) => u.usuario_id as string),
      )
      setMiembros(
        ((allUsers as Record<string, unknown>[]) || [])
          .filter((u) => ids.has(u.id as string))
          .map((m) => ({
            id: m.id as string,
            nombre: (m.nombre as string) ?? '',
            apellido: (m.apellido as string) ?? '',
            avatar_url: (m.avatar_url as string) || null,
          })),
      )
      setCargando(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const nombreQuery = encodeURIComponent(nombre)

  return (
    <div className="pt-safe px-6 pb-24 pt-16">
      <button
        type="button"
        onClick={() => navigate('/ministerios')}
        className="mb-6 flex items-center gap-2 text-white"
      >
        <ArrowLeft size={20} />
        <span>Volver</span>
      </button>

      <div className="mb-8 flex items-center gap-3">
        <Building2 size={32} className="text-white" />
        <h1 className="text-2xl font-bold text-white">{nombre}</h1>
      </div>

      {esDanza && esMiembroDanza ? (
        <>
          {esLiderDanza && (
            <ActionCard
              to={`/ministerio/danza-mapa?id=${id}&nombre=${nombreQuery}`}
              icon={MapPin}
              iconColor="#a78bfa"
              title={`Mapa de ${nombre}`}
              subtitle="Administrar posiciones"
            />
          )}
          <ActionCard
            to={`/ministerio/danza-mapa?id=${id}&nombre=${nombreQuery}&modo=ver`}
            icon={Eye}
            iconColor="#22c55e"
            title="Ver posiciones"
            subtitle="Ver posiciones en el escenario"
          />
        </>
      ) : esDanza ? null : (
        <>
          <ActionCard
            to={`/canciones?id=${id}&nombre=${nombreQuery}`}
            icon={Music}
            iconColor="#22c55e"
            title="Canciones"
            subtitle="Repertorio del ministerio"
          />
          <ActionCard
            to={`/ministerio/cronograma?id=${id}&nombre=${nombreQuery}`}
            icon={Calendar}
            iconColor="#f59e0b"
            title="Cronograma"
            subtitle="Fechas y Eventos"
          />
        </>
      )}

      <div className="mb-4">
        <h2 className="mb-3 text-lg font-bold text-white">Miembros</h2>
        {cargando ? (
          <div className="flex justify-center py-4">
            <Spinner size={40} />
          </div>
        ) : miembros.length === 0 ? (
          <p className="text-sm text-zinc-400">Sin miembros</p>
        ) : (
          miembros.map((m) => (
            <div key={m.id} className="mb-2 flex items-center rounded-xl bg-zinc-900 p-3">
              <Avatar
                uri={m.avatar_url}
                size={40}
                initials={`${m.nombre?.[0] ?? ''}${m.apellido?.[0] ?? ''}`}
              />
              <span className="ml-3 font-semibold text-white">
                {m.nombre} {m.apellido}
              </span>
              {m.id === usuario?.id && (
                <span className="ml-auto text-xs font-bold text-green-400">Tú</span>
              )}
            </div>
          ))
        )}
      </div>

      {esLiderDeEsteMinisterio && !esDanza && (
        <Link
          to={`/admin/canciones?id=${id}&nombre=${nombreQuery}`}
          className="mt-2 flex w-full flex-col items-center rounded-2xl border border-zinc-700/50 bg-zinc-800/80 px-5 py-4 transition-colors hover:bg-zinc-800"
        >
          <Cog size={24} className="text-blue-500" />
          <span className="mt-1 font-bold text-blue-400">Administrar canciones</span>
        </Link>
      )}

      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-600">
        <Users size={14} />
        <span>{miembros.length} integrante(s)</span>
      </div>
    </div>
  )
}
