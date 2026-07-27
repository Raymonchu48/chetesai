-- Chetesaí Fitness+ · biblioteca profesional de ejercicios
create table if not exists public.ejercicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  grupo_muscular text not null,
  grupo_secundario text,
  categoria text not null default 'fuerza',
  dificultad text not null default 'principiante',
  material text,
  descripcion text,
  tecnica text,
  errores_frecuentes text,
  consejos text,
  imagen_url text,
  video_url text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ejercicios_dificultad_check check (dificultad in ('principiante', 'intermedio', 'avanzado')),
  constraint ejercicios_categoria_check check (categoria in ('fuerza', 'cardio', 'movilidad', 'estiramiento', 'rehabilitacion', 'tecnica'))
);

create index if not exists ejercicios_nombre_idx on public.ejercicios using btree (nombre);
create index if not exists ejercicios_grupo_idx on public.ejercicios (grupo_muscular);
create index if not exists ejercicios_categoria_idx on public.ejercicios (categoria);
create index if not exists ejercicios_dificultad_idx on public.ejercicios (dificultad);
create index if not exists ejercicios_activo_idx on public.ejercicios (activo);

create or replace function public.set_ejercicios_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists ejercicios_set_updated_at on public.ejercicios;
create trigger ejercicios_set_updated_at
before update on public.ejercicios
for each row execute procedure public.set_ejercicios_updated_at();

alter table public.ejercicios enable row level security;

-- Las operaciones del panel se realizan desde rutas de servidor con service_role.
-- Los clientes autenticados solo pueden consultar ejercicios activos.
drop policy if exists "ejercicios_select_active" on public.ejercicios;
create policy "ejercicios_select_active"
on public.ejercicios
for select
to authenticated
using (activo = true);
