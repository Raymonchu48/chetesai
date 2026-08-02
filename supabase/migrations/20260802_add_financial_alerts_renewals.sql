-- Añade renovaciones encadenadas y registro de avisos financieros.

alter table public.bonos_cliente
  add column if not exists renovado_desde_id uuid references public.bonos_cliente(id) on delete set null;

create unique index if not exists bonos_cliente_renovado_desde_unique_idx
  on public.bonos_cliente (renovado_desde_id)
  where renovado_desde_id is not null;

create table if not exists public.avisos_financieros (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  bono_cliente_id uuid references public.bonos_cliente(id) on delete cascade,
  pago_cliente_id uuid references public.pagos_cliente(id) on delete cascade,
  tipo text not null check (tipo in ('pocas_sesiones', 'proximo_vencimiento', 'renovacion_generada', 'cuota_vencida')),
  destinatario text not null,
  estado text not null default 'enviado' check (estado in ('enviado', 'error')),
  resend_id text,
  error text,
  created_by uuid references auth.users(id) on delete set null,
  enviado_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint avisos_financieros_origen_check check (
    bono_cliente_id is not null or pago_cliente_id is not null
  )
);

create unique index if not exists avisos_financieros_bono_tipo_unique_idx
  on public.avisos_financieros (bono_cliente_id, tipo)
  where bono_cliente_id is not null and pago_cliente_id is null and estado = 'enviado';

create unique index if not exists avisos_financieros_pago_tipo_unique_idx
  on public.avisos_financieros (pago_cliente_id, tipo)
  where pago_cliente_id is not null and estado = 'enviado';

create index if not exists avisos_financieros_cliente_fecha_idx
  on public.avisos_financieros (cliente_id, enviado_at desc);

alter table public.avisos_financieros enable row level security;

drop policy if exists "Profesionales gestionan avisos financieros" on public.avisos_financieros;
create policy "Profesionales gestionan avisos financieros"
on public.avisos_financieros
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

drop policy if exists "Clientes consultan sus avisos financieros" on public.avisos_financieros;
create policy "Clientes consultan sus avisos financieros"
on public.avisos_financieros
for select
to authenticated
using (
  exists (
    select 1 from public.clientes
    where clientes.id = avisos_financieros.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);
