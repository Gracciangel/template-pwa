import type { IResponse } from '../types'
import { getSupabase, handleError } from '../supabase'

export const generarTicket = async (
  eventoId: number,
  usuarioId: string,
  acompanantes: { nombre: string; apellido: string }[],
): Promise<IResponse<any>> => {
  try {
    const { data, error } = await getSupabase().rpc('generar_ticket', {
      p_evento_id: eventoId,
      p_usuario_id: usuarioId,
      p_acompanantes: acompanantes,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Ticket generado', title: 'OK', result: data }
  } catch (error) {
    return handleError(error)
  }
}

export const validarTicket = async (ticketId: string): Promise<IResponse<any>> => {
  try {
    const { data, error } = await getSupabase().rpc('validar_ticket', { p_ticket_id: ticketId })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Ticket validado', title: 'OK', result: data }
  } catch (error) {
    return handleError(error)
  }
}

export const usarTicket = async (ticketId: string): Promise<IResponse<any>> => {
  try {
    const { data, error } = await getSupabase().rpc('usar_ticket', { p_ticket_id: ticketId })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Ticket usado', title: 'OK', result: data }
  } catch (error) {
    return handleError(error)
  }
}

export const ticketsDelUsuario = async (usuarioId: string): Promise<IResponse<any[]>> => {
  try {
    const { data, error } = await getSupabase().rpc('tickets_del_usuario', { p_usuario_id: usuarioId })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Tickets obtenidos', title: 'OK', result: data ?? [] }
  } catch (error) {
    return handleError(error)
  }
}

export const registrosDelUsuario = async (usuarioId: string): Promise<IResponse<any[]>> => {
  try {
    const { data, error } = await getSupabase().rpc('registros_del_usuario', { p_usuario_id: usuarioId })
    if (error) {
      if (error.message?.includes('function') && error.message?.includes('not found')) {
        const { data: fallback, error: fbError } = await getSupabase()
          .from('event_register')
          .select('id, evento_id, created_at, partners')
          .eq('usuario_id', usuarioId)
          .order('created_at', { ascending: false })
        if (fbError) return { code: 500, msj: fbError.message, title: 'Error' }
        return { code: 200, msj: 'Registros obtenidos', title: 'OK', result: fallback ?? [] }
      }
      return { code: 500, msj: error.message, title: 'Error' }
    }
    return { code: 200, msj: 'Registros obtenidos', title: 'OK', result: data ?? [] }
  } catch (error) {
    return handleError(error)
  }
}

export const regenerarTicket = async (
  eventoId: number,
  usuarioId: string,
  acompanantes: { nombre: string; apellido: string }[] = [],
): Promise<IResponse<any>> => {
  return generarTicket(eventoId, usuarioId, acompanantes)
}

export const verificarInscripcion = async (
  eventoId: number,
  usuarioId: string,
): Promise<IResponse<{ inscripto: boolean; ticket_id?: string }>> => {
  try {
    const { data, error } = await getSupabase().rpc('verificar_inscripcion', {
      p_evento_id: eventoId,
      p_usuario_id: usuarioId,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Verificado', title: 'OK', result: data }
  } catch (error) {
    return handleError(error)
  }
}
