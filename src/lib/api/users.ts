import type { IResponse, IUser, IEntidadesUsuario } from '../types'
import { getSupabase, handleError } from '../supabase'

export const fetchUsuario = async (userId: string): Promise<IResponse<IUser>> => {
  try {
    const { data, error } = await getSupabase()
      .from('usuarios')
      .select('id, nombre, apellido, nombre_usuario, email, role_id, avatar_url')
      .eq('id', userId)
      .maybeSingle()
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    if (!data) return { code: 500, msj: 'Usuario no encontrado', title: 'Error' }
    return { code: 200, msj: 'Usuario obtenido con éxito', title: 'OK', result: data as IUser }
  } catch (error) {
    return handleError(error)
  }
}

export const fetchMinisteriosYGrupos = async (
  userId: string,
): Promise<IResponse<IEntidadesUsuario>> => {
  try {
    const { data, error } = await getSupabase().rpc('obtener_entidades_usuario', {
      p_usuario_id: userId,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return {
      code: 200,
      msj: 'Ministerios y grupos obtenidos con éxito',
      title: 'OK',
      result: data as IEntidadesUsuario,
    }
  } catch (error) {
    return handleError(error)
  }
}
