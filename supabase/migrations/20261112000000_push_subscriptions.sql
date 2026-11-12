-- ============================================
-- Web Push: suscripciones del navegador
-- ============================================
-- Cada navegador/dispositivo genera un endpoint propio. Un mismo usuario puede
-- tener varias filas (celular, desktop, etc.). El endpoint es único global.
--
-- El envío lo hace la Edge Function `send-push` con la service_role key, que
-- bypassa RLS. El cliente sólo puede ver/crear/borrar sus propias filas.

create table if not exists public.push_subscriptions (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_usuario_idx
  on public.push_subscriptions (usuario_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "push_subscriptions_select_propio" on public.push_subscriptions;
create policy "push_subscriptions_select_propio"
  on public.push_subscriptions for select
  using (auth.uid() = usuario_id);

drop policy if exists "push_subscriptions_insert_propio" on public.push_subscriptions;
create policy "push_subscriptions_insert_propio"
  on public.push_subscriptions for insert
  with check (auth.uid() = usuario_id);

drop policy if exists "push_subscriptions_update_propio" on public.push_subscriptions;
create policy "push_subscriptions_update_propio"
  on public.push_subscriptions for update
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);

drop policy if exists "push_subscriptions_delete_propio" on public.push_subscriptions;
create policy "push_subscriptions_delete_propio"
  on public.push_subscriptions for delete
  using (auth.uid() = usuario_id);
