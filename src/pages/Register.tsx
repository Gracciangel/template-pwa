import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { resendOTP, signUpWithEmail, verifySignUpOTP } from '../lib/api'
import { supabase } from '../lib/supabase'

const PASOS = ['Nombre y apellido', 'Cuenta', 'ContraseÃ±a'] as const

export function RegisterPage() {
  const navigate = useNavigate()
  const [terminos, setTerminos] = useState(false)
  const [verTerminos, setVerTerminos] = useState(false)
  const [paso, setPaso] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    nombre_usuario: '',
    email: '',
    pass: '',
    passConfirm: '',
  })

  const [pendingEmail, setPendingEmail] = useState<string | null>(null)
  const [otp, setOtp] = useState('')

  const update = (field: keyof typeof form, value: string) => {
    setError(undefined)
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validarPaso = (): string | null => {
    if (paso === 0) {
      if (!form.nombre.trim() || !form.apellido.trim()) return 'CompletÃ¡ todos los campos'
      if (form.nombre.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres'
      if (form.apellido.trim().length < 2) return 'El apellido debe tener al menos 2 caracteres'
      if (form.nombre.trim().length > 50) return 'El nombre es demasiado largo'
      if (form.apellido.trim().length > 50) return 'El apellido es demasiado largo'
      return null
    }
    if (paso === 1) {
      if (!form.nombre_usuario.trim()) return 'IngresÃ¡ un nombre de usuario'
      if (form.nombre_usuario.trim().length < 3) return 'El nombre de usuario debe tener al menos 3 caracteres'
      if (form.nombre_usuario.trim().length > 20) return 'El nombre de usuario es demasiado largo'
      if (!/^[a-zA-Z0-9_]+$/.test(form.nombre_usuario.trim())) return 'Solo letras, nÃºmeros y guiÃ³n bajo'
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Email invÃ¡lido'
      if (form.email.trim().length > 100) return 'Email demasiado largo'
      return null
    }
    if (!form.pass || form.pass.length < 6) return 'MÃ­nimo 6 caracteres'
    if (form.pass !== form.passConfirm) return 'Las contraseÃ±as no coinciden'
    return null
  }

  const handleNext = async () => {
    const err = validarPaso()
    if (err) {
      setError(err)
      return
    }
    if (paso < PASOS.length - 1) {
      setPaso((p) => p + 1)
      return
    }
    if (submitting) return
    setSubmitting(true)
    setError(undefined)
    try {
      const res = await signUpWithEmail({
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        nombre_usuario: form.nombre_usuario.trim(),
        email: form.email.trim(),
        pass: form.pass,
      })
      if (res.code === 200) setPendingEmail(form.email.trim().toLowerCase())
      else setError(res.msj || 'Error al registrar el usuario')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el usuario')
    } finally {
      setSubmitting(false)
    }
  }

  const verificar = async () => {
    if (!pendingEmail) return
    if (otp.length !== 6) {
      setError('IngresÃ¡ el cÃ³digo completo de 6 dÃ­gitos')
      return
    }
    setSubmitting(true)
    setError(undefined)
    try {
      const res = await verifySignUpOTP(pendingEmail, otp)
      if (res.code === 200) {
        await supabase.auth.updateUser({ password: form.pass })
        navigate('/', { replace: true })
      } else {
        setError(res.msj || 'CÃ³digo invÃ¡lido o expirado')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar el cÃ³digo')
    } finally {
      setSubmitting(false)
    }
  }

  const reenviar = async () => {
    if (!pendingEmail) return
    setSubmitting(true)
    setError(undefined)
    const res = await resendOTP(pendingEmail)
    if (res.code !== 200) setError(res.msj || 'Error al reenviar el cÃ³digo')
    setSubmitting(false)
  }

  if (!terminos) {
    return (
      <div className="">
        <div className="mx-auto flex min-h-[85vh] max-w-xl flex-col justify-center px-6 py-10">
          <h1 className="mb-4 text-2xl font-bold text-white">TÃ©rminos y Condiciones</h1>
          <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-xl bg-zinc-900 p-5 text-sm leading-relaxed text-zinc-300">
            <p>Al crear una cuenta en Tiempo de Gracia aceptÃ¡s usar la aplicaciÃ³n de forma respetuosa y con fines relacionados a la comunidad.</p>
            <p>Los datos que proporcionÃ¡s (nombre, apellido, email, foto de perfil) se usan Ãºnicamente para identificarte dentro de la app y gestionar tu participaciÃ³n en grupos, ministerios y eventos.</p>
            <p>PodÃ©s solicitar la eliminaciÃ³n de tu cuenta y tus datos en cualquier momento contactando a los responsables de la comunidad.</p>
            <p>No compartimos tu informaciÃ³n con terceros ajenos a la prestaciÃ³n del servicio.</p>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => navigate(-1)}>
              Rechazar
            </Button>
            <Button variant="purple" className="flex-1" onClick={() => setTerminos(true)}>
              Aceptar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (pendingEmail) {
    return (
      <div className="">
        <div className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-center px-6 py-10">
          <h1 className="mb-2 text-center text-xl font-bold text-white">VerificÃ¡ tu email</h1>
          <p className="mb-6 text-center text-sm text-zinc-400">
            Enviamos un cÃ³digo de 6 dÃ­gitos a <span className="font-semibold text-white">{pendingEmail}</span>
          </p>
          <Input
            label="CÃ³digo de verificaciÃ³n"
            value={otp}
            onChange={(v) => {
              setError(undefined)
              setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))
            }}
            placeholder="000000"
            inputMode="numeric"
            className="text-center text-2xl tracking-[0.5em]"
          />
          {error && <div className="mb-4 rounded-xl border border-red-900/50 bg-red-900/30 p-3 text-center text-sm text-red-400">{error}</div>}
          <Button variant="purple" className="w-full" loading={submitting} onClick={verificar}>
            Verificar
          </Button>
          <button type="button" onClick={reenviar} className="mt-4 text-sm text-purple-400 hover:underline">
            Reenviar cÃ³digo
          </button>
          <button
            type="button"
            onClick={() => {
              setPendingEmail(null)
              setOtp('')
              setError(undefined)
            }}
            className="mt-2 text-sm text-zinc-500 hover:text-zinc-300"
          >
            Usar otro email
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="">
      <div className="mx-auto flex min-h-[85vh] max-w-md flex-col justify-center px-5 py-10">
        <h1 className="mb-6 text-center text-xl text-white">Crear Cuenta</h1>

        <div className="mb-6 flex items-center justify-center gap-2">
          {PASOS.map((p, i) => (
            <div key={p} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  i <= paso ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {i < paso ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              {i < PASOS.length - 1 && <div className={`h-px w-8 ${i < paso ? 'bg-purple-600' : 'bg-zinc-800'}`} />}
            </div>
          ))}
        </div>

        <p className="mb-4 text-center text-sm font-semibold text-zinc-400">{PASOS[paso]}</p>

        <div className="rounded-2xl bg-zinc-900 p-5">
          {paso === 0 && (
            <>
              <Input label="Nombre" placeholder="Tu nombre" value={form.nombre} onChange={(v) => update('nombre', v)} autoFocus />
              <Input label="Apellido" placeholder="Tu apellido" value={form.apellido} onChange={(v) => update('apellido', v)} />
            </>
          )}

          {paso === 1 && (
            <>
              <Input label="Nombre de usuario" placeholder="Ej: juan123" value={form.nombre_usuario} onChange={(v) => update('nombre_usuario', v)} autoFocus />
              <Input label="Email" type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={(v) => update('email', v)} />
            </>
          )}

          {paso === 2 && (
            <>
              <Input label="ContraseÃ±a" type="password" placeholder="MÃ­nimo 6 caracteres" value={form.pass} onChange={(v) => update('pass', v)} autoFocus />
              <Input label="Confirmar contraseÃ±a" type="password" placeholder="RepetÃ­ la contraseÃ±a" value={form.passConfirm} onChange={(v) => update('passConfirm', v)} />
            </>
          )}

          {error && <div className="mb-4 rounded-xl border border-red-900/50 bg-red-900/30 p-3 text-center text-sm text-red-400">{error}</div>}

          <div className="flex gap-3">
            {paso > 0 && (
              <Button variant="ghost" className="flex-1" onClick={() => { setError(undefined); setPaso((p) => p - 1) }}>
                AtrÃ¡s
              </Button>
            )}
            <Button variant="purple" className="flex-1" loading={submitting} onClick={handleNext}>
              {paso === PASOS.length - 1 ? 'Crear cuenta' : 'Siguiente'}
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 px-1">
          <span className="text-sm text-green-500">âœ“</span>
          <span className="text-sm text-zinc-500">TÃ©rminos y condiciones aceptados</span>
          <button type="button" onClick={() => setVerTerminos(true)} className="text-sm text-blue-500 underline">
            Ver
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="mb-3 text-xl text-gray-500">Â¿Ya tenÃ©s una cuenta?</p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            IniciÃ¡ SesiÃ³n
          </Button>
        </div>
      </div>

      {verTerminos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={() => setVerTerminos(false)}>
          <div className="max-h-[70vh] w-full max-w-md overflow-y-auto rounded-2xl bg-zinc-900 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="mb-3 text-lg font-bold text-white">TÃ©rminos y Condiciones</h2>
            <div className="space-y-3 text-sm leading-relaxed text-zinc-300">
              <p>Al crear una cuenta en Tiempo de Gracia aceptÃ¡s usar la aplicaciÃ³n de forma respetuosa y con fines relacionados a la comunidad.</p>
              <p>Los datos que proporcionÃ¡s se usan Ãºnicamente para identificarte dentro de la app y gestionar tu participaciÃ³n en grupos, ministerios y eventos.</p>
              <p>PodÃ©s solicitar la eliminaciÃ³n de tu cuenta y tus datos en cualquier momento contactando a los responsables de la comunidad.</p>
            </div>
            <Button variant="ghost" className="mt-5 w-full" onClick={() => setVerTerminos(false)}>
              Cerrar
            </Button>
          </div>
        </div>
      )}

      {submitting && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur">
          <Spinner size={44} />
          <p className="text-zinc-300">Procesando...</p>
        </div>
      )}
    </div>
  )
}
