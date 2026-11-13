import { Calendar, Trash2 } from 'lucide-react'
import { Spinner } from '../ui/Spinner'
import type { CronogramaEntry } from '../../lib/types'
import { formatearFecha, parseCanciones } from '../../lib/cronograma'

interface Props {
  cronogramas: CronogramaEntry[]
  cargando: boolean
  esLider: boolean
  onEditar: (c: CronogramaEntry) => void
  onEliminar: (c: CronogramaEntry) => void
}

export function CronogramaList({ cronogramas, cargando, esLider, onEditar, onEliminar }: Props) {
  return (
    <>
      <h2 className="mb-3 text-lg font-bold text-white">Itinerarios ({cronogramas.length})</h2>

      {cargando ? (
        <div className="flex items-center justify-center py-20">
          <Spinner size={56} />
        </div>
      ) : cronogramas.length === 0 ? (
        <p className="py-8 text-center text-zinc-500">
          No hay itinerarios aún.{esLider ? ' Seleccioná una fecha futura para crear uno.' : ''}
        </p>
      ) : (
        cronogramas.map((c) => {
          const canciones = parseCanciones(c.contenido)
          return (
            <div
              key={c.id}
              role={esLider ? 'button' : undefined}
              tabIndex={esLider ? 0 : undefined}
              onClick={() => esLider && onEditar(c)}
              onKeyDown={(e) => {
                if (esLider && (e.key === 'Enter' || e.key === ' ')) onEditar(c)
              }}
              className={`mb-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 ${
                esLider ? 'cursor-pointer hover:border-zinc-700' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar size={14} className="shrink-0 text-amber-500" />
                    <span className="font-semibold text-white">
                      {formatearFecha(c.fecha_evento, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {canciones.length > 0 && (
                    <div className="mt-1 rounded-lg bg-zinc-800/50 p-3">
                      {canciones.map((cancion, i) => (
                        <div key={`${cancion}-${i}`} className="flex items-center py-1">
                          <span className="mr-2 text-xs text-green-400">{i + 1}.</span>
                          <span className="text-sm text-zinc-300">{cancion}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-2 text-xs text-zinc-500">Creado por {c.informante}</p>
                </div>

                {esLider && (
                  <button
                    type="button"
                    aria-label="Eliminar itinerario"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEliminar(c)
                    }}
                    className="ml-3 rounded-lg p-2 text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          )
        })
      )}
    </>
  )
}
