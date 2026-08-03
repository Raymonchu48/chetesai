create table if not exists public.planes_nutricionales (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nombre text not null default 'Plan nutricional personalizado',
  objetivo text,
  calorias_objetivo integer,
  proteinas_g numeric(6,2),
  carbohidratos_g numeric(6,2),
  grasas_g numeric(6,2),
  agua_ml integer,
  recomendaciones text,
  comidas jsonb not null default '[]'::jsonb,
  fecha_inicio date not null default current_date,
  fecha_fin date,
  estado text not null default 'activo' check (estado in ('borrador', 'activo', 'finalizado')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint plan_calorias_check check (calorias_objetivo is null or calorias_objetivo between 800 and 6000),
  constraint plan_proteinas_check check (proteinas_g is null or proteinas_g between 0 and 500),
  constraint plan_carbohidratos_check check (carbohidratos_g is null or carbohidratos_g between 0 and 1000),
  constraint plan_grasas_check check (grasas_g is null or grasas_g between 0 and 300),
  constraint plan_agua_check check (agua_ml is null or agua_ml between 500 and 10000)
);

create unique index if not exists planes_nutricionales_cliente_activo_idx
  on public.planes_nutricionales (cliente_id)
  where estado = 'activo';

create index if not exists planes_nutricionales_cliente_fecha_idx
  on public.planes_nutricionales (cliente_id, fecha_inicio desc, created_at desc);

create table if not exists public.habitos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  nombre text not null,
  categoria text not null default 'bienestar' check (categoria in ('hidratacion', 'alimentacion', 'descanso', 'actividad', 'bienestar', 'otro')),
  tipo_registro text not null default 'booleano' check (tipo_registro in ('booleano', 'cantidad')),
  objetivo_valor numeric(8,2),
  unidad text,
  instrucciones text,
  activo boolean not null default true,
  visible_cliente boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habito_objetivo_check check (objetivo_valor is null or objetivo_valor >= 0)
);

create index if not exists habitos_cliente_activos_idx
  on public.habitos_cliente (cliente_id, activo, created_at);

create table if not exists public.registros_habitos (
  id uuid primary key default gen_random_uuid(),
  habito_id uuid not null references public.habitos_cliente(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  fecha date not null default current_date,
  completado boolean not null default false,
  valor numeric(8,2),
  nota text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habito_id, fecha),
  constraint registro_valor_check check (valor is null or valor >= 0)
);

create index if not exists registros_habitos_cliente_fecha_idx
  on public.registros_habitos (cliente_id, fecha desc);

alter table public.planes_nutricionales enable row level security;
alter table public.habitos_cliente enable row level security;
alter table public.registros_habitos enable row level security;

drop policy if exists "Profesionales gestionan planes nutricionales" on public.planes_nutricionales;
create policy "Profesionales gestionan planes nutricionales"
on public.planes_nutricionales
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

drop policy if exists "Clientes consultan su plan nutricional" on public.planes_nutricionales;
create policy "Clientes consultan su plan nutricional"
on public.planes_nutricionales
for select
to authenticated
using (
  exists (
    select 1 from public.clientes
    where clientes.id = planes_nutricionales.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists "Profesionales gestionan hábitos" on public.habitos_cliente;
create policy "Profesionales gestionan hábitos"
on public.habitos_cliente
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

drop policy if exists "Clientes consultan sus hábitos" on public.habitos_cliente;
create policy "Clientes consultan sus hábitos"
on public.habitos_cliente
for select
to authenticated
using (
  visible_cliente = true
  and exists (
    select 1 from public.clientes
    where clientes.id = habitos_cliente.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists "Profesionales gestionan registros de hábitos" on public.registros_habitos;
create policy "Profesionales gestionan registros de hábitos"
on public.registros_habitos
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

drop policy if exists "Clientes consultan sus registros de hábitos" on public.registros_habitos;
create policy "Clientes consultan sus registros de hábitos"
on public.registros_habitos
for select
to authenticated
using (
  exists (
    select 1 from public.clientes
    where clientes.id = registros_habitos.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists "Clientes registran sus hábitos" on public.registros_habitos;
create policy "Clientes registran sus hábitos"
on public.registros_habitos
for insert
to authenticated
with check (
  exists (
    select 1 from public.clientes
    where clientes.id = registros_habitos.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  and exists (
    select 1 from public.habitos_cliente
    where habitos_cliente.id = registros_habitos.habito_id
      and habitos_cliente.cliente_id = registros_habitos.cliente_id
      and habitos_cliente.activo = true
      and habitos_cliente.visible_cliente = true
  )
);

drop policy if exists "Clientes actualizan sus hábitos" on public.registros_habitos;
create policy "Clientes actualizan sus hábitos"
on public.registros_habitos
for update
to authenticated
using (
  exists (
    select 1 from public.clientes
    where clientes.id = registros_habitos.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
)
with check (
  exists (
    select 1 from public.clientes
    where clientes.id = registros_habitos.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);
