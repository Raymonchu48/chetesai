-- Chetesaí Fitness+ · consentimiento explícito y gestión de derechos RGPD.

create table if not exists public.privacy_consent_events (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  consent_type text not null check (consent_type in ('health_data', 'progress_photos')),
  granted boolean not null,
  policy_version text not null,
  legal_text_hash text not null check (legal_text_hash ~ '^[0-9a-f]{64}$'),
  source text not null default 'client_portal' check (source in ('client_portal', 'professional_recorded')),
  recorded_at timestamptz not null default now()
);

comment on table public.privacy_consent_events is
  'Registro inmutable de otorgamiento o retirada de consentimientos específicos.';

create index if not exists privacy_consent_events_current_idx
  on public.privacy_consent_events (cliente_id, consent_type, recorded_at desc, id desc);

alter table public.privacy_consent_events enable row level security;

revoke all privileges on table public.privacy_consent_events from public, anon, authenticated;
grant select, insert on table public.privacy_consent_events to service_role;

drop policy if exists "privacy_consent_events_server_only" on public.privacy_consent_events;
create policy "privacy_consent_events_server_only"
on public.privacy_consent_events for all to anon, authenticated
using (false) with check (false);
create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid references public.clientes(id) on delete set null,
  auth_user_id uuid references auth.users(id) on delete set null,
  requester_email_hash text not null check (requester_email_hash ~ '^[0-9a-f]{64}$'),
  request_type text not null check (request_type in ('access_export', 'erasure')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'rejected', 'cancelled')),
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_note text,
  constraint privacy_requests_resolution_check check (
    (status in ('completed', 'rejected', 'cancelled') and resolved_at is not null)
    or (status in ('pending', 'in_progress') and resolved_at is null)
  )
);

comment on table public.privacy_requests is
  'Trazabilidad de solicitudes de acceso, portabilidad y supresión de datos.';

create index if not exists privacy_requests_client_requested_idx
  on public.privacy_requests (cliente_id, requested_at desc);

create unique index if not exists privacy_requests_one_open_request_idx
  on public.privacy_requests (cliente_id, request_type)
  where cliente_id is not null and status in ('pending', 'in_progress');

alter table public.privacy_requests enable row level security;

revoke all privileges on table public.privacy_requests from public, anon, authenticated;
grant select, insert, update on table public.privacy_requests to service_role;

drop policy if exists "privacy_requests_server_only" on public.privacy_requests;
create policy "privacy_requests_server_only"
on public.privacy_requests for all to anon, authenticated
using (false) with check (false);
