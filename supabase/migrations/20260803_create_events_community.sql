create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null default 'otro'
    check (categoria in ('pilates', 'running', 'nutricion', 'senderismo', 'movilidad', 'taller', 'otro')),
  descripcion text,
  fecha_inicio timestamptz not null,
  fecha_fin timestamptz,
  modalidad text not null default 'presencial'
    check (modalidad in ('presencial', 'online', 'mixta')),
  ubicacion text,
  enlace_online text,
  imagen_url text,
  aforo integer not null default 20 check (aforo between 1 and 500),
  precio numeric(8,2) not null default 0 check (precio >= 0),
  fecha_limite_inscripcion timestamptz,
  estado text not null default 'borrador'
    check (estado in ('borrador', 'publicado', 'completo', 'finalizado', 'cancelado')),
  publicado_at timestamptz,
  invitacion_enviada_at timestamptz,
  ultimo_recordatorio_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eventos_fechas_check check (fecha_fin is null or fecha_fin > fecha_inicio),
  constraint eventos_limite_check check (fecha_limite_inscripcion is null or fecha_limite_inscripcion <= fecha_inicio)
);

create index if not exists eventos_fecha_estado_idx
  on public.eventos (fecha_inicio, estado);

create table if not exists public.inscripciones_eventos (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  cliente_id uuid not null references public.clientes(id) on delete cascade,
  estado text not null default 'confirmada'
    check (estado in ('confirmada', 'lista_espera', 'cancelada', 'asistio', 'no_asistio')),
  origen text not null default 'portal'
    check (origen in ('portal', 'profesional')),
  notas text,
  fecha_inscripcion timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (evento_id, cliente_id)
);

create index if not exists inscripciones_eventos_evento_estado_idx
  on public.inscripciones_eventos (evento_id, estado, fecha_inscripcion);
create index if not exists inscripciones_eventos_cliente_idx
  on public.inscripciones_eventos (cliente_id, fecha_inscripcion desc);

create table if not exists public.eventos_comunicaciones (
  id uuid primary key default gen_random_uuid(),
  evento_id uuid not null references public.eventos(id) on delete cascade,
  cliente_id uuid references public.clientes(id) on delete set null,
  tipo text not null check (tipo in ('invitacion', 'confirmacion', 'lista_espera', 'recordatorio', 'cancelacion', 'cambio')),
  email text not null,
  estado text not null default 'enviado' check (estado in ('enviado', 'error')),
  proveedor_id text,
  error text,
  enviado_at timestamptz not null default now()
);

create index if not exists eventos_comunicaciones_evento_idx
  on public.eventos_comunicaciones (evento_id, tipo, enviado_at desc);

