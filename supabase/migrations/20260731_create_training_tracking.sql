-- Chetesaí Fitness+ · Fase 3 · Seguimiento del entrenamiento
create extension if not exists pgcrypto;

create table if not exists public.sesiones_entrenamiento (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  cliente_rutina_id uuid not null references public.cliente_rutinas(id) on delete cascade,
  rutina_id uuid not null references public.rutinas(id) on delete restrict,
  dia smallint not null,
  estado text not null default 'en_curso',
  iniciada_at timestamptz not null default now(),
  finalizada_at timestamptz,
  duracion_segundos integer,
  ejercicios_planificados integer not null default 0,
  ejercicios_completados integer not null default 0,
  series_planificadas integer not null default 0,
  series_completadas integer not null default 0,
  volumen_total numeric(12,2) not null default 0,
  rpe_sesion numeric(3,1),
  comentario_cliente text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sesiones_entrenamiento_dia_check check (dia between 1 and 7),
  constraint sesiones_entrenamiento_estado_check check (estado in ('en_curso','completada','cancelada')),
  constraint sesiones_entrenamiento_rpe_check check (rpe_sesion is null or rpe_sesion between 1 and 10)
);

create table if not exists public.series_entrenamiento (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones_entrenamiento(id) on delete cascade,
  rutina_ejercicio_id uuid not null references public.rutina_ejercicios(id) on delete restrict,
  numero_serie smallint not null,
  repeticiones_objetivo text,
  peso_objetivo numeric(7,2),
  repeticiones_realizadas integer,
  peso_real numeric(7,2),
  rpe_real numeric(3,1),
  completada boolean not null default false,
  comentario text,
  completada_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint series_entrenamiento_numero_check check (numero_serie between 1 and 30),
  constraint series_entrenamiento_reps_check check (repeticiones_realizadas is null or repeticiones_realizadas >= 0),
  constraint series_entrenamiento_peso_check check (peso_real is null or peso_real >= 0),
  constraint series_entrenamiento_rpe_check check (rpe_real is null or rpe_real between 1 and 10),
  constraint series_entrenamiento_unique unique (sesion_id, rutina_ejercicio_id, numero_serie)
);

create index if not exists sesiones_entrenamiento_cliente_idx on public.sesiones_entrenamiento(cliente_id);
create index if not exists sesiones_entrenamiento_asignacion_idx on public.sesiones_entrenamiento(cliente_rutina_id);
create index if not exists sesiones_entrenamiento_estado_idx on public.sesiones_entrenamiento(estado);
create index if not exists sesiones_entrenamiento_fecha_idx on public.sesiones_entrenamiento(iniciada_at desc);
create index if not exists series_entrenamiento_sesion_idx on public.series_entrenamiento(sesion_id);
create index if not exists series_entrenamiento_ejercicio_idx on public.series_entrenamiento(rutina_ejercicio_id);

alter table public.sesiones_entrenamiento enable row level security;
alter table public.series_entrenamiento enable row level security;

comment on table public.sesiones_entrenamiento is 'Sesiones reales ejecutadas por clientes de Chetesaí Fitness+';
comment on table public.series_entrenamiento is 'Registro real de cada serie ejecutada durante una sesión';