-- Chetesaí Fitness+ · Fase 2.1 · Motor de rutinas
create extension if not exists pgcrypto;

create table if not exists public.rutinas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  objetivo text not null default 'bienestar_general',
  nivel text not null default 'principiante',
  dias_semana smallint not null default 3,
  duracion_semanas smallint,
  duracion_sesion_minutos smallint,
  creado_por uuid references auth.users(id) on delete set null,
  activa boolean not null default true,
  es_plantilla boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rutinas_nivel_check check (nivel in ('principiante', 'intermedio', 'avanzado')),
  constraint rutinas_dias_semana_check check (dias_semana between 1 and 7),
  constraint rutinas_duracion_semanas_check check (duracion_semanas is null or duracion_semanas between 1 and 104),
  constraint rutinas_duracion_sesion_check check (duracion_sesion_minutos is null or duracion_sesion_minutos between 5 and 360)
);

create table if not exists public.rutina_ejercicios (
  id uuid primary key default gen_random_uuid(),
  rutina_id uuid not null references public.rutinas(id) on delete cascade,
  ejercicio_id uuid not null references public.ejercicios(id) on delete restrict,
  dia smallint not null default 1,
  bloque text,
  orden smallint not null default 1,
  series smallint not null default 3,
  repeticiones text not null default '10',
  peso_kg numeric(7,2),
  descanso_segundos smallint not null default 60,
  tempo text,
  rpe numeric(3,1),
  rir smallint,
  duracion_segundos smallint,
  distancia_metros numeric(8,2),
  observaciones text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rutina_ejercicios_dia_check check (dia between 1 and 7),
  constraint rutina_ejercicios_orden_check check (orden > 0),
  constraint rutina_ejercicios_series_check check (series between 1 and 30),
  constraint rutina_ejercicios_peso_check check (peso_kg is null or peso_kg >= 0),
  constraint rutina_ejercicios_descanso_check check (descanso_segundos between 0 and 3600),
  constraint rutina_ejercicios_rpe_check check (rpe is null or rpe between 1 and 10),
  constraint rutina_ejercicios_rir_check check (rir is null or rir between 0 and 10),
  constraint rutina_ejercicios_duracion_check check (duracion_segundos is null or duracion_segundos > 0),
  constraint rutina_ejercicios_distancia_check check (distancia_metros is null or distancia_metros >= 0),
  constraint rutina_ejercicios_orden_unique unique (rutina_id, dia, orden)
);

create table if not exists public.cliente_rutinas (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  rutina_id uuid not null references public.rutinas(id) on delete restrict,
  fecha_inicio date not null default current_date,
  fecha_fin date,
  estado text not null default 'activa',
  progreso numeric(5,2) not null default 0,
  notas text,
  asignada_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cliente_rutinas_estado_check check (estado in ('borrador', 'programada', 'activa', 'pausada', 'completada', 'cancelada')),
  constraint cliente_rutinas_progreso_check check (progreso between 0 and 100),
  constraint cliente_rutinas_fechas_check check (fecha_fin is null or fecha_fin >= fecha_inicio)
);

create index if not exists rutinas_nombre_idx on public.rutinas(nombre);
create index if not exists rutinas_objetivo_idx on public.rutinas(objetivo);
create index if not exists rutinas_nivel_idx on public.rutinas(nivel);
create index if not exists rutinas_activa_idx on public.rutinas(activa);
create index if not exists rutinas_creado_por_idx on public.rutinas(creado_por);

create index if not exists rutina_ejercicios_rutina_idx on public.rutina_ejercicios(rutina_id);
create index if not exists rutina_ejercicios_ejercicio_idx on public.rutina_ejercicios(ejercicio_id);
create index if not exists rutina_ejercicios_dia_orden_idx on public.rutina_ejercicios(rutina_id, dia, orden);

create index if not exists cliente_rutinas_cliente_idx on public.cliente_rutinas(cliente_id);
create index if not exists cliente_rutinas_rutina_idx on public.cliente_rutinas(rutina_id);
create index if not exists cliente_rutinas_estado_idx on public.cliente_rutinas(estado);
create index if not exists cliente_rutinas_fechas_idx on public.cliente_rutinas(fecha_inicio, fecha_fin);

create or replace function public.set_routine_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rutinas_set_updated_at on public.rutinas;
create trigger rutinas_set_updated_at
before update on public.rutinas
for each row execute function public.set_routine_updated_at();

drop trigger if exists rutina_ejercicios_set_updated_at on public.rutina_ejercicios;
create trigger rutina_ejercicios_set_updated_at
before update on public.rutina_ejercicios
for each row execute function public.set_routine_updated_at();

drop trigger if exists cliente_rutinas_set_updated_at on public.cliente_rutinas;
create trigger cliente_rutinas_set_updated_at
before update on public.cliente_rutinas
for each row execute function public.set_routine_updated_at();

alter table public.rutinas enable row level security;
alter table public.rutina_ejercicios enable row level security;
alter table public.cliente_rutinas enable row level security;

-- El panel profesional opera mediante rutas de servidor con service_role.
-- Estas políticas permiten lectura autenticada; la autorización por rol se aplica en middleware/API.
drop policy if exists "rutinas_authenticated_select" on public.rutinas;
create policy "rutinas_authenticated_select"
on public.rutinas for select to authenticated
using (activa = true);

drop policy if exists "rutina_ejercicios_authenticated_select" on public.rutina_ejercicios;
create policy "rutina_ejercicios_authenticated_select"
on public.rutina_ejercicios for select to authenticated
using (
  exists (
    select 1 from public.rutinas r
    where r.id = rutina_ejercicios.rutina_id and r.activa = true
  )
);

comment on table public.rutinas is 'Plantillas y planes de entrenamiento de Chetesaí Fitness+';
comment on table public.rutina_ejercicios is 'Ejercicios configurados dentro de cada rutina';
comment on table public.cliente_rutinas is 'Asignaciones de rutinas a clientes';
