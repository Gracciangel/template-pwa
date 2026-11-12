import { useCallback, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Calendar, ChevronRight, Lock, MapPin, Plus, Trash2, Users, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { Spinner } from '../components/ui/Spinner'
import { StageCanvas } from '../components/dance/StageCanvas'
import { useDanceMap } from '../hooks/useDanceMap'
import { formatearFecha, parseCanciones } from '../lib/cronograma'

export function DanzaMapaPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { usuario, ministerios } = useAuth()

  const id = searchParams.get('id') ?? ''
  const nombre = searchParams.get('nombre') ?? ''
  const modo = searchParams.get('modo')
  const ministerioId = Number(id)
  const esSoloVer = modo === 'ver'

  const esMiembroDanza = useMemo(
    () => ministerios.some((m) => Number(m.id) === ministerioId),
    [ministerios, ministerioId],
  )
  const esLiderDanza = useMemo(
    () => ministerios.some((m) => Number(m.id) === ministerioId && m.es_lider),
    [ministerios, ministerioId],
  )

  const d = useDanceMap(ministerioId, usuario?.id)

  const routerBack = useCallback(
    () => navigate(`/ministerio/${id}?nombre=${encodeURIComponent(nombre)}`),
    [navigate, id, nombre],
  )

  const esMiPosicion = useCallback((userId: string) => usuario?.id === userId, [usuario])

  if (!usuario) return null

  if (!esMiembroDanza) {
    return (
      <div className="pt-safe flex min-h-[70vh] flex-col items-center justify-center px-6">
        <Lock size={40} className="text-zinc-600" />
        <p className="mt-4 text-center text-lg text-zinc-400">No tenés acceso a este mapa</p>
        <button
          type="button"
          onClick={routerBack}
          className="mt-6 rounded-xl bg-zinc-800 px-6 py-3 font-semibold text-white"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="pt-safe pb-24">
      <div className="flex items-center px-4 py-3">
        <button type="button" aria-label="Volver" onClick={routerBack} className="mr-3 text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          {d.cancionActual ? (
            <button type="button" onClick={d.volverALista} className="truncate text-left text-lg font-bold text-white">
              {d.cancionActual}
            </button>
          ) : (
            <h1 className="truncate text-lg font-bold text-white">
              {esSoloVer ? `Ver posiciones - ${nombre}` : `Mapa de ${nombre}`}
            </h1>
          )}
          {d.cronogramaSel && (
            <p className="text-xs text-zinc-400">
              {formatearFecha(d.cronogramaSel.fecha_evento, { day: 'numeric', month: 'long' })}
            </p>
          )}
        </div>
        {esLiderDanza && (
          <span className="rounded bg-green-900/30 px-2 py-1 text-xs text-green-400">Líder</span>
        )}
      </div>

      {d.cancionActual && (
        <>
          <StageCanvas
            loading={d.loading}
            positions={d.positions}
            modoMover={d.modoMover}
            esMiPosicion={esMiPosicion}
            onSelectUser={d.setSelectedUser}
            onMapPress={d.handleMapPress}
          />

          {esLiderDanza && !esSoloVer && (
            <>
              <button
                type="button"
                aria-label="Agregar bailarín"
                onClick={async () => {
                  await d.fetchDisponibles()
                  d.setModalAgregar(true)
                }}
                className="fixed bottom-36 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg shadow-purple-900/50 hover:bg-purple-500"
              >
                <Plus size={22} />
              </button>
              <button
                type="button"
                onClick={() => d.setModalConfirmar(true)}
                className="mx-4 mb-4 w-[calc(100%-2rem)] rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-500"
              >
                Finalizar mapa
              </button>
            </>
          )}
        </>
      )}

      {/* Selector de itinerario / canción */}
      {!d.cancionActual && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <div className="max-h-[75vh] w-full max-w-md overflow-y-auto rounded-2xl bg-zinc-900 p-6">
            <div className="mb-5 flex items-center justify-between">
              {d.cronogramaSel ? (
                <button
                  type="button"
                  aria-label="Volver a itinerarios"
                  onClick={d.volverALista}
                  className="mr-2 text-zinc-400 hover:text-white"
                >
                  <ArrowLeft size={20} />
                </button>
              ) : null}
              <h2 className="flex-1 text-lg font-bold text-white">
                {d.cronogramaSel ? 'Seleccionar canción' : 'Seleccionar itinerario'}
              </h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={routerBack}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {d.cronogramaSel ? (
              d.cancionesLista.length === 0 ? (
                <p className="py-12 text-center text-zinc-500">Este itinerario no tiene canciones</p>
              ) : (
                d.cancionesLista.map((cancion, i) => (
                  <button
                    key={`${cancion}-${i}`}
                    type="button"
                    onClick={() => d.seleccionarCancion(cancion)}
                    className="flex w-full items-center border-b border-zinc-800 py-4 text-left hover:bg-zinc-800/40"
                  >
                    <span className="mr-3 w-5 text-xs font-bold text-green-400">{i + 1}</span>
                    <span className="flex-1 font-semibold text-white">{cancion}</span>
                    <ChevronRight size={14} className="text-zinc-600" />
                  </button>
                ))
              )
            ) : d.cronogramas.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <Calendar size={30} className="text-zinc-600" />
                <p className="mt-3 text-center text-zinc-500">No hay itinerarios disponibles</p>
              </div>
            ) : (
              d.cronogramas.map((c) => {
                const canciones = parseCanciones(c.contenido)
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => d.setCronogramaSel(c)}
                    className="block w-full border-b border-zinc-800 py-4 text-left hover:bg-zinc-800/40"
                  >
                    <span className="mb-1 flex items-center gap-2">
                      <Calendar size={14} className="text-amber-500" />
                      <span className="font-semibold text-white">
                        {formatearFecha(c.fecha_evento, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </span>
                    <span className="mb-1 block text-xs text-zinc-500">
                      {canciones.length} canciones · {c.informante}
                    </span>
                    {canciones.length > 0 && (
                      <span className="line-clamp-2 block text-sm leading-5 text-zinc-400">
                        {canciones.join(' · ')}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Detalle del bailarín */}
      {d.selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => d.setSelectedUser(null)}
        >
          <div
            className="max-h-[65%] w-full max-w-md overflow-y-auto rounded-t-xl bg-zinc-900 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center gap-4">
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => d.setSelectedUser(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
              <p className="flex-1 text-lg font-bold text-white">
                {d.selectedUser.nombre} {d.selectedUser.apellido ?? ''}
              </p>
            </div>

            <div className="mb-6 flex justify-center">
              <Avatar
                uri={d.selectedUser.avatar_url}
                size={80}
                initials={`${d.selectedUser.nombre?.[0] ?? ''}${d.selectedUser.apellido?.[0] ?? ''}`}
              />
            </div>

            {esLiderDanza && !esSoloVer && (
              <>
                <button
                  type="button"
                  onClick={() => d.handleMovePin(d.selectedUser!.user_id)}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-4 font-semibold text-purple-400 hover:bg-zinc-700"
                >
                  <MapPin size={16} />
                  Mover posición
                </button>
                <button
                  type="button"
                  onClick={() => void d.handleRemovePin(d.selectedUser!.user_id)}
                  className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-800 py-4 font-semibold text-red-400 hover:bg-zinc-700"
                >
                  <Trash2 size={16} />
                  Quitar del mapa
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Agregar bailarín */}
      {d.modalAgregar && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => d.setModalAgregar(false)}
        >
          <div
            className="max-h-[65%] w-full max-w-md overflow-y-auto rounded-t-xl bg-zinc-900 p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Agregar bailarín</h2>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => d.setModalAgregar(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {d.disponibles.length === 0 ? (
              <div className="flex flex-col items-center py-12">
                <Users size={30} className="text-zinc-600" />
                <p className="mt-3 text-center text-zinc-500">
                  No hay más bailarines disponibles
                </p>
              </div>
            ) : (
              d.disponibles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => void d.handleAgregarUsuario(item)}
                  className="flex w-full items-center border-b border-zinc-800 py-3.5 text-left hover:bg-zinc-800/40"
                >
                  <Avatar
                    uri={item.avatar_url}
                    size={40}
                    initials={`${item.nombre?.[0] ?? ''}${item.apellido?.[0] ?? ''}`}
                  />
                  <span className="ml-3 flex-1 font-medium text-white">
                    {item.nombre} {item.apellido}
                  </span>
                  <Plus size={18} className="text-purple-400" />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {d.modalConfirmar && (
        <Modal
          title="Finalizar mapa"
          description={`Se enviará una notificación a los ${d.positions.length} bailarín(es) posicionados para "${d.cancionActual}" del ${d.cronogramaSel?.fecha_evento ?? ''}.`}
          type="info"
          onClose={{ action: () => d.setModalConfirmar(false), label: 'Cancelar' }}
          onConfirm={{
            action: () => void d.handleFinalizar(),
            label: d.confirmando ? 'Enviando...' : 'Confirmar',
          }}
        />
      )}

      {d.alertaPocos && (
        <Modal
          title="Pocos bailarines"
          description="Debés agregar al menos 2 bailarines en distintos puntos para finalizar el mapa."
          type="warning"
          onClose={{ action: () => d.setAlertaPocos(false), label: 'Entendido' }}
        />
      )}

      {d.loading && !d.cancionActual && (
        <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center">
          <Spinner size={40} />
        </div>
      )}
    </div>
  )
}
