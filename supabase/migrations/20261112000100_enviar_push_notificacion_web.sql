-- ============================================
-- enviar_push_notificacion: agregar Web Push
-- ============================================
-- Cambios respecto de la versión móvil:
--   1. La notificación SIEMPRE se registra en `notificaciones` /
--      `notificaciones_usuarios`. Antes se abortaba si no había fcm_token,
--      lo que dejaba sin registro a los usuarios web.
--   2. Se sigue enviando a Expo para la app móvil (si hay tokens).
--   3. Se llama a la Edge Function `send-push` vía pg_net para los navegadores
--      suscriptos en `push_subscriptions`.
--
-- La URL y el secreto de la función se leen de Supabase Vault, así no quedan
-- escritos en el repo:
--
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/send-push', 'push_function_url');
--   select vault.create_secret('<secreto-largo-aleatorio>', 'push_shared_secret');
--
-- El mismo secreto va como PUSH_SHARED_SECRET en la Edge Function.
-- Si los secretos no existen, el envío web se omite sin romper la RPC.

create extension if not exists pg_net;

create or replace function public.enviar_push_notificacion(
  p_titulo text,
  p_cuerpo text,
  p_tipo text default 'general',
  p_datos jsonb default '{}'::jsonb,
  p_usuario_ids uuid[] default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notificacion_id bigint;
  v_tokens text[];
  v_batch text[];
  v_i int;
  v_payload jsonb;
  v_url text;
  v_secret text;
  v_subs int;
begin
  -- 1. Registrar siempre la notificación en la campanita
  insert into public.notificaciones (titulo, cuerpo, tipo)
  values (p_titulo, p_cuerpo, p_tipo)
  returning id into v_notificacion_id;

  if p_usuario_ids is not null then
    insert into public.notificaciones_usuarios (notificacion_id, usuario_id)
    select v_notificacion_id, unnest(p_usuario_ids);
  else
    insert into public.notificaciones_usuarios (notificacion_id, usuario_id)
    select v_notificacion_id, id from public.usuarios;
  end if;

  -- 2. Push a la app móvil (Expo) si hay tokens
  if p_usuario_ids is null then
    select array_agg(fcm_token) into v_tokens
    from public.usuarios
    where fcm_token is not null;
  else
    select array_agg(fcm_token) into v_tokens
    from public.usuarios
    where id = any(p_usuario_ids) and fcm_token is not null;
  end if;

  if v_tokens is not null and array_length(v_tokens, 1) > 0 then
    for v_i in 1..array_length(v_tokens, 1) by 100 loop
      v_batch := v_tokens[v_i:least(v_i + 99, array_length(v_tokens, 1))];

      v_payload := jsonb_build_object(
        'to', to_jsonb(v_batch),
        'title', p_titulo,
        'body', p_cuerpo,
        'data', p_datos,
        'priority', 'high',
        'sound', 'default',
        'channelId', 'general_v2',
        'imageUrl', 'https://ejwvfmlcjiwxxhduuekh.supabase.co/storage/v1/object/public/images_notifications/icon_tdg_push.png'
      );

      perform net.http_post(
        url := 'https://exp.host/--/api/v2/push/send',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Accept', 'application/json'
        ),
        body := v_payload::text
      );
    end loop;
  end if;

  -- 3. Web Push (navegadores)
  select count(*) into v_subs
  from public.push_subscriptions
  where p_usuario_ids is null or usuario_id = any(p_usuario_ids);

  if v_subs > 0 then
    begin
      select decrypted_secret into v_url
      from vault.decrypted_secrets
      where name = 'push_function_url';

      select decrypted_secret into v_secret
      from vault.decrypted_secrets
      where name = 'push_shared_secret';

      if v_url is not null and v_secret is not null then
        perform net.http_post(
          url := v_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-push-secret', v_secret
          ),
          body := jsonb_build_object(
            'usuario_ids', to_jsonb(p_usuario_ids),
            'titulo', p_titulo,
            'cuerpo', p_cuerpo,
            'tipo', p_tipo,
            'datos', p_datos
          )::text,
          timeout_milliseconds := 5000
        );
      end if;
    exception
      when others then
        raise warning 'web push omitido: %', sqlerrm;
    end;
  end if;
end;
$$;