create table if not exists public.preferencias_comunicacion (
  cliente_id uuid primary key references public.clientes(id) on delete cascade,
  eventos_email boolean not null default true,
  recordatorios_email boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.eventos enable row level security;
alter table public.inscripciones_eventos enable row level security;
alter table public.eventos_comunicaciones enable row level security;
alter table public.preferencias_comunicacion enable row level security;

drop policy if exists "Profesionales gestionan eventos" on public.eventos;
create policy "Profesionales gestionan eventos"
on public.eventos for all to authenticated
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

drop policy if exists "Clientes consultan eventos publicados" on public.eventos;
create policy "Clientes consultan eventos publicados"
on public.eventos for select to authenticated
using (estado in ('publicado', 'completo', 'finalizado'));

drop policy if exists "Profesionales gestionan inscripciones" on public.inscripciones_eventos;
create policy "Profesionales gestionan inscripciones"
on public.inscripciones_eventos for all to authenticated
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

drop policy if exists "Clientes consultan sus inscripciones" on public.inscripciones_eventos;
create policy "Clientes consultan sus inscripciones"
on public.inscripciones_eventos for select to authenticated
using (
  exists (
    select 1 from public.clientes
    where clientes.id = inscripciones_eventos.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

drop policy if exists "Profesionales consultan comunicaciones" on public.eventos_comunicaciones;
create policy "Profesionales consultan comunicaciones"
on public.eventos_comunicaciones for all to authenticated
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

drop policy if exists "Clientes gestionan sus preferencias" on public.preferencias_comunicacion;
create policy "Clientes gestionan sus preferencias"
on public.preferencias_comunicacion for all to authenticated
using (
  exists (
    select 1 from public.clientes
    where clientes.id = preferencias_comunicacion.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
)
with check (
  exists (
    select 1 from public.clientes
    where clientes.id = preferencias_comunicacion.cliente_id
      and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

create or replace function public.inscribir_cliente_evento(
  p_evento_id uuid,
  p_cliente_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evento public.eventos%rowtype;
  v_confirmadas integer;
  v_estado text;
  v_inscripcion uuid;
  v_disponibles integer;
begin
  select * into v_evento
  from public.eventos
  where id = p_evento_id
  for update;

  if not found then
    raise exception 'Evento no encontrado';
  end if;

  if v_evento.estado not in ('publicado', 'completo') then
    raise exception 'El evento no admite inscripciones';
  end if;

  if v_evento.fecha_inicio <= now() then
    raise exception 'El evento ya ha comenzado';
  end if;

  if v_evento.fecha_limite_inscripcion is not null
     and v_evento.fecha_limite_inscripcion < now() then
    raise exception 'El plazo de inscripción ha finalizado';
  end if;

  select count(*) into v_confirmadas
  from public.inscripciones_eventos
  where evento_id = p_evento_id
    and estado in ('confirmada', 'asistio');

  v_estado := case when v_confirmadas < v_evento.aforo then 'confirmada' else 'lista_espera' end;

  insert into public.inscripciones_eventos (
    evento_id, cliente_id, estado, origen, fecha_inscripcion, updated_at
  ) values (
    p_evento_id, p_cliente_id, v_estado, 'portal', now(), now()
  )
  on conflict (evento_id, cliente_id)
  do update set
    estado = excluded.estado,
    origen = 'portal',
    fecha_inscripcion = now(),
    updated_at = now()
  returning id into v_inscripcion;

  if v_estado = 'confirmada' and v_confirmadas + 1 >= v_evento.aforo then
    update public.eventos set estado = 'completo', updated_at = now()
    where id = p_evento_id;
  end if;

  v_disponibles := greatest(v_evento.aforo - v_confirmadas - case when v_estado = 'confirmada' then 1 else 0 end, 0);

  return jsonb_build_object(
    'inscripcion_id', v_inscripcion,
    'estado', v_estado,
    'plazas_disponibles', v_disponibles
  );
end;
$$;

create or replace function public.cancelar_inscripcion_evento(
  p_evento_id uuid,
  p_cliente_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_evento public.eventos%rowtype;
  v_estado_anterior text;
  v_promovida uuid;
  v_confirmadas integer;
begin
  select * into v_evento
  from public.eventos
  where id = p_evento_id
  for update;

  if not found then
    raise exception 'Evento no encontrado';
  end if;

  select estado into v_estado_anterior
  from public.inscripciones_eventos
  where evento_id = p_evento_id and cliente_id = p_cliente_id
  for update;

  if not found then
    raise exception 'No existe una inscripción activa';
  end if;

  update public.inscripciones_eventos
  set estado = 'cancelada', updated_at = now()
  where evento_id = p_evento_id and cliente_id = p_cliente_id;

  if v_estado_anterior = 'confirmada' then
    select cliente_id into v_promovida
    from public.inscripciones_eventos
    where evento_id = p_evento_id and estado = 'lista_espera'
    order by fecha_inscripcion asc
    limit 1
    for update skip locked;

    if v_promovida is not null then
      update public.inscripciones_eventos
      set estado = 'confirmada', updated_at = now()
      where evento_id = p_evento_id and cliente_id = v_promovida;
    end if;
  end if;

  select count(*) into v_confirmadas
  from public.inscripciones_eventos
  where evento_id = p_evento_id and estado in ('confirmada', 'asistio');

  if v_evento.estado = 'completo' and v_confirmadas < v_evento.aforo then
    update public.eventos set estado = 'publicado', updated_at = now()
    where id = p_evento_id;
  end if;

  return jsonb_build_object(
    'estado', 'cancelada',
    'cliente_promovido_id', v_promovida,
    'plazas_disponibles', greatest(v_evento.aforo - v_confirmadas, 0)
  );
end;
$$;

grant execute on function public.inscribir_cliente_evento(uuid, uuid) to authenticated;
grant execute on function public.cancelar_inscripcion_evento(uuid, uuid) to authenticated;
