import type { IResponse } from '../types'
import { getSupabase, handleError, fetchWithTimeout } from '../supabase'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/** En web el archivo es un File/Blob, no una uri. */
export const uploadToCloudinary = async (file: File | Blob): Promise<IResponse<string>> => {
  try {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      return { code: 500, msj: 'Faltan las variables de Cloudinary', title: 'Error' }
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('quality', 'auto:good')
    formData.append('width', '400')
    formData.append('crop', 'limit')

    const res = await fetchWithTimeout(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    if (data.secure_url) {
      return { code: 200, msj: 'Imagen subida', title: 'OK', result: data.secure_url as string }
    }
    return { code: 500, msj: data.error?.message || 'Error al subir', title: 'Error' }
  } catch (error) {
    return handleError(error)
  }
}

export const updateAvatarRPC = async (userId: string, avatarUrl: string): Promise<IResponse> => {
  try {
    const { error } = await getSupabase().rpc('update_avatar', {
      p_usuario_id: userId,
      p_avatar_url: avatarUrl,
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    return { code: 200, msj: 'Avatar actualizado', title: 'OK' }
  } catch (error) {
    return handleError(error)
  }
}
