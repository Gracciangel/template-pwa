import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, CalendarPlus, CheckCircle2, Clock, Copy, Plus, Tag, Trash2, User, X } from 'lucide-react'
import { useAuth } from '../auth/AuthProvider'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Modal } from './ui/Modal'
import { Spinner } from './ui/Spinner'
import {
  fetchEventoPorId,
  fetchNoticias,
  generarTicket,
  getAllPagosConfig,
  insertComprobante,
  registrarEnEvento,
  uploadToCloudinary,
  verificarInscripcion,
} from '../lib/api'

export type Noticia = {
  id: number
  titulo: string
  cuerpo: string
  link?: string | null
  image?: string | null
  evento_id?: number | null
  created_at: string
}

type EventoInfo = {
  id: number
  fecha_evento: string
  hora_evento?: string
  precio_evento?: number
  edad_min?: number
  edad_max?: number
}

type PagoConfig = { id: number; nombre: string; apellido: string; alias?: string; cbu?: string; banco?: string; activo?: boolean }

type Acompanante = { nombre: string; apellido: string }

export function NoticiasList({ onReady }: { onReady?: () => void }) {
  const { usuario, refrescarNoLeidas } = useAuth()
  const navigate = useNavigate()
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalNoticia, setModalNoticia] = useState<Noticia | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [registerNoticia, setRegisterNoticia] = useState<Noticia | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(false)
  const indexRef = useRef(0)

  const cargar = useCallback(async () => {
    const res = await fetchNoticias()
    if (res.code !== 200) {
      setError(res.msj || 'Error al obtener las noticias')
      setNoticias([])
    } else {
      setError(null)
      setNoticias(res.result ?? [])
    }
  }, [])

  useEffect(() => {
    cargar().finally(() => {
      setCargando(false)
      onReady?.()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargar])

  // Auto-avance del carrusel
  useEffect(() => {
    if (noticias.length < 2) return
    const el = scrollRef.current
    if (!el) return
    const timer = setInterval(() => {
      if (pausedRef.current) return
      indexRef.current = (indexRef.current + 1) % noticias.length
      const card = el.children[indexRef.current] as HTMLElement | undefined
      if (card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' })
    }, 4000)
    return () => clearInterval(timer)
  }, [noticias.length])

  const handleRegistrate = useCallback(
    async (noticia: Noticia) => {
      setModalNoticia(null)
      if (!usuario) {
        setShowLogin(true)
        return
      }
      setRegisterNoticia(noticia)
    },
    [usuario],
  )

  if (cargando) return null

  return (
    <div className="mb-4">
      <h2 className="mb-3 px-6 text-center text-xl font-bold text-white">Noticias</h2>
      {error && <p className="px-6 text-center text-sm text-red-400">{error}</p>}
      {!error && noticias.length === 0 && <p className="px-6 text-center text-sm text-zinc-400">No hay noticias por el momento</p>}

      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={() => (pausedRef.current = true)}
        onPointerUp={() => setTimeout(() => (pausedRef.current = false), 5000)}
        onScroll={(e) => {
          const el = e.currentTarget
          const first = el.children[0] as HTMLElement | undefined
          if (first) indexRef.current = Math.round((el.scrollLeft + el.offsetLeft) / (first.offsetWidth + 16))
        }}
      >
        {noticias.map((item) => (
          <NoticiaCard key={item.id} item={item} onPress={() => setModalNoticia(item)} onRegistrate={() => handleRegistrate(item)} />
        ))}
      </div>

      <NoticiaModal noticia={modalNoticia} onClose={() => setModalNoticia(null)} onRegistrate={handleRegistrate} />

      {showLogin && (
        <Modal
          title="Registro"
          description="Debés estar logueado para registrarte en este evento"
          type="warning"
          onClose={{ label: 'Cancelar', action: () => setShowLogin(false) }}
          onConfirm={{
            label: 'Iniciar sesión',
            action: () => {
              setShowLogin(false)
              navigate('/login')
            },
          }}
        />
      )}

      {registerNoticia && (
        <RegistroEventoModal
          noticia={registerNoticia}
          onClose={() => {
            setRegisterNoticia(null)
            refrescarNoLeidas()
          }}
        />
      )}
    </div>
  )
}

function NoticiaCard({ item, onPress, onRegistrate }: { item: Noticia; onPress: () => void; onRegistrate: () => void }) {
  return (
    <div className="relative w-[calc(100vw-64px)] max-w-md shrink-0 snap-center overflow-hidden rounded-2xl border border-zinc-700/50 bg-zinc-800">
      <button type="button" onClick={onPress} className="block w-full text-left">
        <div className="aspect-[4/3] w-full bg-zinc-700/60">
          {item.image && <img src={item.image} alt={item.titulo} className="h-full w-full object-cover" loading="lazy" />}
        </div>
      </button>
      {item.link && (
        <button
          type="button"
          onClick={onRegistrate}
          className="absolute bottom-3 right-3 flex items-center gap-2 rounded-xl bg-green-600/90 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
        >
          <CalendarPlus size={14} />
          Registrate
        </button>
      )}
    </div>
  )
}

function NoticiaModal({ noticia, onClose, onRegistrate }: { noticia: Noticia | null; onClose: () => void; onRegistrate: (n: Noticia) => void }) {
  const [evento, setEvento] = useState<EventoInfo | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!noticia?.link || !noticia.evento_id) return
    setEvento(null)
    setError(null)
    setCargando(true)
    fetchEventoPorId(noticia.evento_id)
      .then((res) => {
        if (res.code === 200 && res.result) setEvento(res.result as EventoInfo)
        else setError(res.msj || 'No se encontró el evento')
      })
      .catch(() => setError('Error al obtener el evento'))
      .finally(() => setCargando(false))
  }, [noticia])

  if (!noticia) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={onClose}>
      <div
        className="animate-fade-in max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700/50 bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {noticia.image && <img src={noticia.image} alt={noticia.titulo} className="h-32 w-full object-cover" />}
        <div className="px-5 pb-6 pt-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h3 className="flex-1 text-2xl font-bold text-white">{noticia.titulo}</h3>
            <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-zinc-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <p className="whitespace-pre-line text-base leading-relaxed text-zinc-300">{noticia.cuerpo}</p>

          {noticia.link && (
            <div className="mt-5">
              {cargando && <p className="text-sm text-zinc-400">Cargando evento...</p>}
              {error && <p className="text-sm text-red-400">{error}</p>}
              {evento && (
                <>
                  <div className="flex flex-col gap-2 rounded-xl bg-zinc-800 p-4">
                    <InfoRow icon={CalendarDays} color="text-amber-500" label="Fecha" value={formatFecha(evento.fecha_evento)} />
                    {evento.hora_evento && <InfoRow icon={Clock} color="text-green-500" label="Hora" value={evento.hora_evento.slice(0, 5)} />}
                    {(evento.edad_min || evento.edad_max) && (
                      <InfoRow icon={User} color="text-blue-500" label="Edad" value={`${evento.edad_min ?? '?'} – ${evento.edad_max ?? '?'} años`} />
                    )}
                    <InfoRow
                      icon={Tag}
                      color="text-purple-400"
                      label="Precio"
                      value={!evento.precio_evento ? 'GRATIS' : `$${evento.precio_evento} ARS`}
                    />
                  </div>
                  <Button variant="purple" className="mt-4 w-full" onClick={() => onRegistrate(noticia)}>
                    <CalendarPlus size={16} />
                    Quiero ir
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, color, label, value }: { icon: typeof CalendarDays; color: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <Icon size={14} className={color} />
      <span className="text-zinc-300">
        {label}: <span className="font-semibold text-white">{value}</span>
      </span>
    </div>
  )
}

function formatFecha(fecha: string) {
  try {
    return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return fecha
  }
}

function RegistroEventoModal({ noticia, onClose }: { noticia: Noticia; onClose: () => void }) {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [evento, setEvento] = useState<EventoInfo | null>(null)
  const [pagos, setPagos] = useState<PagoConfig[]>([])
  const [yaInscripto, setYaInscripto] = useState(false)
  const [nombre, setNombre] = useState(usuario?.nombre ?? '')
  const [apellido, setApellido] = useState(usuario?.apellido ?? '')
  const [acompanantes, setAcompanantes] = useState<Acompanante[]>([])
  const [tipoPago, setTipoPago] = useState<'efectivo' | 'transferencia' | null>(null)
  const [comprobante, setComprobante] = useState<string | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
  const [copiado, setCopiado] = useState<string | null>(null)

  const precio = Number(evento?.precio_evento ?? 0)
  const total = (1 + acompanantes.length) * precio

  useEffect(() => {
    if (!noticia.evento_id) return
    let cancelled = false
    ;(async () => {
      const res = await fetchEventoPorId(noticia.evento_id!)
      if (cancelled) return
      if (res.code === 200 && res.result) {
        const ev = res.result as EventoInfo
        setEvento(ev)
        if (usuario) {
          const check = await verificarInscripcion(ev.id, usuario.id)
          if (!cancelled && check.code === 200 && check.result?.inscripto) setYaInscripto(true)
        }
        if (Number(ev.precio_evento) > 0) {
          const pagosRes = await getAllPagosConfig()
          if (!cancelled) setPagos((pagosRes.result ?? []).filter((p: PagoConfig) => p.activo !== false))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [noticia.evento_id, usuario])

  const agregarAcompanante = () => setAcompanantes((prev) => [...prev, { nombre: '', apellido: '' }])
  const quitarAcompanante = (i: number) => setAcompanantes((prev) => prev.filter((_, idx) => idx !== i))
  const actualizarAcompanante = (i: number, campo: keyof Acompanante, value: string) =>
    setAcompanantes((prev) => prev.map((a, idx) => (idx === i ? { ...a, [campo]: value } : a)))

  const copiar = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiado(key)
      setTimeout(() => setCopiado(null), 1800)
    } catch {
      /* noop */
    }
  }

  const subirComprobante = async (file?: File) => {
    if (!file) return
    setSubiendo(true)
    const res = await uploadToCloudinary(file)
    setSubiendo(false)
    if (res.code === 200 && res.result) setComprobante(res.result)
    else setError(res.msj || 'Error al subir el comprobante')
  }

  const enviar = async () => {
    if (!usuario || !evento) return
    if (!nombre.trim() || !apellido.trim()) {
      setError('Completá nombre y apellido')
      return
    }
    if (precio > 0 && !yaInscripto && !tipoPago) {
      setError('Seleccioná un método de pago')
      return
    }
    setError(null)
    setEnviando(true)
    try {
      let registrationId: number | undefined
      if (!yaInscripto) {
        const reg = await registrarEnEvento(evento.id, usuario.id, acompanantes, tipoPago ?? undefined)
        if (reg.code !== 200) {
          setError(reg.msj || 'Error al registrar')
          return
        }
        registrationId = reg.result?.registration_id
        if (tipoPago === 'transferencia' && comprobante && registrationId) {
          await insertComprobante(usuario.id, evento.id, registrationId, comprobante, total)
        }
      }
      const ticket = await generarTicket(evento.id, usuario.id, acompanantes)
      if (ticket.code !== 200 && !ticket.result) {
        setError(`Error al generar ticket: ${ticket.msj || 'Error desconocido'}. Podés reintentar desde "Mis Eventos".`)
        return
      }
      setOk(true)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-zinc-700/50 bg-zinc-900 p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Registro al evento</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-zinc-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {ok ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 size={48} className="text-green-500" />
            <p className="mt-4 text-lg font-semibold text-white">Te registraste exitosamente</p>
            <div className="mt-6 flex w-full gap-3">
              <Button variant="purple" className="flex-1" onClick={() => { onClose(); navigate('/events-register') }}>
                Ver mi entrada
              </Button>
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : yaInscripto ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 size={48} className="text-green-500" />
            <p className="mt-4 text-lg font-bold text-white">Ya estás registrado</p>
            <p className="mt-1 text-sm text-zinc-400">Podés ver tu entrada en Mis Eventos</p>
            <div className="mt-6 flex w-full gap-3">
              <Button variant="purple" className="flex-1" onClick={() => { onClose(); navigate('/events-register') }}>
                Ver mi entrada
              </Button>
              <Button variant="ghost" className="flex-1" onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Nombre" value={nombre} onChange={setNombre} placeholder="Tu nombre" />
            <Input label="Apellido" value={apellido} onChange={setApellido} placeholder="Tu apellido" />

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold text-zinc-400">Acompañantes</span>
                <button type="button" onClick={agregarAcompanante} className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-sm text-white hover:bg-zinc-700">
                  <Plus size={14} /> Agregar
                </button>
              </div>
              {acompanantes.length === 0 && <p className="text-sm italic text-zinc-500">Sin acompañantes</p>}
              {acompanantes.map((a, i) => (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <input
                    value={a.nombre}
                    onChange={(e) => actualizarAcompanante(i, 'nombre', e.target.value)}
                    placeholder="Nombre"
                    className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-transparent px-3 py-2 text-white outline-none placeholder:text-zinc-600"
                  />
                  <input
                    value={a.apellido}
                    onChange={(e) => actualizarAcompanante(i, 'apellido', e.target.value)}
                    placeholder="Apellido"
                    className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-transparent px-3 py-2 text-white outline-none placeholder:text-zinc-600"
                  />
                  <button type="button" onClick={() => quitarAcompanante(i)} aria-label="Quitar" className="text-red-400 hover:text-red-300">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {precio > 0 && (
              <div>
                <p className="mb-3 text-center text-sm text-zinc-400">
                  El evento tiene un costo de <span className="font-bold text-white">${precio} ARS</span>
                  {acompanantes.length > 0 && <> · Total: <span className="font-bold text-white">${total} ARS</span></>}
                </p>
                <div className="mb-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setTipoPago('efectivo')}
                    className={`flex-1 rounded-xl border-2 py-4 text-center font-bold ${tipoPago === 'efectivo' ? 'border-green-500 bg-green-600/20 text-green-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}
                  >
                    Presencial
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoPago('transferencia')}
                    className={`flex-1 rounded-xl border-2 py-4 text-center font-bold ${tipoPago === 'transferencia' ? 'border-blue-500 bg-blue-600/20 text-blue-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}
                  >
                    Transferencia
                  </button>
                </div>

                {tipoPago === 'transferencia' && (
                  <div>
                    <p className="mb-2 text-center text-xs text-zinc-400">Tocá el alias o CBU para copiarlo</p>
                    <div className="max-h-56 space-y-2 overflow-y-auto">
                      {pagos.length === 0 && <p className="text-center text-zinc-500">No hay datos de pago disponibles</p>}
                      {pagos.map((p) => (
                        <div key={p.id} className="rounded-xl bg-zinc-800 p-3">
                          <p className="text-sm font-bold text-white">{p.nombre} {p.apellido}</p>
                          <button type="button" onClick={() => copiar(`alias${p.id}`, p.alias ?? '')} className="mt-1.5 flex items-center gap-2 text-xs">
                            <Copy size={11} className={copiado === `alias${p.id}` ? 'text-green-500' : 'text-purple-400'} />
                            <span className={copiado === `alias${p.id}` ? 'text-green-400' : 'text-purple-400'}>
                              {copiado === `alias${p.id}` ? '¡Alias copiado!' : `Alias: ${p.alias || '—'}`}
                            </span>
                          </button>
                          <button type="button" onClick={() => copiar(`cbu${p.id}`, p.cbu ?? '')} className="mt-0.5 flex items-center gap-2 text-xs">
                            <Copy size={11} className={copiado === `cbu${p.id}` ? 'text-green-500' : 'text-purple-400'} />
                            <span className={copiado === `cbu${p.id}` ? 'text-green-400' : 'text-purple-400'}>
                              {copiado === `cbu${p.id}` ? '¡CBU copiado!' : `CBU: ${p.cbu || '—'}`}
                            </span>
                          </button>
                          <p className="mt-0.5 text-xs text-zinc-500">Banco: {p.banco || '—'}</p>
                        </div>
                      ))}
                    </div>

                    <label className="mt-3 block cursor-pointer rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-center text-sm text-zinc-400 hover:border-zinc-500">
                      {subiendo ? 'Subiendo comprobante...' : comprobante ? 'Comprobante cargado ✓' : 'Subir comprobante'}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => subirComprobante(e.target.files?.[0])} />
                    </label>
                  </div>
                )}
                {tipoPago === 'efectivo' && <p className="text-center text-sm text-green-400">Vas a pagar en efectivo al llegar al evento</p>}
              </div>
            )}

            {error && <div className="rounded-xl border border-red-900/50 bg-red-900/30 px-4 py-3 text-sm text-red-400">{error}</div>}

            <Button variant="purple" className="w-full" loading={enviando} onClick={enviar}>
              {enviando ? 'Enviando...' : 'Confirmar registro'}
            </Button>
          </div>
        )}

        {enviando && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Spinner size={30} />
          </div>
        )}
      </div>
    </div>
  )
}
