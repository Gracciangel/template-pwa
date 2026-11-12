import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import {
  activarPush,
  desactivarPush,
  estadoPush,
  pushActivo,
  sincronizarPush,
  type PushEstado,
} from '../lib/push'

export function PushToggle() {
  const { usuario } = useAuth()
  const [estado, setEstado] = useState<PushEstado>('default')
  const [activo, setActivo] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!usuario) return
    setEstado(estadoPush())
    void pushActivo().then(setActivo)
    void sincronizarPush(usuario.id)
  }, [usuario])

  const activar = useCallback(async () => {
    if (!usuario) return
    setCargando(true)
    setError('')
    try {
      await activarPush(usuario.id)
      setEstado(estadoPush())
      setActivo(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron activar las notificaciones.')
      setEstado(estadoPush())
    } finally {
      setCargando(false)
    }
  }, [usuario])

  const desactivar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      await desactivarPush()
      setActivo(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron desactivar las notificaciones.')
    } finally {
      setCargando(false)
    }
  }, [])

  if (!usuario || estado === 'no-soportado' || estado === 'sin-configurar') return null

  if (estado === 'denied') {
    return (
      <div className="mx-4 mb-4 flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <BellOff size={18} className="mt-0.5 shrink-0 text-zinc-500" />
        <p className="text-sm text-zinc-400">
          Bloqueaste las notificaciones en este navegador. Para activarlas, habilitalas desde la
          configuración del sitio.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-4 mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center gap-3">
        {activo ? (
          <BellRing size={18} className="shrink-0 text-green-500" />
        ) : (
          <Bell size={18} className="shrink-0 text-zinc-400" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">
            {activo ? 'Notificaciones push activas' : 'Notificaciones push'}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {activo
              ? 'Vas a recibir avisos de eventos, prédicas y posiciones de danza.'
              : 'Activalas para recibir avisos aunque la app esté cerrada.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void (activo ? desactivar() : activar())}
          disabled={cargando}
          className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-60 ${
            activo ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-purple-600 hover:bg-purple-500'
          }`}
        >
          {cargando ? <Loader2 size={14} className="animate-spin" /> : activo ? 'Desactivar' : 'Activar'}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  )
}
