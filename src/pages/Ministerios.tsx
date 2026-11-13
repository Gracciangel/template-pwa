import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, RefreshCw } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Card } from '../components/ui/Card'

export function MinisteriosPage() {
  const { usuario, ministerios, refrescarEntidades, cargando } = useAuth()
  const navigate = useNavigate()
  const [refrescando, setRefrescando] = useState(false)

  useEffect(() => {
    if (!cargando && !usuario) navigate('/login', { replace: true })
  }, [usuario, cargando, navigate])

  const onRefresh = useCallback(async () => {
    setRefrescando(true)
    await refrescarEntidades()
    setRefrescando(false)
  }, [refrescarEntidades])

  return (
    <div className="relative px-6 pb-10 pt-16">
      <button
        type="button"
        aria-label="Volver"
        onClick={() => navigate(-1)}
        className="absolute left-6 top-4 text-white"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 size={32} className="text-white" />
          <h1 className="text-2xl font-bold text-white">Ministerios</h1>
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

      <div className="flex flex-col gap-4">
        {ministerios.length > 0 ? (
          ministerios.map((ministerio) => (
            <button
              key={ministerio.id}
              type="button"
              className="w-full text-left"
              onClick={() =>
                navigate(`/ministerio/${ministerio.id}`, { state: { nombre: ministerio.nombre } })
              }
            >
              <Card icon={Building2} label={ministerio.nombre} />
            </button>
          ))
        ) : (
          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <p className="text-gray-400">No estás asignado a ningún Ministerio.</p>
            <p className="px-6 text-gray-400">
              Cuando te asignen vas a poder ver la información del ministerio acá.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
