import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Logo } from '../components/ui/Logo'
import { Spinner } from '../components/ui/Spinner'
import { loginWithEmail, signInWithGoogle } from '../lib/api'

export function LoginPage() {
  const { usuario, refrescarUsuario, refrescarEntidades } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    if (usuario) navigate('/', { replace: true })
  }, [usuario, navigate])

  const handleAuth = async () => {
    const mail = email.trim().toLowerCase()
    if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setError('Email inválido')
      return
    }
    if (!pass || pass.length < 6) {
      setError('Contraseña inválida')
      return
    }
    setLoading(true)
    setError(undefined)
    try {
      const res = await loginWithEmail(mail, pass)
      if (res.code === 200 && res.result) {
        await refrescarUsuario()
        await refrescarEntidades()
        navigate('/', { replace: true })
      } else {
        setError(res.msj || 'Error al autenticar el usuario')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al autenticar el usuario')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError(undefined)
    setLoading(true)
    const res = await signInWithGoogle(
      `${window.location.origin}${import.meta.env.BASE_URL}auth/callback`,
    )
    if (res.code !== 200 || !res.result) {
      setError(res.msj || 'Error al iniciar sesión con Google')
      setLoading(false)
      return
    }
    window.location.assign(res.result)
  }

  return (
    <div className="">
      <div className="flex min-h-[85vh] flex-col justify-center px-5 pb-12">
        <Logo size={200} />

        <div className="rounded-2xl bg-zinc-900 p-6">
          <Input label="Email" placeholder="tu@email.com" type="email" value={email} onChange={(v) => { setError(undefined); setEmail(v) }} />
          <Input label="Contraseña" type="password" placeholder="••••••••" value={pass} onChange={(v) => { setError(undefined); setPass(v) }} />

          {error && (
            <div className="mb-4 rounded-xl border border-red-900/50 bg-red-900/30 p-3 text-center text-sm text-red-400">{error}</div>
          )}

          <Button variant="purple" className="w-full" loading={loading} disabled={!email || !pass} onClick={handleAuth}>
            Iniciar Sesión
          </Button>

          <div className="my-4 flex items-center">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="mx-3 text-sm text-zinc-500">O</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-700 py-3.5 text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            <GoogleIcon />
            <span className="font-semibold">Continuar con Google</span>
          </button>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4 pb-6">
          <p className="text-zinc-500">¿No tenés una cuenta?</p>
          <Link to="/register" className="rounded-xl border border-purple-500/30 px-10 py-3 font-bold text-purple-400 hover:bg-purple-500/10">
            Crear cuenta
          </Link>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur">
          <Spinner size={44} />
          <p className="text-zinc-300">Iniciando sesión...</p>
        </div>
      )}
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  )
}
