create table if not exists public.solicitudes_reserva (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  telefono text,
  modalidad text not null default 'orientacion'
    check (modalidad in ('entrenamiento_personal', 'grupo_reducido', 'orientacion')),
  objetivo text,
  mensaje text,
  fecha_preferida date,
  franja_horaria text,
  estado text not null default 'nueva'
    check (estado in ('nueva', 'contactada', 'convertida', 'descartada')),
  cliente_id uuid references public.clientes(id) on delete set null,
  origen text not null default 'web',
  consentimiento boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sesiones_agenda (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  solicitud_id uuid references public.solicitudes_reserva(id) on delete set null,
  titulo text not null,
  inicio_at timestamptz not null,
  duracion_minutos integer not null default 60
    check (duracion_minutos between 15 and 240),
  tipo_sesion text not null default 'entrenamiento_personal'
    check (tipo_sesion in ('valoracion_inicial', 'entrenamiento_personal', 'grupo_reducido', 'revision_progreso', 'nutricion', 'online', 'otro')),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'confirmada', 'realizada', 'cancelada', 'no_asistio')),
  modalidad text not null default 'presencial'
    check (modalidad in ('presencial', 'online', 'exterior')),
  ubicacion text,
  notas_profesional text,
  mensaje_cliente text,
  motivo_cancelacion text,
  recordatorio_minutos integer not null default 1440
    check (recordatorio_minutos between 0 and 10080),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists solicitudes_reserva_estado_fecha_idx
  on public.solicitudes_reserva (estado, created_at desc);

create index if not exists sesiones_agenda_cliente_inicio_idx
  on public.sesiones_agenda (cliente_id, inicio_at desc);

create index if not exists sesiones_agenda_inicio_estado_idx
  on public.sesiones_agenda (inicio_at, estado);

create or replace function public.chetesai_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists solicitudes_reserva_set_updated_at on public.solicitudes_reserva;
create trigger solicitudes_reserva_set_updated_at
before update on public.solicitudes_reserva
for each row execute function public.chetesai_set_updated_at();

drop trigger if exists sesiones_agenda_set_updated_at on public.sesiones_agenda;
create trigger sesiones_agenda_set_updated_at
before update on public.sesiones_agenda
for each row execute function public.chetesai_set_updated_at();

alter table public.solicitudes_reserva enable row level security;
alter table public.sesiones_agenda enable row level security;

drop policy if exists "Profesionales gestionan solicitudes" on public.solicitudes_reserva;
create policy "Profesionales gestionan solicitudes"
on public.solicitudes_reserva
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.activo = true
      and profiles.role in ('administrador', 'profesional')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.activo = true
      and profiles.role in ('administrador', 'profesional')
  )
);

drop policy if exists "Profesionales gestionan agenda" on public.sesiones_agenda;
create policy "Profesionales gestionan agenda"
on public.sesiones_agenda
for all
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.activo = true
      and profiles.role in ('administrador', 'profesional')
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.activo = true
      and profiles.role in ('administrador', 'profesional')
  )
);

drop policy if exists "Clientes consultan sus sesiones" on public.sesiones_agenda;
create policy "Clientes consultan sus sesiones"
on public.sesiones_agenda
for select
to authenticated
using (
  exists (
    select 1 from public.clientes
    where clientes.id = sesiones_agenda.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);
