import { useCallback, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Plus, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Modal } from '../components/ui/Modal'
import { MonthCalendar } from '../components/ui/MonthCalendar'
import { Spinner } from '../components/ui/Spinner'
import { CronogramaList } from '../components/cronograma/CronogramaList'
import { useCronograma } from '../hooks/useCronograma'
import { formatearFecha } from '../lib/cronograma'
import { eliminarCronograma, eliminarPosicionesPorCronograma } from '../lib/api'

export function CronogramaPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { ministerios } = useAuth()

  const id = searchParams.get('id') ?? ''
  const ministerioId = Number(id)
  const nombre =
    searchParams.get('nombre') ??
    ministerios.find((m) => String(m.id) === id)?.nombre ??
    ''

  const {
    esLiderDeEsteMinisterio,
    cronogramas,
    cargandoLista,
    selectedDate,
    mostrarModal,
    setMostrarModal,
    canciones,
    editandoCronograma,
    setEditandoCronograma,
    inputCancion,
    setInputCancion,
    mostrandoInput,
    setMostrandoInput,
    guardando,
    confirmarEliminar,
    setConfirmarEliminar,
    reemplazoInfo,
    setReemplazoInfo,
    abrirModalCrear,
    agregarCancion,
    quitarCancion,
    handleGuardar,
    ejecutarGuardar,
    cargarCronogramas,
  } = useCronograma(ministerioId)

  const [alerta, setAlerta] = useState<{ titulo: string; msj: string } | null>(null)

  const handleDateChange = useCallback(
    (date: Date) => {
      if (!esLiderDeEsteMinisterio) return
      const hoy = new Date()
      hoy.setHours(0, 0, 0, 0)
      const elegida = new Date(date)
      elegida.setHours(0, 0, 0, 0)
      if (elegida <= hoy) return
      abrirModalCrear(elegida.toISOString().split('T')[0])
    },
    [esLiderDeEsteMinisterio, abrirModalCrear],
  )

  const handleEliminar = useCallback(async () => {
    if (!confirmarEliminar) return
    const res = await eliminarCronograma(confirmarEliminar.id)
    if (res.code === 200) {
      await eliminarPosicionesPorCronograma(confirmarEliminar.id)
      setConfirmarEliminar(null)
      void cargarCronogramas()
    } else {
      setAlerta({
        titulo: 'Error',
        msj: res.msj || 'Ocurrió un error al eliminar el cronograma.',
      })
    }
  }, [confirmarEliminar, cargarCronogramas, setConfirmarEliminar])

  const handleGuardarConAlertas = useCallback(async () => {
    const res = await handleGuardar()
    if (res?.code === 400) {
      setAlerta({
        titulo: 'Sin canciones',
        msj: res.msj || 'Debés agregar al menos una canción para guardar el cronograma.',
      })
    } else if (res?.code && res.code !== 200 && res.code !== 300) {
      setAlerta({
        titulo: 'Error',
        msj: res.msj || 'Ocurrió un error al guardar el cronograma.',
      })
    }
  }, [handleGuardar])

  return (
    <div className="px-4 pb-10 pt-6">
      {alerta && (
        <Modal
          title={alerta.titulo}
          description={alerta.msj}
          type="warning"
          onClose={{ action: () => setAlerta(null), label: 'Cerrar' }}
        />
      )}

      {reemplazoInfo.visible && reemplazoInfo.reemplazado && (
        <Modal
          title="Reemplazar cronograma"
          description={`Ya hay 2 cronogramas en esta semana. Al guardar, se reemplazará el del ${formatearFecha(
            reemplazoInfo.reemplazado.fecha_evento,
            { day: 'numeric', month: 'long', year: 'numeric' },
          )} y se borrarán los datos de danza asociados. ¿Deseas continuar?`}
          type="warning"
          onClose={{
            action: () => setReemplazoInfo({ visible: false, reemplazado: null }),
            label: 'Cancelar',
          }}
          onConfirm={{
            action: () => {
              if (!reemplazoInfo.reemplazado) return
              setReemplazoInfo({ visible: false, reemplazado: null })
              void ejecutarGuardar(selectedDate, canciones, reemplazoInfo.reemplazado)
            },
            label: 'Reemplazar',
            destructive: true,
          }}
        />
      )}

      {confirmarEliminar && (
        <Modal
          title="Eliminar cronograma"
          description={`¿Estás seguro de eliminar el cronograma del ${formatearFecha(
            confirmarEliminar.fecha_evento,
            { day: 'numeric', month: 'long', year: 'numeric' },
          )}? También se eliminarán las posiciones de danza asociadas.`}
          type="warning"
          onClose={{ action: () => setConfirmarEliminar(null), label: 'Cancelar' }}
          onConfirm={{ action: () => void handleEliminar(), label: 'Eliminar', destructive: true }}
        />
      )}

      <button
        type="button"
        onClick={() => navigate(`/ministerio/${id}?nombre=${encodeURIComponent(nombre)}`)}
        className="mb-4 flex items-center gap-2 text-white"
      >
        <ArrowLeft size={20} />
        <span>Volver</span>
      </button>

      <h1 className="mb-1 text-2xl font-bold text-white">Cronograma</h1>
      <p className="mb-4 text-sm text-zinc-400">
        Ministerio: <span className="font-semibold text-white">{nombre}</span>
      </p>

      {esLiderDeEsteMinisterio && (
        <MonthCalendar onSelect={handleDateChange} minDate={new Date()} className="mb-6" />
      )}

      <CronogramaList
        cronogramas={cronogramas}
        cargando={cargandoLista}
        esLider={esLiderDeEsteMinisterio}
        onEditar={() => undefined}
        onEliminar={setConfirmarEliminar}
      />

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
          <div className="max-h-[85%] w-full max-w-2xl overflow-y-auto rounded-t-xl bg-zinc-900 p-5">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editandoCronograma ? 'Editar canciones' : 'Agregar canciones'}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {formatearFecha(selectedDate, { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => {
                  setMostrarModal(false)
                  setEditandoCronograma(null)
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {canciones.map((cancion, i) => (
              <div key={`${cancion}-${i}`} className="mb-2 flex items-center rounded-lg bg-zinc-800 px-3 py-3">
                <span className="mr-3 text-xs font-bold text-green-400">{i + 1}</span>
                <span className="flex-1 text-white">{cancion}</span>
                <button
                  type="button"
                  aria-label={`Quitar ${cancion}`}
                  onClick={() => quitarCancion(i)}
                  className="text-red-500 hover:text-red-400"
                >
                  <X size={18} />
                </button>
              </div>
            ))}

            {mostrandoInput ? (
              <div className="mb-3 flex items-center rounded-lg bg-zinc-800 px-3 py-2">
                <input
                  autoFocus
                  value={inputCancion}
                  onChange={(e) => setInputCancion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') agregarCancion()
                    if (e.key === 'Escape') {
                      setMostrandoInput(false)
                      setInputCancion('')
                    }
                  }}
                  placeholder="Nombre de la canción"
                  className="flex-1 bg-transparent py-2 text-white outline-none placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  aria-label="Agregar"
                  onClick={agregarCancion}
                  className="ml-2 text-green-500 hover:text-green-400"
                >
                  <CheckCircle2 size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Cancelar"
                  onClick={() => {
                    setMostrandoInput(false)
                    setInputCancion('')
                  }}
                  className="ml-2 text-zinc-400 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setMostrandoInput(true)}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-600 bg-zinc-800/50 py-3 text-sm font-semibold text-purple-400 hover:bg-zinc-800"
              >
                <Plus size={14} />
                Agregar canción
              </button>
            )}

            <button
              type="button"
              onClick={() => void handleGuardarConAlertas()}
              disabled={guardando}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 font-bold text-white hover:bg-green-500 disabled:opacity-60"
            >
              {guardando && <Spinner size={18} />}
              {guardando
                ? 'Guardando...'
                : editandoCronograma
                  ? `Actualizar (${canciones.length} canciones)`
                  : `Guardar Itinerario (${canciones.length} canciones)`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
