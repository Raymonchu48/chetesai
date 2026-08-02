-- Chetesaí Fitness+ · seguimiento corporal y fotografías de progreso
create table if not exists public.mediciones_corporales (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  fecha date not null default current_date,
  peso_kg numeric(6,2),
  altura_cm numeric(6,2),
  grasa_corporal_pct numeric(5,2),
  masa_muscular_kg numeric(6,2),
  agua_corporal_pct numeric(5,2),
  pecho_cm numeric(6,2),
  cintura_cm numeric(6,2),
  cadera_cm numeric(6,2),
  brazo_izq_cm numeric(6,2),
  brazo_der_cm numeric(6,2),
  muslo_izq_cm numeric(6,2),
  muslo_der_cm numeric(6,2),
  foto_frontal_path text,
  foto_lateral_path text,
  foto_posterior_path text,
  notas_profesional text,
  comentario_cliente text,
  origen text not null default 'profesional' check (origen in ('profesional', 'cliente')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mediciones_peso_check check (peso_kg is null or peso_kg between 20 and 400),
  constraint mediciones_altura_check check (altura_cm is null or altura_cm between 80 and 250),
  constraint mediciones_grasa_check check (grasa_corporal_pct is null or grasa_corporal_pct between 1 and 75),
  constraint mediciones_agua_check check (agua_corporal_pct is null or agua_corporal_pct between 1 and 90)
);

create index if not exists mediciones_corporales_cliente_fecha_idx
  on public.mediciones_corporales (cliente_id, fecha desc, created_at desc);

alter table public.mediciones_corporales enable row level security;

drop policy if exists "Profesionales gestionan mediciones" on public.mediciones_corporales;
create policy "Profesionales gestionan mediciones"
on public.mediciones_corporales
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

drop policy if exists "Clientes consultan sus mediciones" on public.mediciones_corporales;
create policy "Clientes consultan sus mediciones"
on public.mediciones_corporales
for select
to authenticated
using (
  exists (
    select 1 from public.clientes
    where clientes.id = mediciones_corporales.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists "Clientes registran sus mediciones" on public.mediciones_corporales;
create policy "Clientes registran sus mediciones"
on public.mediciones_corporales
for insert
to authenticated
with check (
  origen = 'cliente'
  and exists (
    select 1 from public.clientes
    where clientes.id = mediciones_corporales.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'progress-photos',
  'progress-photos',
  false,
  12582912,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Profesionales gestionan fotos de progreso" on storage.objects;
create policy "Profesionales gestionan fotos de progreso"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'progress-photos'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.activo = true
      and profiles.role in ('administrador', 'profesional')
  )
)
with check (
  bucket_id = 'progress-photos'
  and exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
      and profiles.activo = true
      and profiles.role in ('administrador', 'profesional')
  )
);

drop policy if exists "Clientes consultan sus fotos de progreso" on storage.objects;
create policy "Clientes consultan sus fotos de progreso"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'progress-photos'
  and exists (
    select 1 from public.clientes
    where clientes.id::text = split_part(storage.objects.name, '/', 1)
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);
