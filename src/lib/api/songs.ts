import type { IResponse, ICancion, PaginationParams } from '../types'
import { getSupabase, handleError, buildRange } from '../supabase'

export const crearCancion = async (
  ministerioId: number,
  titulo: string,
  autor: string,
  tonoOriginal: string,
  contenido: string,
  usuarioId: string,
): Promise<IResponse> => {
  try {
    const { error } = await getSupabase().rpc('crear_cancion', {
      p_ministerio_id: ministerioId,
      p_titulo: titulo,
      p_autor: autor,
      p_tono_original: tonoOriginal,
      p_contenido: contenido,
      p_usuario_id: usuarioId,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Canción creada', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}

export const actualizarCancion = async (
  cancionId: number,
  titulo: string,
  autor: string,
  tonoOriginal: string,
  contenido: string,
  usuarioId: string,
): Promise<IResponse> => {
  try {
    const { error } = await getSupabase().rpc('actualizar_cancion', {
      p_cancion_id: cancionId,
      p_titulo: titulo,
      p_autor: autor,
      p_tono_original: tonoOriginal,
      p_contenido: contenido,
      p_usuario_id: usuarioId,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Canción actualizada', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}

export const eliminarCancion = async (cancionId: number, usuarioId: string): Promise<IResponse> => {
  try {
    const { error } = await getSupabase().rpc('eliminar_cancion', {
      p_cancion_id: cancionId,
      p_usuario_id: usuarioId,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Canción eliminada', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}

export const fetchCancion = async (
  cancionId: number,
  usuarioId: string,
): Promise<IResponse<ICancion>> => {
  try {
    const { data, error } = await getSupabase().rpc('get_cancion', {
      p_cancion_id: cancionId,
      p_usuario_id: usuarioId,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Canción obtenida con éxito', title: 'OK', result: data as ICancion }
  } catch (error) {
    return handleError(error)
  }
}

export const fetchCanciones = async (
  ministerioId: number,
  usuarioId: string,
  params?: PaginationParams,
): Promise<IResponse<ICancion[]>> => {
  try {
    const { limit, offset } = buildRange(params)
    const { data, error } = await getSupabase().rpc('get_canciones', {
      p_ministerio_id: ministerioId,
      p_usuario_id: usuarioId,
      p_limit: limit,
      p_offset: offset,
    })
    if (error) {
      const { data: fallback, error: fbError } = await getSupabase().rpc('get_canciones', {
        p_ministerio_id: ministerioId,
        p_usuario_id: usuarioId,
      })
      if (fbError) return { code: 500, msj: fbError.message, title: 'Error' }
      return { code: 200, msj: 'Canciones obtenidas con éxito', title: 'OK', result: fallback as ICancion[] }
    }
    return { code: 200, msj: 'Canciones obtenidas con éxito', title: 'OK', result: data as ICancion[] }
  } catch (error) {
    return handleError(error)
  }
}
