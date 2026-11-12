import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { IUser, IMinisterio, IGrupo } from '../lib/types'
import { fetchUsuario, fetchMinisteriosYGrupos, notificacionesNoLeidas } from '../lib/api'

type AuthContextValue = {
  usuario: IUser | null
  session: Session | null
  cargando: boolean
  ministerios: IMinisterio[]
  grupos: IGrupo[]
  esLider: boolean
  noLeidas: number
  refrescarUsuario: () => Promise<void>
  refrescarEntidades: () => Promise<void>
  refrescarNoLeidas: () => Promise<void>
  cerrarSesion: () => Promise<void>
  actualizarAvatar: (url: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function ensureUsuario(session: Session): Promise<IUser | null> {
  const { data } = await supabase
    .from('usuarios')
    .select('id, nombre, apellido, nombre_usuario, email, role_id, avatar_url')
    .eq('id', session.user.id)
    .maybeSingle()

  if (data) return data as IUser

  const identities = session.user.identities ?? []
  const isGoogle = identities.some((i) => i.provider === 'google')
  if (isGoogle) return null

  const meta = session.user.user_metadata ?? {}
  const email = session.user.email ?? ''
  const nombre = meta.nombre ?? meta.name ?? meta.full_name ?? email.split('@')[0] ?? 'Usuario'
  const apellido = meta.apellido ?? meta.family_name ?? ''
  const nombre_usuario = String(meta.nombre_usuario ?? meta.name ?? email.split('@')[0] ?? 'user')
    .toLowerCase()
    .replace(/\s+/g, '_')

  const { error } = await supabase.from('usuarios').insert({
    id: session.user.id,
    email,
    nombre,
    apellido,
    nombre_usuario,
    role_id: 2,
    avatar_url: meta.avatar_url ?? meta.picture ?? null,
  })
  if (error) return null

  const { data: created } = await supabase
    .from('usuarios')
    .select('id, nombre, apellido, nombre_usuario, email, role_id, avatar_url')
    .eq('id', session.user.id)
    .maybeSingle()

  return (created as IUser) ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<IUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [cargando, setCargando] = useState(true)
  const [ministerios, setMinisterios] = useState<IMinisterio[]>([])
  const [grupos, setGrupos] = useState<IGrupo[]>([])
  const [noLeidas, setNoLeidas] = useState(0)
  const lastSignInRef = useRef(0)

  const cargarEntidades = useCallback(async (userId: string) => {
    const [entidades, noLeidasRes] = await Promise.all([
      fetchMinisteriosYGrupos(userId),
      notificacionesNoLeidas(userId),
    ])
    if (entidades.code === 200 && entidades.result) {
      setMinisterios(entidades.result.ministerios ?? [])
      setGrupos(entidades.result.grupos ?? [])
    }
    setNoLeidas(noLeidasRes)
  }, [])

  useEffect(() => {
    let cancelled = false

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      setSession(data.session)
      if (data.session) {
        const u = await ensureUsuario(data.session)
        if (!cancelled && u) {
          setUsuario(u)
          lastSignInRef.current = Date.now()
          void cargarEntidades(u.id)
        }
      }
      if (!cancelled) setCargando(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      setSession(nextSession)
      if (event === 'SIGNED_IN' && nextSession) {
        const u = await ensureUsuario(nextSession)
        if (u) {
          setUsuario(u)
          lastSignInRef.current = Date.now()
          void cargarEntidades(u.id)
        }
        setCargando(false)
      } else if (event === 'SIGNED_OUT') {
        if (Date.now() - lastSignInRef.current < 3000) return
        setUsuario(null)
        setMinisterios([])
        setGrupos([])
        setNoLeidas(0)
      }
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [cargarEntidades])

  const refrescarUsuario = useCallback(async () => {
    if (!usuario) return
    const res = await fetchUsuario(usuario.id)
    if (res.code === 200 && res.result) setUsuario(res.result)
  }, [usuario])

  const refrescarEntidades = useCallback(async () => {
    if (!usuario) return
    await cargarEntidades(usuario.id)
  }, [usuario, cargarEntidades])

  const refrescarNoLeidas = useCallback(async () => {
    if (!usuario) return
    setNoLeidas(await notificacionesNoLeidas(usuario.id))
  }, [usuario])

  const cerrarSesion = useCallback(async () => {
    await supabase.auth.signOut()
    setUsuario(null)
    setMinisterios([])
    setGrupos([])
    setNoLeidas(0)
  }, [])

  const actualizarAvatar = useCallback(
    async (url: string) => {
      if (!usuario) return
      setUsuario({ ...usuario, avatar_url: url })
    },
    [usuario],
  )

  const esLider = useMemo(() => usuario?.role_id === 1, [usuario])

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      session,
      cargando,
      ministerios,
      grupos,
      esLider,
      noLeidas,
      refrescarUsuario,
      refrescarEntidades,
      refrescarNoLeidas,
      cerrarSesion,
      actualizarAvatar,
    }),
    [
      usuario,
      session,
      cargando,
      ministerios,
      grupos,
      esLider,
      noLeidas,
      refrescarUsuario,
      refrescarEntidades,
      refrescarNoLeidas,
      cerrarSesion,
      actualizarAvatar,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
