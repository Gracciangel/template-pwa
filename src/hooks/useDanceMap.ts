import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchAllCronogramas } from '../lib/api'
import { getSupabase } from '../lib/supabase'
import type { CronogramaEntry } from '../lib/types'
import { parseCanciones } from '../lib/cronograma'

const Y_ESCENARIO = 12

export type PositionUser = {
  user_id: string
  x: number
  y: number
  nombre: string
  apellido?: string
  avatar_url?: string | null
  color?: string
}

export type DanzanteInfo = {
  id: string
  nombre: string
  apellido: string
  avatar_url: string | null
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val))
}

export function useDanceMap(ministerioId: number, usuarioId: string | undefined) {
  const [cronogramas, setCronogramas] = useState<CronogramaEntry[]>([])
  const [cronogramaSel, setCronogramaSel] = useState<CronogramaEntry | null>(null)
  const [cancionActual, setCancionActual] = useState<string | null>(null)
  const [positions, setPositions] = useState<PositionUser[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState<PositionUser | null>(null)
  const [modoMover, setModoMover] = useState<string | null>(null)
  const [modalAgregar, setModalAgregar] = useState(false)
  const [disponibles, setDisponibles] = useState<DanzanteInfo[]>([])
  const [modalConfirmar, setModalConfirmar] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [alertaPocos, setAlertaPocos] = useState(false)

  const mapSizeRef = useRef({ w: 0, h: 0 })

  const cancionesLista = useMemo(
    () => (cronogramaSel ? parseCanciones(cronogramaSel.contenido) : []),
    [cronogramaSel],
  )

  useEffect(() => {
    if (!usuarioId) return
    fetchAllCronogramas().then((res) => {
      if (res.code === 200 && res.result) setCronogramas(res.result)
    })
  }, [usuarioId])

  const fetchPositions = useCallback(
    async (cronogramaId: number, cancionTitulo: string) => {
      setLoading(true)
      try {
        const { data: posData } = await getSupabase()
          .from('posiciones')
          .select('user_id, x, y')
          .eq('ministerio_id', ministerioId)
          .eq('cronograma_id', cronogramaId)
          .eq('cancion_titulo', cancionTitulo)

        if (!posData || posData.length === 0) {
          setPositions([])
          return
        }

        const userIds = [...new Set(posData.map((p: { user_id: string }) => p.user_id))]
        const { data: allUsers } = await getSupabase().rpc('get_all_usuarios')
        const userMap = new Map(
          ((allUsers as Record<string, unknown>[]) || [])
            .filter((u) => userIds.includes(u.id as string))
            .map((u) => [u.id as string, u]),
        )

        setPositions(
          posData.map((p: { user_id: string; x: number; y: number }) => {
            const u = (userMap.get(p.user_id) ?? {}) as Record<string, string | null>
            return {
              user_id: p.user_id,
              x: Number(p.x),
              y: Number(p.y),
              nombre: (u.nombre as string) ?? '',
              apellido: (u.apellido as string) ?? '',
              avatar_url: (u.avatar_url as string) ?? null,
            }
          }),
        )
      } catch (error) {
        console.error('Error al cargar posiciones:', error)
      } finally {
        setLoading(false)
      }
    },
    [ministerioId],
  )

  const seleccionarCancion = useCallback(
    (cancion: string) => {
      if (!cronogramaSel) return
      setCancionActual(cancion)
      void fetchPositions(cronogramaSel.id, cancion)
    },
    [cronogramaSel, fetchPositions],
  )

  const volverALista = useCallback(() => {
    setCancionActual(null)
    setPositions([])
  }, [])

  const fetchDisponibles = useCallback(async () => {
    try {
      const idsEnMapa = new Set(positions.map((p) => p.user_id))
      const [{ data: allUms }, { data: allUsers }] = await Promise.all([
        getSupabase().rpc('get_all_usuario_ministerios'),
        getSupabase().rpc('get_all_usuarios'),
      ])
      const userIdsDanza = new Set(
        ((allUms as Record<string, unknown>[]) || [])
          .filter((u) => Number(u.ministerio_id) === ministerioId)
          .map((u) => u.usuario_id as string),
      )
      setDisponibles(
        ((allUsers as Record<string, unknown>[]) || [])
          .filter((u) => userIdsDanza.has(u.id as string) && !idsEnMapa.has(u.id as string))
          .map((u) => ({
            id: u.id as string,
            nombre: (u.nombre as string) ?? '',
            apellido: (u.apellido as string) ?? '',
            avatar_url: (u.avatar_url as string) || null,
          })),
      )
    } catch {
      setDisponibles([])
    }
  }, [positions, ministerioId])

  const handleAgregarUsuario = useCallback(
    async (item: DanzanteInfo) => {
      if (!cronogramaSel || !cancionActual) return
      setModalAgregar(false)
      const nuevaPos: PositionUser = {
        user_id: item.id,
        x: 30 + Math.round(Math.random() * 40),
        y: 40 + Math.round(Math.random() * 30),
        nombre: item.nombre,
        apellido: item.apellido,
        avatar_url: item.avatar_url,
      }
      setPositions((prev) => [...prev, nuevaPos])
      try {
        await getSupabase().from('posiciones').insert({
          user_id: item.id,
          x: nuevaPos.x,
          y: nuevaPos.y,
          ministerio_id: ministerioId,
          cronograma_id: cronogramaSel.id,
          cancion_titulo: cancionActual,
        })
      } catch {
        setPositions((prev) => prev.filter((p) => p.user_id !== item.id))
      }
    },
    [cronogramaSel, cancionActual, ministerioId],
  )

  const handleMovePin = useCallback((userId: string) => {
    setSelectedUser(null)
    setModoMover(userId)
  }, [])

  const handleMapPress = useCallback(
    (xPct: number, yPct: number) => {
      if (!modoMover || !cronogramaSel || !cancionActual) return
      const x = clamp(Math.round(xPct), 2, 98)
      const y = clamp(Math.round(yPct), Y_ESCENARIO + 5, 95)
      setPositions((prev) => prev.map((p) => (p.user_id === modoMover ? { ...p, x, y } : p)))
      void getSupabase()
        .from('posiciones')
        .update({ x, y })
        .eq('user_id', modoMover)
        .eq('ministerio_id', ministerioId)
        .eq('cronograma_id', cronogramaSel.id)
        .eq('cancion_titulo', cancionActual)
      setModoMover(null)
    },
    [modoMover, cronogramaSel, cancionActual, ministerioId],
  )

  const handleRemovePin = useCallback(
    async (userId: string) => {
      if (!cronogramaSel || !cancionActual) return
      setPositions((prev) => prev.filter((p) => p.user_id !== userId))
      setSelectedUser(null)
      try {
        await getSupabase()
          .from('posiciones')
          .delete()
          .eq('user_id', userId)
          .eq('ministerio_id', ministerioId)
          .eq('cronograma_id', cronogramaSel.id)
          .eq('cancion_titulo', cancionActual)
      } catch {
        /* la posición ya se quitó de la vista */
      }
    },
    [cronogramaSel, cancionActual, ministerioId],
  )

  const handleFinalizar = useCallback(async () => {
    if (!cronogramaSel || !cancionActual) return
    if (positions.length < 2) {
      setAlertaPocos(true)
      return
    }
    setConfirmando(true)
    const userIds = positions.map((p) => p.user_id)
    const fechaFormateada = new Date(`${cronogramaSel.fecha_evento}T00:00:00`).toLocaleDateString(
      'es-ES',
      { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
    )
    await getSupabase().rpc('enviar_push_notificacion', {
      p_titulo: 'Posición asignada',
      p_cuerpo: `Has sido posicionado para "${cancionActual}" el ${fechaFormateada}`,
      p_tipo: 'mapa',
      p_datos: { screen: '/notificaciones' },
      p_usuario_ids: userIds,
    })
    setConfirmando(false)
    setModalConfirmar(false)
    setPositions([])
    setCancionActual(null)
  }, [cronogramaSel, cancionActual, positions])

  return {
    cronogramas,
    cronogramaSel,
    setCronogramaSel,
    cancionActual,
    positions,
    loading,
    selectedUser,
    setSelectedUser,
    modoMover,
    modalAgregar,
    setModalAgregar,
    disponibles,
    modalConfirmar,
    setModalConfirmar,
    confirmando,
    alertaPocos,
    setAlertaPocos,
    cancionesLista,
    mapSizeRef,
    seleccionarCancion,
    volverALista,
    fetchDisponibles,
    handleAgregarUsuario,
    handleMovePin,
    handleMapPress,
    handleRemovePin,
    handleFinalizar,
  }
}
