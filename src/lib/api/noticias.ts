import type { IResponse, PaginationParams } from '../types'
import { getSupabase, handleError, buildRange } from '../supabase'

export const fetchNoticias = async (params?: PaginationParams): Promise<IResponse<any[]>> => {
  try {
    const { limit, offset } = buildRange(params)
    const { data, error } = await getSupabase()
      .from('noticias')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Noticias obtenidas con éxito', title: 'OK', result: data ?? [] }
  } catch (error) {
    return handleError(error)
  }
}
