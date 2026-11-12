import type { IResponse, PaginationParams, CronogramaEntry } from '../types'
import { getSupabase, handleError, buildRange } from '../supabase'

export const crearCronograma = async (
  ministerioId: number,
  informante: string,
  fechaEvento: string,
  contenido: string,
): Promise<IResponse> => {
  try {
    const { error } = await getSupabase().rpc('crear_cronograma', {
      p_ministerio_id: ministerioId,
      p_informante: informante,
      p_fecha_evento: fechaEvento,
      p_nombre_evento: '',
      p_contenido: contenido,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Cronograma creado', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}

export const fetchAllCronogramas = async (
  params?: PaginationParams,
): Promise<IResponse<CronogramaEntry[]>> => {
  try {
    const { limit, offset } = buildRange(params)
    const { data, error } = await getSupabase().rpc('get_all_cronogramas', {
      p_limit: limit,
      p_offset: offset,
    })
    if (error) {
      const { data: fallback, error: fbError } = await getSupabase().rpc('get_all_cronogramas')
      if (fbError) return { code: 500, msj: fbError.message, title: 'Error' }
      return { code: 200, msj: 'Cronogramas obtenidos', title: 'OK', result: fallback as CronogramaEntry[] }
    }
    return { code: 200, msj: 'Cronogramas obtenidos', title: 'OK', result: data as CronogramaEntry[] }
  } catch (error) {
    return handleError(error)
  }
}

export const fetchCronogramas = async (
  ministerioId: number,
  params?: PaginationParams,
): Promise<IResponse<CronogramaEntry[]>> => {
  try {
    const { limit, offset } = buildRange(params)
    const { data, error } = await getSupabase().rpc('get_cronogramas', {
      p_ministerio_id: ministerioId,
      p_limit: limit,
      p_offset: offset,
    })
    if (error) {
      const { data: fallback, error: fbError } = await getSupabase().rpc('get_cronogramas', {
        p_ministerio_id: ministerioId,
      })
      if (fbError) return { code: 500, msj: fbError.message, title: 'Error' }
      return { code: 200, msj: 'Cronogramas obtenidos', title: 'OK', result: fallback as CronogramaEntry[] }
    }
    return { code: 200, msj: 'Cronogramas obtenidos', title: 'OK', result: data as CronogramaEntry[] }
  } catch (error) {
    return handleError(error)
  }
}

export const actualizarCronograma = async (
  cronogramaId: number,
  informante: string,
  fechaEvento: string,
  contenido: string,
): Promise<IResponse> => {
  try {
    const { error } = await getSupabase()
      .from('cronograma')
      .update({ informante, fecha_evento: fechaEvento, contenido })
      .eq('id', cronogramaId)
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Cronograma actualizado', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}

export const eliminarCronograma = async (cronogramaId: number): Promise<IResponse> => {
  try {
    const { error } = await getSupabase().from('cronograma').delete().eq('id', cronogramaId)
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Cronograma eliminado', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}

export const eliminarCronogramaGrupo = async (cronogramaId: number): Promise<IResponse> => {
  try {
    const { error } = await getSupabase().rpc('eliminar_cronograma_grupo', { p_id: cronogramaId })
    if (!error) return { code: 200, msj: 'Cronograma eliminado', title: 'OK' }
    const { error: delError } = await getSupabase().from('cronograma').delete().eq('id', cronogramaId)
    if (delError) return { code: 500, msj: delError.message, title: 'Error' }
    return { code: 200, msj: 'Cronograma eliminado', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}

export const fetchCronogramasByGrupo = async (
  grupoId: number,
): Promise<IResponse<CronogramaEntry[]>> => {
  try {
    const { data, error } = await getSupabase().rpc('get_cronogramas_grupo', { p_grupo_id: grupoId })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Cronogramas obtenidos', title: 'OK', result: data as CronogramaEntry[] }
  } catch (error) {
    return handleError(error)
  }
}

export const crearCronogramaGrupo = async (
  grupoId: number,
  informante: string,
  fechaEvento: string,
  contenido: string,
  reemplazar = false,
): Promise<IResponse<{ existe?: boolean; cronograma?: CronogramaEntry }>> => {
  try {
    const { data, error } = await getSupabase().rpc('crear_cronograma_grupo', {
      p_grupo_id: grupoId,
      p_informante: informante,
      p_fecha_evento: fechaEvento,
      p_contenido: contenido,
      p_reemplazar: reemplazar,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    if (data?.existe) return { code: 409, msj: 'Ya existe', title: 'Conflicto', result: data }
    return { code: 200, msj: 'Cronograma guardado', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}
