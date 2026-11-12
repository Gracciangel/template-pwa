import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Building2, RefreshCw, Users } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Card } from '../components/ui/Card'
// import { Spinner } from '../components/ui/Spinner'

export function GroupsPage() {
  const { usuario, grupos, refrescarEntidades, cargando } = useAuth()
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
    <div className="pt-safe px-6 pb-10 pt-16">
      <button type="button" onClick={() => navigate(-1)} className="absolute left-6 top-4 text-white">
        <ArrowLeft size={24} />
      </button>

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users size={32} className="text-white" />
          <h1 className="text-2xl font-bold text-white">Grupos</h1>
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
        {grupos.length > 0 ? (
          grupos.map((grupo) => (
            <Link key={grupo.id} to={`/grupo/${grupo.id}`} state={{ nombre: grupo.nombre }} className="block">
              <Card icon={Users} label={grupo.nombre} variant="grupo" />
            </Link>
          ))
        ) : (
          <div className="mt-4 flex flex-col items-center gap-2 text-center">
            <p className="text-gray-400">No estás asignado a ningún grupo.</p>
            <p className="px-6 text-gray-400">Cuando te asignen vas a poder ver la información del grupo acá.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function GroupsHeaderIcon() {
  return <Building2 />
}
