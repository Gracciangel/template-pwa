import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { ArrowLeft, CalendarDays, CalendarX, CheckCircle2, ChevronRight, Clock, RefreshCw, Tag, Ticket, XCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Spinner } from '../components/ui/Spinner'
import { fetchEventoPorId, registrosDelUsuario, ticketsDelUsuario } from '../lib/api'
import { supabase } from '../lib/supabase'
import { formatearFecha } from '../lib/cronograma'

type TicketData = {
  evento_id?: number
  nombre_evento?: string
  usuario_nombre?: string
  usuario_apellido?: string
  fecha_evento?: string
  hora_evento?: string
  precio_evento?: number
}

type TicketRow = {
  id: number
  estado: 'activo' | 'usado' | 'vencido'
  qr_data: string | TicketData
}

type Registro = {
  id: number
  evento_id: number
  partners?: { nombre: string; apellido: string }[]
  acompanantes?: { nombre: string; apellido: string }[]
  evento?: { nombre_evento?: string; fecha_evento?: string; hora_evento?: string } | null
}

const ESTADO_LABEL: Record<string, string> = { activo: 'Activa', usado: 'Usada', vencido: 'Vencida' }
const ESTADO_DOT: Record<string, string> = { activo: 'bg-green-500', usado: 'bg-amber-500', vencido: 'bg-red-500' }

export function parseTicketData(t?: TicketRow | null): TicketData {
  if (!t?.qr_data) return {}
  try {
    const d = typeof t.qr_data === 'string' ? JSON.parse(t.qr_data) : t.qr_data
    if (!d) return {}
    if (!d.fecha_evento && d.fecha) d.fecha_evento = d.fecha
    if (!d.hora_evento && d.hora) d.hora_evento = d.hora
    if (d.precio_evento == null && d.precio != null) d.precio_evento = d.precio
    return d
  } catch {
    return {}
  }
}

