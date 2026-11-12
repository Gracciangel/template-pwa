import type { IResponse, IUser, IRegisterForm } from '../types'
import { getSupabase, handleError } from '../supabase'

const ERROR_MAP: Record<string, string> = {
  'Email rate limit exceeded': 'Demasiados intentos. Esperá un minuto antes de solicitar otro código.',
  'User already registered': 'Este email ya está registrado.',
  'Invalid email': 'El email ingresado no es válido.',
  'Sending email quota exceeded': 'Límite de envíos alcanzado. Intentá más tarde.',
  'Failed to send email': 'Error al enviar el email. Intentá de nuevo.',
  'Invalid verification code': 'El código ingresado no es válido o ya expiró.',
  'Token has expired or is invalid': 'El código expiró. Solicita uno nuevo.',
  'Email not confirmed': 'El email no está confirmado.',
  'Signup requires a valid password': 'La contraseña debe tener al menos 6 caracteres.',
  'Invalid login credentials': 'Email o contraseña incorrectos.',
}

export function mapAuthError(message: string): string {
  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value
  }
  if (/rate.*limit/i.test(message)) return 'Demasiados intentos. Esperá un momento.'
  if (/quota/i.test(message)) return 'Límite alcanzado. Intentá más tarde.'
  if (/already.*registered/i.test(message)) return 'Este email ya está registrado.'
  if (/invalid.*credentials/i.test(message)) return 'Email o contraseña incorrectos.'
  return message
}

export const signUpWithEmail = async (form: IRegisterForm): Promise<IResponse> => {
  const { email, nombre, apellido, nombre_usuario } = form
  try {
    const { error } = await getSupabase().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: true,
        data: { nombre, apellido, nombre_usuario, role_id: 2 },
      },
    })
    if (error) return { code: 500, msj: mapAuthError(error.message), title: 'Error' }
    return { code: 200, msj: 'Código de verificación enviado a tu email', title: 'OTP sent' }
  } catch (err) {
    return handleError(err)
  }
}

export const resendOTP = async (email: string): Promise<IResponse> => {
  try {
    const { error } = await getSupabase().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
    })
    if (error) return { code: 500, msj: mapAuthError(error.message), title: 'Error' }
    return { code: 200, msj: 'Código reenviado a tu email', title: 'OK' }
  } catch (err) {
    return handleError(err)
  }
}

export const verifySignUpOTP = async (email: string, token: string): Promise<IResponse> => {
  try {
    const { error } = await getSupabase().auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    })
    if (error) return { code: 500, msj: mapAuthError(error.message), title: 'Error' }
    return { code: 200, msj: 'Email verificado correctamente', title: 'OK' }
  } catch (err) {
    return handleError(err)
  }
}

export const loginWithEmail = async (email: string, password: string): Promise<IResponse<IUser>> => {
  try {
    const { data: authData, error: authError } = await getSupabase().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })
    if (authError) return { code: 500, msj: mapAuthError(authError.message), title: 'Error' }
    const { data: userData, error: userError } = await getSupabase()
      .from('usuarios')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle()
    if (userError) return { code: 500, msj: userError.message, title: 'Error' }
    if (!userData) return { code: 500, msj: 'Usuario no encontrado en la base de datos', title: 'Error' }
    return { code: 200, msj: 'Sesión iniciada', title: 'OK', result: userData as IUser }
  } catch (err) {
    return handleError(err)
  }
}

export const signInWithGoogle = async (redirectTo?: string): Promise<IResponse<string>> => {
  try {
    const { data, error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: redirectTo ?? `${window.location.origin}/auth/callback` },
    })
    if (error) return { code: 500, msj: error.message, title: 'Error' }
    if (!data?.url) return { code: 500, msj: 'No se pudo obtener la URL de autenticación', title: 'Error' }
    return { code: 200, msj: '', title: 'OK', result: data.url }
  } catch (err) {
    return handleError(err)
  }
}
