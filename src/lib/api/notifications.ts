import { getSupabase } from '../supabase'

export type NotificacionRow = {
  id: number
  titulo: string
  cuerpo: string
  tipo: string
  created_at: string
  leida: boolean
}

export async function fetchNotificaciones(usuarioId: string): Promise<NotificacionRow[]> {
  const { data, error } = await getSupabase().rpc('obtener_notificaciones_usuario', {
    p_usuario_id: usuarioId,
  })
  if (error) {
    console.error('[notificaciones] error:', error.message)
    return []
  }
  return (data ?? []) as NotificacionRow[]
}

export async function marcarNotificacionLeida(notificacionId: number, usuarioId: string) {
  const { error } = await getSupabase().rpc('marcar_notificacion_leida', {
    p_notificacion_id: notificacionId,
    p_usuario_id: usuarioId,
  })
  if (error) console.error('[notificaciones] marcar leída:', error.message)
}

export async function eliminarNotificacionUsuario(notificacionId: number, usuarioId: string) {
  const { error } = await getSupabase().rpc('eliminar_notificacion_usuario', {
    p_notificacion_id: notificacionId,
    p_usuario_id: usuarioId,
  })
  if (error) console.error('[notificaciones] eliminar:', error.message)
}

export async function notificacionesNoLeidas(usuarioId: string): Promise<number> {
  const { data, error } = await getSupabase().rpc('notificaciones_no_leidas', {
    p_usuario_id: usuarioId,
  })
  if (error) {
    console.error('[notificaciones] no leídas:', error.message)
    return 0
  }
  return (data as number) ?? 0
}
