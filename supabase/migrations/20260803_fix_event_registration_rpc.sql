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
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     and not exists (
       select 1 from public.profiles
       where profiles.id = auth.uid()
         and profiles.activo = true
         and profiles.role in ('administrador', 'profesional')
     )
     and not exists (
       select 1 from public.clientes
       where clientes.id = p_cliente_id
         and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
     ) then
    raise exception 'No autorizado';
  end if;

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
    and cliente_id <> p_cliente_id
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
  elsif v_estado = 'confirmada' and v_evento.estado = 'completo' then
    update public.eventos set estado = 'publicado', updated_at = now()
    where id = p_evento_id;
  end if;

  v_disponibles := greatest(
    v_evento.aforo - v_confirmadas - case when v_estado = 'confirmada' then 1 else 0 end,
    0
  );

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
  if coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     and not exists (
       select 1 from public.profiles
       where profiles.id = auth.uid()
         and profiles.activo = true
         and profiles.role in ('administrador', 'profesional')
     )
     and not exists (
       select 1 from public.clientes
       where clientes.id = p_cliente_id
         and lower(clientes.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
     ) then
    raise exception 'No autorizado';
  end if;

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

  if not found or v_estado_anterior = 'cancelada' then
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
