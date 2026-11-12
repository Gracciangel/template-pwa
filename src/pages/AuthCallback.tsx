import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Spinner } from '../components/ui/Spinner'

export function AuthCallbackPage() {
  const { cargando, usuario } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  useEffect(() => {
    if (cargando) return
    const next = params.get('next') || '/'
    navigate(next, { replace: true })
  }, [cargando, usuario, navigate, params])

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
      <Spinner size={40} />
      <p className="text-zinc-400">Completando inicio de sesión...</p>
    </div>
  )
}
