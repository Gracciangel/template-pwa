import type { IResponse, MiembroGrupo, CronogramaEntry } from '../types'
import { getSupabase, handleError } from '../supabase'

export const fetchMiembrosGrupo = async (grupoId: number): Promise<IResponse<MiembroGrupo[]>> => {
  try {
    const { data, error } = await getSupabase().rpc('obtener_miembros_grupo', { p_grupo_id: grupoId })
    if (error) {
      const [{ data: allUsers }, { data: allUgs }] = await Promise.all([
        getSupabase().from('usuarios').select('id, nombre, apellido, avatar_url, role_id'),
        getSupabase().from('usuario_grupos').select('usuario_id').eq('grupo_id', grupoId),
      ])
      const ids = new Set((allUgs ?? []).map((u: any) => u.usuario_id))
      const miembros = (allUsers ?? [])
        .filter((u: any) => ids.has(u.id))
        .map((m: any) => ({
          id: m.id,
          nombre: m.nombre,
          apellido: m.apellido,
          avatar_url: m.avatar_url ?? null,
          role_id: m.role_id,
          role: m.role_id === 1 ? 'Líder' : 'Miembro',
        }))
      return { code: 200, msj: 'Miembros obtenidos', title: 'OK', result: miembros }
    }
    return { code: 200, msj: 'Miembros obtenidos', title: 'OK', result: (data ?? []) as MiembroGrupo[] }
  } catch (error) {
    return handleError(error)
  }
}

export const eliminarPosicionesPorCronograma = async (cronogramaId: number): Promise<IResponse> => {
  try {
    const { error } = await getSupabase().from('posiciones').delete().eq('cronograma_id', cronogramaId)
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Posiciones eliminadas', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}

export const fetchMisPredicasGrupo = async (
  grupoId: number,
  usuarioId: string,
): Promise<IResponse<CronogramaEntry[]>> => {
  try {
    const { fetchCronogramasByGrupo } = await import('./cronogramas')
    const res = await fetchCronogramasByGrupo(grupoId)
    if (res.code !== 200) return { code: 500, msj: res.msj, title: 'Error' }
    const filtradas = (res.result ?? []).filter((c) => {
      try {
        const parsed = JSON.parse(c.contenido)
        return Array.isArray(parsed) && parsed.some((s: any) => s.predicador_id === usuarioId)
      } catch {
        return false
      }
    })
    return { code: 200, msj: '', result: filtradas, title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}

export const solicitarReprogramacion = async (
  cronogramaId: number,
  usuarioId: string,
  mensaje: string,
): Promise<IResponse> => {
  try {
    const { data, error } = await getSupabase().rpc('solicitar_reprogramacion', {
      p_cronograma_id: cronogramaId,
      p_usuario_id: usuarioId,
      p_mensaje: mensaje,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    const res = data as any
    if (res && res.success === false) return { code: 400, msj: res.error || 'No se pudo solicitar', title: 'Error' }
    return { code: 200, msj: 'Solicitud enviada', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}
