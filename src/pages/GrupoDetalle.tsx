import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarCheck2,
  CalendarDays,
  ArrowLeftRight,
  Lock,
  Mic2,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { MonthCalendar } from '../components/ui/MonthCalendar'
import { CronogramaList } from '../components/cronograma/CronogramaList'
import { capitalizar, formatearFecha, parsePredicador } from '../lib/cronograma'
import {
  crearCronogramaGrupo,
  eliminarCronogramaGrupo,
  fetchCronogramasByGrupo,
  fetchMiembrosGrupo,
  fetchMisPredicasGrupo,
  solicitarReprogramacion,
} from '../lib/api'
import { supabase } from '../lib/supabase'
import type { CronogramaEntry, MiembroGrupo } from '../lib/types'

function puedeReprogramar(fechaEvento: string) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const evento = new Date(`${fechaEvento}T00:00:00`)
  return (evento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24) >= 3
}

export function GrupoDetallePage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { usuario, grupos } = useAuth()

  const grupo = grupos.find((g) => String(g.id) === id)
  const nombre =
    (location.state as { nombre?: string } | null)?.nombre ?? grupo?.nombre ?? ''
  const grupoId = Number(id)
  const esPredicas = nombre.toLowerCase().includes('predica')
  const esLider = grupo?.es_lider === true

  const [miembros, setMiembros] = useState<MiembroGrupo[]>([])
  const [cargandoMiembros, setCargandoMiembros] = useState(true)

  const [cronogramas, setCronogramas] = useState<CronogramaEntry[]>([])
  const [cargandoCrono, setCargandoCrono] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)
  const [selectedMember, setSelectedMember] = useState<MiembroGrupo | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [confirmarEliminar, setConfirmarEliminar] = useState<CronogramaEntry | null>(null)
  const [alerta, setAlerta] = useState<{ titulo: string; msj: string } | null>(null)

  const [reemplazoInfo, setReemplazoInfo] = useState<{ visible: boolean; existente: CronogramaEntry | null }>({
    visible: false,
    existente: null,
  })

  const [misPredicas, setMisPredicas] = useState<CronogramaEntry[]>([])
  const [cargandoMisPredicas, setCargandoMisPredicas] = useState(false)
  const [mostrarReprogramacion, setMostrarReprogramacion] = useState<CronogramaEntry | null>(null)
  const [reprogMensaje, setReprogMensaje] = useState('')
  const [enviandoReprog, setEnviandoReprog] = useState(false)

  const cargarCronogramas = useCallback(async () => {
    if (!grupoId) {
      setCargandoCrono(false)
      return
    }
    setCargandoCrono(true)
    const res = await fetchCronogramasByGrupo(grupoId)
    if (res.code === 200 && res.result) setCronogramas(res.result)
    setCargandoCrono(false)
  }, [grupoId])

  useEffect(() => {
    if (!id) return
    setCargandoMiembros(true)
    fetchMiembrosGrupo(Number(id)).then((res) => {
      if (res.code === 200 && res.result) setMiembros(res.result)
      setCargandoMiembros(false)
    })
  }, [id])

  useEffect(() => {
    void cargarCronogramas()
  }, [cargarCronogramas])

  useEffect(() => {
    if (!esLider && esPredicas && usuario?.id && grupoId) {
      setCargandoMisPredicas(true)
      fetchMisPredicasGrupo(grupoId, usuario.id).then((res) => {
        if (res.code === 200 && res.result) setMisPredicas(res.result)
        setCargandoMisPredicas(false)
      })
    }
  }, [esLider, esPredicas, usuario?.id, grupoId])

  const handleDateChange = useCallback(
    (date: Date) => {
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const elegida = new Date(date)
      elegida.setHours(0, 0, 0, 0)
      if (elegida <= hoy) return
      if (!esLider) {
        setAlerta({
          titulo: 'Solo líderes',
          msj: 'Solo el líder del grupo puede asignar predicadores.',
        })
        return
      }
      setSelectedDate(elegida.toISOString().split('T')[0])
      setSelectedMember(null)
      setMostrarModal(true)
    },
    [esLider],
  )

  const guardarCronograma = useCallback(
    async (reemplazar: boolean) => {
      if (!selectedDate || !selectedMember) return
      setGuardando(true)
      const nombreCompleto = `${selectedMember.nombre} ${selectedMember.apellido}`
      const contenido = JSON.stringify([
        { titulo: nombreCompleto, predicador_id: selectedMember.id },
      ])
      const informante = [usuario?.nombre, usuario?.apellido].filter(Boolean).join(' ') || ''
      const res = await crearCronogramaGrupo(grupoId, informante, selectedDate, contenido, reemplazar)
      setGuardando(false)
      if (res.code === 200) {
        void supabase.rpc('enviar_push_notificacion', {
          p_titulo: 'Asignado como predicador',
          p_cuerpo: `Fuiste asignado para predicar el ${formatearFecha(selectedDate, {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}`,
          p_tipo: 'predica',
          p_usuario_ids: [selectedMember.id],
        })
        setMostrarConfirmar(false)
        setReemplazoInfo({ visible: false, existente: null })
        setSelectedMember(null)
        void cargarCronogramas()
      } else if (res.code === 409) {
        setMostrarConfirmar(false)
        setReemplazoInfo({ visible: true, existente: res.result?.cronograma ?? null })
      } else {
        setAlerta({ titulo: 'Error', msj: res.msj || 'Error al guardar' })
        setMostrarConfirmar(false)
        setReemplazoInfo({ visible: false, existente: null })
        setSelectedMember(null)
      }
    },
    [grupoId, selectedDate, selectedMember, usuario, cargarCronogramas],
  )

  const handleEliminar = useCallback(async () => {
    if (!confirmarEliminar) return
    const res = await eliminarCronogramaGrupo(confirmarEliminar.id)
    if (res.code === 200) {
      setConfirmarEliminar(null)
      void cargarCronogramas()
    } else {
      setAlerta({ titulo: 'Error', msj: res.msj || 'Error al eliminar' })
    }
  }, [confirmarEliminar, cargarCronogramas])

  const handleEnviarReprogramacion = useCallback(async () => {
    if (!mostrarReprogramacion || !reprogMensaje.trim() || !usuario?.id) return
    setEnviandoReprog(true)
    const res = await solicitarReprogramacion(
      mostrarReprogramacion.id,
      usuario.id,
      reprogMensaje.trim(),
    )
    setEnviandoReprog(false)
    if (res.code === 200) {
      setMostrarReprogramacion(null)
      setReprogMensaje('')
      setAlerta({
        titulo: 'Solicitud enviada',
        msj: 'El líder del grupo recibirá tu solicitud de reprogramación.',
      })
    } else {
      setAlerta({ titulo: 'Error', msj: res.msj || 'Error al enviar solicitud' })
    }
  }, [mostrarReprogramacion, reprogMensaje, usuario?.id])

  const miembrosOrdenados = useMemo(
    () => [...miembros].sort((a, b) => `${a.nombre} ${a.apellido}`.localeCompare(`${b.nombre} ${b.apellido}`)),
    [miembros],
  )

  return (
    <div className="px-6 pb-24 pt-16">
      {alerta && (
        <Modal
          title={alerta.titulo}
          description={alerta.msj}
          type="warning"
          onClose={{ action: () => setAlerta(null), label: 'Cerrar' }}
        />
      )}

      {confirmarEliminar && (
        <Modal
          title="Eliminar"
          description={`¿Eliminar la prédica del ${formatearFecha(confirmarEliminar.fecha_evento, {
            day: 'numeric',
            month: 'long',
          })}?`}
          type="warning"
          onClose={{ action: () => setConfirmarEliminar(null), label: 'Cancelar' }}
          onConfirm={{ action: () => void handleEliminar(), label: 'Eliminar', destructive: true }}
        />
      )}

      {reemplazoInfo.visible && reemplazoInfo.existente && (
        <Modal
          title="Fecha ocupada"
          description={`La fecha ${capitalizar(
            formatearFecha(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }),
          )} ya tiene asignado a ${parsePredicador(reemplazoInfo.existente.contenido)} como predicador. ¿Deseas reemplazarlo?`}
          type="warning"
          onClose={{
            action: () => {
              setReemplazoInfo({ visible: false, existente: null })
              setSelectedMember(null)
            },
            label: 'Cancelar',
          }}
          onConfirm={{ action: () => void guardarCronograma(true), label: 'Reemplazar', destructive: true }}
        />
      )}

      {mostrarReprogramacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-700/50 bg-zinc-900 px-6 py-8">
            {enviandoReprog ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-lg font-semibold text-white">Enviando solicitud...</p>
                <Spinner size={48} />
              </div>
            ) : (
              <>
                <CalendarDays size={36} className="mx-auto mb-4 text-amber-500" />
                <h2 className="mb-1 text-center text-lg font-bold text-white">
                  Solicitar reprogramación
                </h2>
                <p className="mb-2 text-center text-sm text-zinc-400">
                  {capitalizar(
                    formatearFecha(mostrarReprogramacion.fecha_evento, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }),
                  )}
                </p>
                <p className="mb-6 text-center text-xs text-zinc-500">
                  {parsePredicador(mostrarReprogramacion.contenido)}
                </p>
                <textarea
                  value={reprogMensaje}
                  onChange={(e) => setReprogMensaje(e.target.value)}
                  placeholder="Escribí el motivo de la reprogramación..."
                  className="mb-6 min-h-[100px] w-full resize-none rounded-xl bg-zinc-800 p-4 text-white outline-none placeholder:text-zinc-600"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarReprogramacion(null)
                      setReprogMensaje('')
                    }}
                    className="flex-1 rounded-xl bg-red-600 py-3.5 font-bold text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleEnviarReprogramacion()}
                    disabled={!reprogMensaje.trim()}
                    className="flex-1 rounded-xl bg-green-600 py-3.5 font-bold text-white disabled:opacity-40"
                  >
                    Enviar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-zinc-700/50 bg-zinc-900 px-5 py-6">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Asignar predicador</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {selectedDate &&
                    formatearFecha(selectedDate, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setMostrarModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {cargandoMiembros ? (
              <p className="py-8 text-center text-zinc-500">Cargando miembros...</p>
            ) : miembrosOrdenados.length === 0 ? (
              <p className="py-8 text-center text-zinc-500">No hay miembros en este grupo.</p>
            ) : (
              miembrosOrdenados.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedMember(m)
                    setMostrarModal(false)
                    setMostrarConfirmar(true)
                  }}
                  className="mb-2 flex w-full items-center rounded-xl bg-zinc-800 p-3 text-left hover:bg-zinc-700"
                >
                  <Avatar
                    uri={m.avatar_url}
                    size={44}
                    initials={`${m.nombre?.[0] ?? ''}${m.apellido?.[0] ?? ''}`}
                  />
                  <span className="ml-3 flex-1">
                    <span className="block font-semibold text-white">
                      {m.nombre} {m.apellido}
                    </span>
                    <span className="block text-xs text-zinc-500">
                      {m.role || (m.role_id === 1 ? 'Líder' : 'Miembro')}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {mostrarConfirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-zinc-700/50 bg-zinc-900 px-6 py-8">
            {guardando ? (
              <div className="flex flex-col items-center gap-3">
                <p className="text-lg font-semibold text-white">Guardando...</p>
                <p className="text-sm text-zinc-400">Asignando predicador, por favor esperá.</p>
              </div>
            ) : (
              <>
                <CalendarCheck2 size={40} className="mx-auto mb-4 text-green-500" />
                <p className="mb-2 text-center font-semibold text-white">
                  Asignar usuario para predicar el
                </p>
                <p className="mb-6 text-center text-lg font-bold text-green-400">
                  {capitalizar(
                    formatearFecha(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' }),
                  )}
                </p>
                {selectedMember && (
                  <div className="mb-6 flex w-full items-center rounded-xl bg-zinc-800 px-4 py-3">
                    <Avatar
                      uri={selectedMember.avatar_url}
                      size={36}
                      initials={`${selectedMember.nombre?.[0] ?? ''}${selectedMember.apellido?.[0] ?? ''}`}
                    />
                    <span className="ml-3 font-semibold text-white">
                      {selectedMember.nombre} {selectedMember.apellido}
                    </span>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarConfirmar(false)
                      setSelectedMember(null)
                    }}
                    className="flex-1 rounded-xl bg-zinc-700 py-3.5 font-bold text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void guardarCronograma(false)}
                    className="flex-1 rounded-xl bg-green-600 py-3.5 font-bold text-white"
                  >
                    Aceptar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate('/groups')}
        className="mb-6 flex items-center gap-2 text-white"
      >
        <ArrowLeft size={20} />
        <span>Volver</span>
      </button>

      <div className="mb-8 flex items-center gap-3">
        <Users size={32} className="text-white" />
        <h1 className="text-2xl font-bold text-white">{nombre}</h1>
        {esLider && <span className="text-xs font-bold text-green-400">(Líder)</span>}
      </div>

      {esLider && esPredicas && (
        <>
          <h2 className="mb-1 text-2xl font-bold text-white">Cronograma de Prédicas</h2>
          <p className="mb-4 text-sm text-zinc-400">
            Seleccioná una fecha futura para asignar un predicador.
          </p>

          <MonthCalendar onSelect={handleDateChange} minDate={new Date()} className="mb-6" />

          <CronogramaList
            cronogramas={cronogramas}
            cargando={cargandoCrono}
            esLider={esLider}
            onEditar={() => undefined}
            onEliminar={setConfirmarEliminar}
          />
        </>
      )}

      {!esLider && esPredicas && (
        <>
          <h2 className="mb-4 text-2xl font-bold text-white">Mis predicaciones</h2>
          {cargandoMisPredicas ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size={56} />
            </div>
          ) : misPredicas.length === 0 ? (
            <p className="py-8 text-center text-zinc-500">
              No tenés fechas programadas para predicar.
            </p>
          ) : (
            misPredicas.map((c) => {
              const puede = puedeReprogramar(c.fecha_evento)
              return (
                <div key={c.id} className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                  <div className="mb-3 flex items-start gap-3">
                    <span className="rounded-full bg-amber-500/20 p-3">
                      <Mic2 size={18} className="text-amber-500" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-white">
                        {capitalizar(
                          formatearFecha(c.fecha_evento, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          }),
                        )}
                      </p>
                      <p className="mt-1 text-sm text-zinc-400">
                        {formatearFecha(c.fecha_evento, { year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 rounded-lg bg-zinc-800/50 px-4 py-3">
                    <p className="text-sm text-zinc-300">
                      <span className="text-zinc-500">Predicador: </span>
                      {parsePredicador(c.contenido)}
                    </p>
                  </div>

                  {c.observaciones ? (
                    <div className="rounded-xl bg-zinc-800/50 px-4 py-3">
                      <p className="mb-1 text-xs text-zinc-400">Motivo de reprogramación:</p>
                      <p className="text-sm text-zinc-300">{c.observaciones}</p>
                    </div>
                  ) : puede ? (
                    <button
                      type="button"
                      onClick={() => {
                        setMostrarReprogramacion(c)
                        setReprogMensaje('')
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-500"
                    >
                      <ArrowLeftRight size={14} />
                      Pedir reprogramación
                    </button>
                  ) : (
                    <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800/30 py-3 font-semibold text-zinc-600">
                      <Lock size={14} />
                      Reprogramación no disponible
                    </div>
                  )}
                </div>
              )
            })
          )}
        </>
      )}
    </div>
  )
}
