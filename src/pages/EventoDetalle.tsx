import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CalendarX, Clock, Plus, Tag, Users, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Spinner } from '../components/ui/Spinner'
import { agregarParticipante, fetchEventoPorId, fetchParticipantes } from '../lib/api'
import { formatearFecha } from '../lib/cronograma'

type Participante = { id: number; nombre: string; apellido: string }
type Evento = {
  id: number
  nombre_evento?: string
  fecha_evento?: string
  hora_evento?: string
  precio_evento?: number
  edad_min?: number
  edad_max?: number
}

function tipoEvento(min: number, max: number): string {
  if (max <= 12) return 'Niños'
  if (min >= 60) return 'Adultos mayores'
  if (min >= 18) return 'Jóvenes y adultos'
  if (max <= 17) return 'Adolescentes'
  if (min <= 5) return 'Niños'
  return 'Todo público'
}

export function EventoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [evento, setEvento] = useState<Evento | null>(null)
  const [participantes, setParticipantes] = useState<Participante[]>([])
  const [cargando, setCargando] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')

  useEffect(() => {
    if (!id) return
    let cancelled = false
    void (async () => {
      const res = await fetchEventoPorId(Number(id))
      if (!cancelled && res.code === 200 && res.result) setEvento(res.result as Evento)
      const pres = await fetchParticipantes(Number(id))
      if (!cancelled && pres.code === 200 && pres.result) setParticipantes(pres.result as Participante[])
      if (!cancelled) setCargando(false)
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const handleAgregar = useCallback(async () => {
    if (!evento || !nombre.trim() || !apellido.trim()) return
    const res = await agregarParticipante(evento.id, nombre.trim(), apellido.trim(), usuario?.id)
    if (res.code === 200) {
      const pres = await fetchParticipantes(evento.id)
      if (pres.code === 200 && pres.result) setParticipantes(pres.result as Participante[])
      setNombre('')
      setApellido('')
      setShowForm(false)
    }
  }, [nombre, apellido, evento, usuario])

  if (cargando) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner size={40} />
      </div>
    )
  }

  if (!evento) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
        <CalendarX size={40} className="text-zinc-500" />
        <p className="mt-4 text-center text-lg text-zinc-400">No hay evento disponible</p>
        <button type="button" onClick={() => navigate(-1)} className="mt-6 rounded-xl bg-zinc-800 px-6 py-3 font-semibold text-white">
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="pt-safe px-6 pt-6">
      <button type="button" onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-white">
        <ArrowLeft size={20} />
        <span>Volver</span>
      </button>

      <div className="mb-6 rounded-2xl bg-zinc-900 p-6">
        <h1 className="mb-2 text-2xl font-bold text-white">
          {evento.nombre_evento || tipoEvento(evento.edad_min ?? 0, evento.edad_max ?? 99)}
        </h1>

        <div className="mb-3 flex items-center gap-3 text-base text-zinc-300">
          <Tag size={16} className="text-purple-400" />
          <span>
            Precio: <span className="font-semibold text-white">{!evento.precio_evento ? 'GRATIS' : `$${evento.precio_evento} ARS`}</span>
          </span>
        </div>

        <div className="mb-3 flex items-center gap-3 text-base text-zinc-300">
          <CalendarDays size={16} className="text-amber-500" />
          <span>
            Fecha: <span className="font-semibold text-white">{formatearFecha(evento.fecha_evento ?? '', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </span>
        </div>

        <div className="mb-3 flex items-center gap-3 text-base text-zinc-300">
          <Clock size={16} className="text-green-500" />
          <span>
            Hora: <span className="font-semibold text-white">{evento.hora_evento?.slice(0, 5) || '—'}</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-base text-zinc-300">
          <Users size={16} className="text-blue-500" />
          <span>
            Edad: <span className="font-semibold text-white">{evento.edad_min ?? 0} – {evento.edad_max ?? 99} años</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowForm(true)}
        className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-4 font-bold text-white hover:bg-purple-500"
      >
        <Plus size={18} />
        Agregar participantes
      </button>

      {participantes.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">Participantes ({participantes.length})</h2>
          {participantes.map((p) => (
            <div key={p.id} className="mb-2 flex items-center rounded-xl bg-zinc-900 p-4">
              <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-purple-700 text-sm font-bold text-white">
                {p.nombre[0]}
                {p.apellido[0]}
              </div>
              <span className="font-medium text-white">
                {p.nombre} {p.apellido}
              </span>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/70" onClick={() => setShowForm(false)}>
          <div className="w-full rounded-t-xl bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Agregar participante</h2>
              <button type="button" aria-label="Cerrar" onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <input
              placeholder="Nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mb-3 w-full rounded-xl bg-zinc-800 px-4 py-3 text-white outline-none placeholder:text-zinc-600"
            />
            <input
              placeholder="Apellido"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              className="mb-4 w-full rounded-xl bg-zinc-800 px-4 py-3 text-white outline-none placeholder:text-zinc-600"
            />
            <button type="button" onClick={() => void handleAgregar()} className="w-full rounded-xl bg-purple-600 py-3 font-bold text-white">
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
