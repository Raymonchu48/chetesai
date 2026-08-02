create table if not exists public.catalogo_bonos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  modalidad text not null check (modalidad in ('personal', 'grupo', 'mixto', 'otro')),
  sesiones_incluidas integer not null check (sesiones_incluidas > 0),
  precio_eur numeric(10,2) not null check (precio_eur >= 0),
  vigencia_dias integer not null default 31 check (vigencia_dias > 0),
  descripcion text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bonos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  catalogo_bono_id uuid references public.catalogo_bonos(id) on delete set null,
  nombre text not null,
  modalidad text not null check (modalidad in ('personal', 'grupo', 'mixto', 'otro')),
  sesiones_totales integer not null check (sesiones_totales > 0),
  sesiones_consumidas integer not null default 0 check (sesiones_consumidas >= 0),
  precio_eur numeric(10,2) not null default 0 check (precio_eur >= 0),
  fecha_inicio date not null default current_date,
  fecha_fin date not null,
  estado text not null default 'activo' check (estado in ('activo', 'agotado', 'vencido', 'cancelado')),
  renovacion_automatica boolean not null default false,
  notas text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bonos_cliente_consumo_check check (sesiones_consumidas <= sesiones_totales)
);

create table if not exists public.pagos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  bono_cliente_id uuid references public.bonos_cliente(id) on delete set null,
  concepto text not null,
  importe_eur numeric(10,2) not null check (importe_eur >= 0),
  fecha_emision date not null default current_date,
  fecha_vencimiento date,
  fecha_pago date,
  metodo_pago text check (metodo_pago is null or metodo_pago in ('efectivo', 'tarjeta', 'transferencia', 'bizum', 'domiciliacion', 'otro')),
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'vencido', 'anulado')),
  referencia text,
  notas text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.consumos_bono (
  id uuid primary key default gen_random_uuid(),
  bono_cliente_id uuid not null references public.bonos_cliente(id) on delete cascade,
  sesion_id uuid references public.sesiones_agenda(id) on delete set null,
  cantidad integer not null default 1 check (cantidad > 0),
  concepto text not null default 'Sesión consumida',
  fecha date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bono_cliente_id, sesion_id)
);

create index if not exists catalogo_bonos_activo_idx on public.catalogo_bonos (activo, modalidad);
create index if not exists bonos_cliente_cliente_estado_idx on public.bonos_cliente (cliente_id, estado, fecha_fin desc);
create index if not exists pagos_cliente_cliente_estado_idx on public.pagos_cliente (cliente_id, estado, fecha_vencimiento desc);
create index if not exists consumos_bono_bono_fecha_idx on public.consumos_bono (bono_cliente_id, fecha desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists catalogo_bonos_touch_updated_at on public.catalogo_bonos;
create trigger catalogo_bonos_touch_updated_at
before update on public.catalogo_bonos
for each row execute function public.touch_updated_at();

drop trigger if exists bonos_cliente_touch_updated_at on public.bonos_cliente;
create trigger bonos_cliente_touch_updated_at
before update on public.bonos_cliente
for each row execute function public.touch_updated_at();

drop trigger if exists pagos_cliente_touch_updated_at on public.pagos_cliente;
create trigger pagos_cliente_touch_updated_at
before update on public.pagos_cliente
for each row execute function public.touch_updated_at();

insert into public.catalogo_bonos (nombre, slug, modalidad, sesiones_incluidas, precio_eur, vigencia_dias, descripcion)
values
  ('Personal Básico', 'personal-basico', 'personal', 4, 75, 31, 'Cuatro sesiones individuales al mes.'),
  ('Personal Activo', 'personal-activo', 'personal', 8, 130, 31, 'Ocho sesiones individuales al mes.'),
  ('Personal Intensivo', 'personal-intensivo', 'personal', 12, 165, 31, 'Doce sesiones individuales al mes.'),
  ('Grupo Básico', 'grupo-basico', 'grupo', 4, 45, 31, 'Cuatro sesiones mensuales en grupo reducido.'),
  ('Grupo Activo', 'grupo-activo', 'grupo', 8, 80, 31, 'Ocho sesiones mensuales en grupo reducido.'),
  ('Grupo Intensivo', 'grupo-intensivo', 'grupo', 12, 110, 31, 'Doce sesiones mensuales en grupo reducido.')
on conflict (slug) do update set
  nombre = excluded.nombre,
  modalidad = excluded.modalidad,
  sesiones_incluidas = excluded.sesiones_incluidas,
  precio_eur = excluded.precio_eur,
  vigencia_dias = excluded.vigencia_dias,
  descripcion = excluded.descripcion,
  activo = true;

alter table public.catalogo_bonos enable row level security;
alter table public.bonos_cliente enable row level security;
alter table public.pagos_cliente enable row level security;
alter table public.consumos_bono enable row level security;

drop policy if exists "Profesionales gestionan catálogo de bonos" on public.catalogo_bonos;
create policy "Profesionales gestionan catálogo de bonos"
on public.catalogo_bonos
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

drop policy if exists "Clientes consultan catálogo activo" on public.catalogo_bonos;
create policy "Clientes consultan catálogo activo"
on public.catalogo_bonos
for select
to authenticated
using (activo = true);

drop policy if exists "Profesionales gestionan bonos de clientes" on public.bonos_cliente;
create policy "Profesionales gestionan bonos de clientes"
on public.bonos_cliente
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

drop policy if exists "Clientes consultan sus bonos" on public.bonos_cliente;
create policy "Clientes consultan sus bonos"
on public.bonos_cliente
for select
to authenticated
using (
  exists (
    select 1 from public.clientes
    where clientes.id = bonos_cliente.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists "Profesionales gestionan pagos" on public.pagos_cliente;
create policy "Profesionales gestionan pagos"
on public.pagos_cliente
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

drop policy if exists "Clientes consultan sus pagos" on public.pagos_cliente;
create policy "Clientes consultan sus pagos"
on public.pagos_cliente
for select
to authenticated
using (
  exists (
    select 1 from public.clientes
    where clientes.id = pagos_cliente.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists "Profesionales gestionan consumos" on public.consumos_bono;
create policy "Profesionales gestionan consumos"
on public.consumos_bono
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

drop policy if exists "Clientes consultan sus consumos" on public.consumos_bono;
create policy "Clientes consultan sus consumos"
on public.consumos_bono
for select
to authenticated
using (
  exists (
    select 1
    from public.bonos_cliente
    join public.clientes on clientes.id = bonos_cliente.cliente_id
    where bonos_cliente.id = consumos_bono.bono_cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);