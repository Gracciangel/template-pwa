import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { ChordSheet } from '../components/ChordSheet'
import { Spinner } from '../components/ui/Spinner'
import { fetchCancion } from '../lib/api'
import { transponerContenido, transponerTono } from '../lib/transposer'
import type { ICancion } from '../lib/types'

export function CancionDetallePage() {
  const { id } = useParams<{ id: string }>()
  const { usuario, cargando: cargandoAuth } = useAuth()
  const navigate = useNavigate()

  const [cancion, setCancion] = useState<ICancion | null>(null)
  const [cargando, setCargando] = useState(true)
  const [transpose, setTranspose] = useState(0)

  useEffect(() => {
    if (!usuario || !id) {
      if (!cargandoAuth) setCargando(false)
      return
    }
    let cancelled = false
    setCargando(true)
    fetchCancion(Number(id), usuario.id).then((res) => {
      if (cancelled) return
      if (res.result) setCancion(res.result)
      setCargando(false)
    })
    return () => {
      cancelled = true
    }
  }, [id, usuario, cargandoAuth])

  if (cargando) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <Spinner size={72} />
        <p className="text-zinc-400">Cargando...</p>
      </div>
    )
  }

  if (!cancion) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6">
        <p className="text-gray-400">Canción no encontrada</p>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="mt-6 rounded-xl bg-zinc-800 px-6 py-3 font-semibold text-white"
        >
          Volver
        </button>
      </div>
    )
  }

  const tonoActual = transponerTono(cancion.tono_original, transpose)
  const contenidoTranspuesto = transponerContenido(cancion.contenido || '', transpose)

  return (
    <div className="pt-safe px-6 pb-24 pt-16">
      <button
        type="button"
        onClick={() => navigate('/profile')}
        className="mb-4 flex items-center gap-2 text-white"
      >
        <ArrowLeft size={20} />
        <span>Volver</span>
      </button>

      <h1 className="mb-1 text-3xl font-bold text-white">{cancion.titulo}</h1>
      <p className="mb-4 text-base text-zinc-400">{cancion.autor}</p>

      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-700/50 bg-zinc-800/60 px-4 py-3">
        <span className="text-sm font-semibold text-zinc-400">Tono</span>
        <button
          type="button"
          aria-label="Bajar medio tono"
          onClick={() => setTranspose((t) => Math.max(t - 1, -6))}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-white hover:bg-zinc-600"
        >
          <Minus size={14} />
        </button>
        <span className="rounded-md bg-zinc-700 px-4 py-1 text-base font-bold text-white">
          {tonoActual}
        </span>
        <button
          type="button"
          aria-label="Subir medio tono"
          onClick={() => setTranspose((t) => Math.min(t + 1, 6))}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-white hover:bg-zinc-600"
        >
          <Plus size={14} />
        </button>
        {transpose !== 0 && (
          <button
            type="button"
            onClick={() => setTranspose(0)}
            className="text-xs text-zinc-500 underline hover:text-zinc-300"
          >
            reset
          </button>
        )}
      </div>

      <div className="border-t border-zinc-700 pt-4">
        <ChordSheet contenido={contenidoTranspuesto} />
      </div>
    </div>
  )
}
