import type { IResponse, PaginationParams, IEvento } from '../types'
import { getSupabase, handleError, buildRange } from '../supabase'

export const fetchEventoPorId = async (eventoId: number): Promise<IResponse<IEvento>> => {
  if (Number.isNaN(eventoId)) return { code: 400, msj: 'ID de evento inválido', title: 'Error' }
  try {
    const { data, error } = await getSupabase().from('eventos').select('*').eq('id', eventoId).maybeSingle()
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Evento obtenido', title: 'OK', result: data as IEvento }
  } catch (error) {
    return handleError(error)
  }
}

export const fetchEventos = async (params?: PaginationParams): Promise<IResponse<IEvento[]>> => {
  try {
    const { limit, offset } = buildRange(params)
    const { data, error } = await getSupabase()
      .from('eventos')
      .select('*')
      .order('fecha_evento', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Eventos obtenidos', title: 'OK', result: (data ?? []) as IEvento[] }
  } catch (error) {
    return handleError(error)
  }
}

export const agregarParticipante = async (
  eventoId: number,
  nombre: string,
  apellido: string,
  usuarioId?: string,
): Promise<IResponse> => {
  try {
    const { error } = await getSupabase().from('participantes_evento').insert({
      evento_id: eventoId,
      nombre,
      apellido,
      usuario_id: usuarioId ?? null,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Participante agregado', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}

export const fetchParticipantes = async (
  eventoId: number,
  params?: PaginationParams,
): Promise<IResponse<any[]>> => {
  try {
    const { limit, offset } = buildRange(params)
    const { data, error } = await getSupabase()
      .from('participantes_evento')
      .select('*')
      .eq('evento_id', eventoId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Participantes obtenidos', title: 'OK', result: data ?? [] }
  } catch (error) {
    return handleError(error)
  }
}

export const registrarEnEvento = async (
  eventoId: number,
  usuarioId: string,
  partners: { nombre: string; apellido: string }[],
  tipoPago?: string,
): Promise<IResponse<any>> => {
  try {
    const params: Record<string, any> = {
      p_evento_id: eventoId,
      p_usuario_id: usuarioId,
      p_partners: partners,
    }
    if (tipoPago) params.p_tipo_pago = tipoPago
    const { data, error } = await getSupabase().rpc('registrar_en_evento', params)
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Registrado en el evento', title: 'OK', result: data }
  } catch (error) {
    return handleError(error)
  }
}
