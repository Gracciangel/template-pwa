// Edge Function: send-push
// Envía Web Push a las suscripciones guardadas en public.push_subscriptions.
//
// Secrets necesarios (supabase secrets set ...):
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, PUSH_SHARED_SECRET
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase automáticamente.
//
// Deploy: supabase functions deploy send-push --no-verify-jwt
// (la función se autentica con el header x-push-secret, no con JWT)

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-push-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

type Payload = {
  usuario_ids?: string[] | null
  titulo?: string
  cuerpo?: string
  tipo?: string
  datos?: Record<string, unknown> | null
}

/** Traduce los `screen` de la app móvil a rutas de la PWA. */
function destino(datos: Record<string, unknown> | null | undefined): string {
  const screen = typeof datos?.screen === 'string' ? datos.screen : ''
  if (screen.includes('profile')) return '/profile'
  if (screen.includes('home')) return '/'
  if (screen.includes('event')) return '/events-register'
  if (screen.includes('ministerio')) return '/ministerios'
  if (screen.includes('grupo')) return '/groups'
  return '/notificaciones'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'método no permitido' }, 405)

  const esperado = Deno.env.get('PUSH_SHARED_SECRET')
  const recibido = req.headers.get('x-push-secret')
  if (!esperado || recibido !== esperado) return json({ error: 'no autorizado' }, 401)

  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@tiempodegracia.app'
  if (!vapidPublic || !vapidPrivate) {
    return json({ error: 'faltan las claves VAPID en la función' }, 500)
  }

  let body: Payload
  try {
    body = await req.json()
  } catch {
    return json({ error: 'body inválido' }, 400)
  }

  const titulo = body.titulo?.trim()
  if (!titulo) return json({ error: 'falta titulo' }, 400)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let query = supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth, usuario_id')
  if (body.usuario_ids && body.usuario_ids.length > 0) {
    query = query.in('usuario_id', body.usuario_ids)
  }

  const { data: subs, error } = await query
  if (error) return json({ error: error.message }, 500)
  if (!subs || subs.length === 0) return json({ enviadas: 0, fallidas: 0, eliminadas: 0 })

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const notificacion = JSON.stringify({
    title: titulo,
    body: body.cuerpo ?? '',
    tipo: body.tipo ?? 'general',
    url: destino(body.datos),
    datos: body.datos ?? {},
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
  })

  const resultados = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        notificacion,
        { TTL: 60 * 60 * 24 },
      ),
    ),
  )

  const vencidas: number[] = []
  let enviadas = 0
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      enviadas += 1
      return
    }
    const status = (r.reason as { statusCode?: number })?.statusCode
    if (status === 404 || status === 410) vencidas.push(subs[i].id)
  })

  if (vencidas.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', vencidas)
  }

  return json({
    enviadas,
    fallidas: resultados.length - enviadas,
    eliminadas: vencidas.length,
  })
})