export function EventsRegisterPage() {
  const { usuario, cargando: cargandoAuth } = useAuth()
  const navigate = useNavigate()

  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [registros, setRegistros] = useState<Registro[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<(TicketRow & { _nombre_evento?: string }) | null>(null)
  const [generandoId, setGenerandoId] = useState<number | null>(null)
  const [refrescando, setRefrescando] = useState(false)
  const [qrVisible, setQrVisible] = useState(false)
  const [feedback, setFeedback] = useState<{ tipo: 'ok' | 'error'; mensaje: string } | null>(null)

  const selectedRef = useRef(selected)
  selectedRef.current = selected

  const cargarTickets = useCallback(async () => {
    if (!usuario) return
    const res = await ticketsDelUsuario(usuario.id)
    if (res.code === 200 && res.result) setTickets(res.result.filter((t) => t?.qr_data))
  }, [usuario])

  const cargarRegistros = useCallback(async () => {
    if (!usuario) return
    const res = await registrosDelUsuario(usuario.id)
    if (res.code === 200 && res.result) {
      const conEventos = await Promise.all(
        (res.result as Registro[]).map(async (r) => {
          const ev = await fetchEventoPorId(r.evento_id)
          return { ...r, evento: ev.code === 200 ? ev.result : null }
        }),
      )
      setRegistros(conEventos)
    }
  }, [usuario])

  const cargarTodo = useCallback(async () => {
    setCargando(true)
    setError(null)
    setSelected(null)
    try {
      await Promise.all([cargarTickets(), cargarRegistros()])
    } finally {
      setCargando(false)
    }
  }, [cargarTickets, cargarRegistros])

  const refrescarTicketActual = useCallback(async () => {
    if (!usuario) return
    setRefrescando(true)
    const res = await ticketsDelUsuario(usuario.id)
    if (res.code === 200 && res.result) {
      const nuevos = (res.result as TicketRow[]).filter((t) => t?.qr_data)
      setTickets(nuevos)
      const actual = selectedRef.current
      if (actual) {
        const match = nuevos.find((t) => t.id === actual.id)
        if (match) setSelected({ ...match, _nombre_evento: actual._nombre_evento })
      }
    }
    setRefrescando(false)
  }, [usuario])

  useEffect(() => {
    if (cargandoAuth) return
    if (!usuario) {
      navigate('/login', { replace: true })
      return
    }
    void cargarTodo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, cargandoAuth])

  useEffect(() => {
    if (!usuario) return
    const channel = supabase
      .channel(`tickets-${usuario.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets', filter: `usuario_id=eq.${usuario.id}` },
        () => void refrescarTicketActual(),
      )
      .subscribe()
    const interval = setInterval(() => void refrescarTicketActual(), 15000)
    return () => {
      void supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [usuario, refrescarTicketActual])

  const ticketPorEvento = (eventoId: number) => tickets.find((t) => parseTicketData(t).evento_id === eventoId)

  const abrirRegistro = (reg: Registro) => {
    const ticket = ticketPorEvento(reg.evento_id)
    if (ticket) {
      setSelected({ ...ticket, _nombre_evento: reg.evento?.nombre_evento })
      return
    }
    void regenerar(reg)
  }

  const regenerar = async (reg: Registro) => {
    if (!usuario) return
    setGenerandoId(reg.evento_id)
    const acompanantes = reg.partners || reg.acompanantes || []
    const { generarTicket } = await import('../lib/api')
    const res = await generarTicket(reg.evento_id, usuario.id, acompanantes)
    setGenerandoId(null)
    if (res.code === 200) {
      await cargarTickets()
      setFeedback({ tipo: 'ok', mensaje: 'Te registraste exitosamente' })
    } else {
      setFeedback({ tipo: 'error', mensaje: res.msj || 'Error al generar ticket' })
    }
    setTimeout(() => setFeedback(null), 2200)
  }

  if (cargando || cargandoAuth) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Spinner size={40} />
        <p className="text-zinc-400">Cargando eventos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6">
        <p className="text-center text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => void cargarTodo()}
          className="rounded-xl bg-purple-600 px-6 py-2.5 font-semibold text-white"
        >
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="">
      <div className="flex items-center px-4 py-3">
        <button
          type="button"
          aria-label="Volver"
          onClick={() => (selected ? setSelected(null) : navigate(-1))}
          className="text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="ml-4 text-xl font-bold text-white">{selected ? selected._nombre_evento : 'Mis Eventos'}</h1>
        {selected && (
          <button
            type="button"
            aria-label="Refrescar"
            onClick={() => void refrescarTicketActual()}
            disabled={refrescando}
            className={`ml-auto ${refrescando ? 'text-zinc-600' : 'text-white'}`}
          >
            <RefreshCw size={18} className={refrescando ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {selected ? (
        <TicketDetail
          selected={selected}
          refrescando={refrescando}
          onRefresh={() => void refrescarTicketActual()}
          onOpenQR={() => setQrVisible(true)}
        />
      ) : registros.length === 0 ? (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
          <CalendarX size={64} className="text-zinc-600" />
          <p className="mt-4 text-center text-lg text-zinc-500">No estás inscripto en ningún evento</p>
        </div>
      ) : (
        <div className="px-4 pb-10">
          {registros.map((reg) => {
            const ticket = ticketPorEvento(reg.evento_id)
            const isGenerating = generandoId === reg.evento_id
            return (
              <button
                key={reg.id}
                type="button"
                disabled={isGenerating}
                onClick={() => abrirRegistro(reg)}
                className="mb-4 block w-full overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-900 text-left"
              >
                <div className="flex items-center p-4">
                  <div className="mr-4 flex h-16 w-16 items-center justify-center">
                    <Ticket size={32} className="text-purple-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold leading-tight text-white">
                      {reg.evento?.nombre_evento || `Evento #${reg.evento_id}`}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-zinc-300">
                      <CalendarDays size={13} className="text-zinc-400" />
                      {formatearFecha(reg.evento?.fecha_evento ?? '', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-sm text-zinc-300">
                      <Clock size={13} className="text-zinc-400" />
                      {reg.evento?.hora_evento || 'â€”'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-700/30 bg-purple-600/10 px-4 py-3">
                  {ticket ? (
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={`h-2 w-2 rounded-full ${ESTADO_DOT[ticket.estado] ?? 'bg-zinc-500'}`} />
                      <span className="text-zinc-300">{ESTADO_LABEL[ticket.estado]}</span>
                    </span>
                  ) : (
                    <span className="text-sm text-purple-300">Pendiente</span>
                  )}
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-purple-300">
                    {ticket ? 'Ver entrada' : isGenerating ? 'Generando...' : 'Generar ticket'}
                    <ChevronRight size={14} />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {feedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-8">
          <div className="flex flex-col items-center rounded-2xl border border-zinc-700/50 bg-zinc-900 p-6">
            {feedback.tipo === 'ok' ? (
              <CheckCircle2 size={48} className="text-green-500" />
            ) : (
              <XCircle size={48} className="text-red-500" />
            )}
            <p className="mt-4 text-center text-lg font-semibold text-white">{feedback.mensaje}</p>
          </div>
        </div>
      )}

      {qrVisible && selected && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95"
          onClick={() => setQrVisible(false)}
        >
          <div className="rounded-xl bg-white p-4">
            <QRCodeSVG value={JSON.stringify(parseTicketData(selected))} size={Math.min(320, window.innerWidth * 0.75)} />
          </div>
          <p className="mt-6 text-center text-sm text-zinc-400">TocÃ¡ en cualquier parte para cerrar</p>
        </div>
      )}
    </div>
  )
}

function TicketDetail({
  selected,
  refrescando,
  onRefresh,
  onOpenQR,
}: {
  selected: TicketRow & { _nombre_evento?: string }
  refrescando: boolean
  onRefresh: () => void
  onOpenQR: () => void
}) {
  const d = parseTicketData(selected)
  const estadoColor = selected.estado === 'activo' ? 'text-green-700' : selected.estado === 'usado' ? 'text-zinc-500' : 'text-red-700'

  return (
    <div className="flex min-h-[65vh] items-center justify-center px-[8%] sm:px-[22%]">
      <div className="w-full overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex flex-col items-center px-6 pb-8 pt-10">
          <h2 className="text-center text-[29px] font-black leading-tight text-gray-900">
            {selected._nombre_evento || d.nombre_evento}
          </h2>
          <button type="button" onClick={onOpenQR} className="relative mt-5">
            <QRCodeSVG value={JSON.stringify(d)} size={130} bgColor="#ffffff" fgColor="#000000" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white px-1.5 py-0.5 text-sm font-black text-black">TDG</span>
            </span>
          </button>
          <p className="mt-5 text-center text-2xl font-bold uppercase text-gray-900">
            {d.usuario_nombre} {d.usuario_apellido}
          </p>
          <button type="button" onClick={onRefresh} disabled={refrescando} className={`mt-2 text-base font-bold uppercase ${estadoColor}`}>
            {ESTADO_LABEL[selected.estado]}
          </button>
        </div>

        <div className="relative">
          <div className="mx-6 border-t border-dashed border-gray-300" />
          <span className="absolute -left-3 top-[-12px] h-6 w-6 rounded-full bg-black" />
          <span className="absolute -right-3 top-[-12px] h-6 w-6 rounded-full bg-black" />
        </div>

        <div className="flex flex-col items-start px-6 pb-9 pt-7">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
              <CalendarDays size={15} className="text-purple-700" />
            </span>
            <span className="text-lg font-semibold text-gray-800">
              {formatearFecha(d.fecha_evento ?? '', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
              <Clock size={15} className="text-purple-700" />
            </span>
            <span className="text-lg font-semibold text-gray-800">{d.hora_evento}</span>
          </div>
          {d.precio_evento != null && d.precio_evento >= 0 && (
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <Tag size={14} className="text-purple-700" />
              </span>
              <span className="text-lg font-semibold text-gray-800">
                {d.precio_evento === 0 ? 'GRATIS' : `$${d.precio_evento} ARS`}
              </span>
            </div>
          )}
          <div className="mt-7 flex w-full items-center justify-center border-t border-gray-200 pt-4">
            <img src="/img/icon.png" alt="" className="h-20 w-20 opacity-40" />
          </div>
        </div>
      </div>
    </div>
  )
}
