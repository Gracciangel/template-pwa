import { supabase } from './supabase'

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY

export type PushEstado = 'no-soportado' | 'sin-configurar' | 'default' | 'granted' | 'denied'

export function pushSoportado(): boolean {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

export function estadoPush(): PushEstado {
  if (!pushSoportado()) return 'no-soportado'
  if (!VAPID_PUBLIC) return 'sin-configurar'
  return Notification.permission as PushEstado
}

/** Convierte la clave VAPID (base64url) al Uint8Array que pide PushManager. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

async function guardarSuscripcion(usuarioId: string, sub: PushSubscription) {
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      usuario_id: usuarioId,
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
      user_agent: navigator.userAgent.slice(0, 200),
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw new Error(error.message)
}

/** Pide permiso, suscribe el navegador y guarda la suscripción en Supabase. */
export async function activarPush(usuarioId: string): Promise<void> {
  const estado = estadoPush()
  if (estado === 'no-soportado') throw new Error('Este navegador no soporta notificaciones push.')
  if (estado === 'sin-configurar') {
    throw new Error('Falta configurar VITE_VAPID_PUBLIC_KEY en el entorno.')
  }

  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') {
    throw new Error('No diste permiso para mostrar notificaciones.')
  }

  const registro = await navigator.serviceWorker.ready
  const existente = await registro.pushManager.getSubscription()
  const sub =
    existente ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC as string),
    }))

  await guardarSuscripcion(usuarioId, sub)
}

/** Da de baja el navegador y borra la fila en Supabase. */
export async function desactivarPush(): Promise<void> {
  if (!pushSoportado()) return
  const registro = await navigator.serviceWorker.ready
  const sub = await registro.pushManager.getSubscription()
  if (!sub) return

  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}

export async function pushActivo(): Promise<boolean> {
  if (!pushSoportado() || Notification.permission !== 'granted') return false
  const registro = await navigator.serviceWorker.ready
  return !!(await registro.pushManager.getSubscription())
}

/**
 * Si el permiso ya estaba dado, vuelve a guardar la suscripción (el endpoint
 * puede haber cambiado después de una limpieza del navegador).
 */
export async function sincronizarPush(usuarioId: string): Promise<boolean> {
  if (!pushSoportado() || Notification.permission !== 'granted') return false
  try {
    const registro = await navigator.serviceWorker.ready
    let sub = await registro.pushManager.getSubscription()
    if (!sub) {
      if (!VAPID_PUBLIC) return false
      sub = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      })
    }
    await guardarSuscripcion(usuarioId, sub)
    return true
  } catch {
    return false
  }
}
