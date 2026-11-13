# Notificaciones push web

La PWA usa Web Push estándar (VAPID). El flujo es:

1. El navegador se suscribe y guarda la suscripción en `public.push_subscriptions`.
2. La RPC `enviar_push_notificacion` (que ya usan los cronogramas, danza y triggers)
   inserta la notificación en la campanita y llama por `pg_net` a la Edge Function
   `send-push`.
3. La Edge Function firma y envía el push a cada suscripción con `web-push`.
4. El service worker (`public/push-handlers.js`) muestra la notificación y, al
   tocarla, abre la ruta correspondiente.

La app móvil sigue recibiendo por Expo mientras existan `usuarios.fcm_token`.

## 1. Generar claves VAPID

```bash
npx web-push generate-vapid-keys
```

Guardá la pública y la privada.

## 2. Configurar el frontend

En `.env` (local) y en las variables de entorno de Netlify/Vercel:

```
VITE_VAPID_PUBLIC_KEY=BP...
```

Sin esta variable el botón de activar push no aparece (la app avisa "sin configurar").

## 3. Aplicar migraciones

```bash
supabase link --project-ref ejwvfmlcjiwxxhduuekh
supabase db push
```

Las migraciones son:

- `20261112000000_push_subscriptions.sql`: tabla + RLS (cada usuario ve sólo lo suyo).
- `20261112000100_enviar_push_notificacion_web.sql`: reemplaza la RPC para registrar
  siempre la notificación y llamar a la Edge Function.

## 4. Secretos en la Edge Function

```bash
supabase secrets set \
  VAPID_PUBLIC_KEY=BP... \
  VAPID_PRIVATE_KEY=... \
  VAPID_SUBJECT=mailto:tu-mail@dominio.com \
  PUSH_SHARED_SECRET=<secreto-largo-aleatorio>
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` los inyecta Supabase solo.

## 5. Deploy de la función

```bash
supabase functions deploy send-push
```

`supabase/config.toml` ya deja `verify_jwt = false` para esta función: la llama
Postgres (sin JWT) y la autenticación real es el header `x-push-secret`.

## 6. Guardar URL y secreto en Vault

En el SQL Editor:

```sql
select vault.create_secret(
  'https://ejwvfmlcjiwxxhduuekh.supabase.co/functions/v1/send-push',
  'push_function_url'
);
select vault.create_secret('<el-mismo-PUSH_SHARED_SECRET>', 'push_shared_secret');
```

Si estos secretos no existen, la RPC omite el envío web sin fallar (la campanita
sigue funcionando).

## 7. Probar

1. `npm run build && npm run preview` (o deploy).
2. Entrar a `/notificaciones` y tocar **Activar**.
3. Aceptar el permiso del navegador.
4. Verificar en Supabase: `select * from public.push_subscriptions;`
5. Disparar una notificación de prueba:

```sql
select public.enviar_push_notificacion(
  'Prueba',
  'Si ves esto, el push web funciona',
  'general',
  '{"screen": "/notificaciones"}'::jsonb,
  array['<uuid-del-usuario>']::uuid[]
);
```

## Notas

- HTTPS es obligatorio (localhost también sirve para probar).
- iOS sólo permite Web Push si la PWA está instalada en la pantalla de inicio (iOS 16.4+).
- Si el navegador devuelve 404/410, la función borra esa suscripción automáticamente.
- El service worker nuevo se activa solo (`skipWaiting` + `clientsClaim`); si un
  dispositivo tenía la versión vieja, puede necesitar recargar una vez.
