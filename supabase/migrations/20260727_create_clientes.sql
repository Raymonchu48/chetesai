create extension if not exists pgcrypto;

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text,
  telefono text,
  fecha_nacimiento date,
  objetivo text not null default 'bienestar_general',
  estado text not null default 'activo',
  fecha_alta date not null default current_date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clientes_estado_check check (estado in ('activo', 'inactivo', 'prueba'))
);

create index if not exists clientes_nombre_idx on public.clientes using btree (nombre);
create index if not exists clientes_email_idx on public.clientes using btree (email);
create index if not exists clientes_estado_idx on public.clientes using btree (estado);

alter table public.clientes enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists clientes_set_updated_at on public.clientes;
create trigger clientes_set_updated_at
before update on public.clientes
for each row execute function public.set_updated_at();

comment on table public.clientes is 'Clientes gestionados desde Chetesaí Fitness+';
