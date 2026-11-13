import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Music, RefreshCw } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Spinner } from '../components/ui/Spinner'
import { fetchCanciones } from '../lib/api'
import type { ICancion } from '../lib/types'

export function CancionesPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { usuario, ministerios, cargando: cargandoAuth } = useAuth()

  const id = searchParams.get('id') ?? ''
  const nombre =
    searchParams.get('nombre') ??
    ministerios.find((m) => String(m.id) === id)?.nombre ??
    ''

  const [canciones, setCanciones] = useState<ICancion[]>([])
  const [cargando, setCargando] = useState(true)
  const [refrescando, setRefrescando] = useState(false)

  useEffect(() => {
    if (!cargandoAuth && !usuario) navigate('/login', { replace: true })
  }, [usuario, cargandoAuth, navigate])

  const cargar = useCallback(async () => {
    if (!usuario || !id) {
      setCargando(false)
      return
    }
    setCargando(true)
    const res = await fetchCanciones(Number(id), usuario.id)
    if (res.result) setCanciones(res.result)
    setCargando(false)
  }, [id, usuario])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const onRefresh = useCallback(async () => {
    setRefrescando(true)
    await cargar()
    setRefrescando(false)
  }, [cargar])

  return (
    <div className="px-6 pb-24 pt-16">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Music size={32} className="text-white" />
          <h1 className="text-2xl font-bold text-white">{nombre}</h1>
        </div>
        <button
          type="button"
          aria-label="Refrescar"
          onClick={() => void onRefresh()}
          className="rounded-full p-2 text-zinc-400 hover:text-white"
        >
          <RefreshCw size={18} className={refrescando ? 'animate-spin' : ''} />
        </button>
      </div>

      {cargando ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
          <Spinner size={72} />
          <p className="text-zinc-400">Cargando canciones...</p>
        </div>
      ) : canciones.length === 0 ? (
        <p className="mt-10 text-center text-gray-400">
          No hay canciones activas en este ministerio
        </p>
      ) : (
        canciones.map((cancion) => (
          <Link
            key={cancion.id}
            to={`/cancion/${cancion.id}`}
            className="mb-3 block w-full rounded-2xl border border-zinc-700/50 bg-zinc-500/80 px-5 py-4 transition-colors hover:bg-zinc-500"
          >
            <p className="text-lg font-bold text-white">{cancion.titulo}</p>
            <div className="mt-1 flex items-center gap-4">
              <span className="text-sm text-zinc-400">{cancion.autor}</span>
              <span className="rounded-md bg-zinc-700 px-2 py-0.5 text-xs font-semibold text-white">
                {cancion.tono_original}
              </span>
            </div>
          </Link>
        ))
      )}

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mt-6 flex items-center gap-2 text-zinc-400 hover:text-white"
      >
        <ArrowLeft size={18} />
        Volver
      </button>
    </div>
  )
}
