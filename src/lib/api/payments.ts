import type { IResponse } from '../types'
import { getSupabase, handleError } from '../supabase'

export const getAllPagosConfig = async (): Promise<IResponse<any[]>> => {
  try {
    const { data, error } = await getSupabase().rpc('get_all_pagos_config')
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Datos obtenidos', title: 'OK', result: data ?? [] }
  } catch (error) {
    return handleError(error)
  }
}

export const insertComprobante = async (
  usuarioId: string,
  eventoId: number,
  registrationId: number,
  imagenUrl: string,
  monto: number,
): Promise<IResponse<any>> => {
  try {
    const { data, error } = await getSupabase().rpc('insert_comprobante', {
      p_usuario_id: usuarioId,
      p_evento_id: eventoId,
      p_registration_id: registrationId,
      p_imagen_url: imagenUrl,
      p_monto: monto,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Comprobante guardado', title: 'OK', result: data }
  } catch (error) {
    return handleError(error)
  }
}
