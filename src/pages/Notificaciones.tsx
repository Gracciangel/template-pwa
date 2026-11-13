import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BellOff, Trash2 } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { PushToggle } from '../components/PushToggle'
import { Spinner } from '../components/ui/Spinner'
import {
  eliminarNotificacionUsuario,
  fetchNotificaciones,
  marcarNotificacionLeida,
  type NotificacionRow,
} from '../lib/api'
import { supabase } from '../lib/supabase'

export function NotificacionesPage() {
  const { usuario, refrescarNoLeidas, cargando: cargandoAuth } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<NotificacionRow[]>([])
  const [cargando, setCargando] = useState(true)
  const [seleccion, setSeleccion] = useState<NotificacionRow | null>(null)

  const cargar = useCallback(async () => {
    if (!usuario) return
    setItems(await fetchNotificaciones(usuario.id))
  }, [usuario])

  useEffect(() => {
    if (cargandoAuth) return
    if (!usuario) {
      navigate('/login', { replace: true })
      return
    }
    cargar().finally(() => setCargando(false))
  }, [usuario, cargandoAuth, navigate, cargar])

  useEffect(() => {
    if (!usuario) return
    const channel = supabaseChannel(usuario.id, () => {
      cargar()
      refrescarNoLeidas()
    })
    return () => {
      channel.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario])

  const abrir = async (n: NotificacionRow) => {
    if (!n.leida && usuario) {
      await marcarNotificacionLeida(n.id, usuario.id)
      setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, leida: true } : p)))
      refrescarNoLeidas()
    }
    setSeleccion(n)
  }

  const eliminar = async (n: NotificacionRow) => {
    if (!usuario) return
    await eliminarNotificacionUsuario(n.id, usuario.id)
    setItems((prev) => prev.filter((p) => p.id !== n.id))
    await refrescarNoLeidas()
  }

  return (
    <div className="">
      <div className="flex items-center px-4 py-3">
        <button type="button" onClick={() => navigate(-1)} aria-label="Volver" className="mr-3 text-white">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-white">Notificaciones</h1>
      </div>

      <PushToggle />

      {cargando ? (
        <div className="flex justify-center py-20">
          <Spinner size={36} />
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-20">
          <BellOff size={40} className="text-zinc-600" />
          <p className="mt-4 text-center text-zinc-500">No tenés notificaciones</p>
        </div>
      ) : (
        <div className="px-4">
          {items.map((n) => (
            <div key={n.id} className={`mb-3 flex items-start gap-2 rounded-xl p-4 ${n.leida ? 'bg-zinc-900' : 'border border-purple-700/50 bg-zinc-800'}`}>
              <button type="button" onClick={() => abrir(n)} className="min-w-0 flex-1 text-left">
                <div className="flex items-start justify-between">
                  <div className="mr-3 flex-1">
                    <p className={`text-sm ${n.leida ? 'text-zinc-400' : 'font-semibold text-white'}`}>{n.titulo}</p>
                    <p className={`mt-1 line-clamp-2 text-sm ${n.leida ? 'text-zinc-500' : 'text-zinc-300'}`}>{n.cuerpo}</p>
                  </div>
                  {!n.leida && <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-purple-500" />}
                </div>
                <p className="mt-2 text-sm text-zinc-500">{formatFecha(n.created_at)}</p>
              </button>
              <button type="button" onClick={() => eliminar(n)} aria-label="Eliminar" className="mt-1 text-zinc-500 hover:text-red-400">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {seleccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6" onClick={() => setSeleccion(null)}>
          <div className="min-h-[250px] w-full max-w-lg rounded-2xl border border-zinc-700/50 bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <h2 className="flex-1 text-2xl font-bold text-white">{seleccion.titulo}</h2>
              <button type="button" onClick={() => setSeleccion(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-sm text-zinc-400 hover:text-white">
                ✕
              </button>
            </div>
            <p className="whitespace-pre-line text-xl leading-relaxed text-zinc-300">{seleccion.cuerpo}</p>
            <p className="mt-6 text-base text-zinc-500">Notificación recibida el {formatFecha(seleccion.created_at)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function formatFecha(fecha: string) {
  try {
    return new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return fecha
  }
}

function supabaseChannel(usuarioId: string, onChange: () => void) {
  return supabase
    .channel(`notificaciones-${usuarioId}-${Date.now()}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notificaciones_usuarios', filter: `usuario_id=eq.${usuarioId}` },
      onChange,
    )
    .subscribe()
}
