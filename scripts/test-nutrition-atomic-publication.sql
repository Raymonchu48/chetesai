-- Synthetic fixtures only. Always roll back; never publish a real client's plan.
begin;
do $$
declare
  c uuid;
  foreign_client uuid;
  old_id uuid;
  draft_id uuid;
  new_id uuid;
  saved public.planes_nutricionales%rowtype;
  payload jsonb;
begin
  if has_function_privilege('anon', 'public.save_nutrition_plan(uuid,uuid,jsonb,uuid,boolean)', 'execute')
    or has_function_privilege('authenticated', 'public.save_nutrition_plan(uuid,uuid,jsonb,uuid,boolean)', 'execute') then
    raise exception 'RPC exposed to browser roles';
  end if;
  if not has_function_privilege('service_role', 'public.save_nutrition_plan(uuid,uuid,jsonb,uuid,boolean)', 'execute') then
    raise exception 'RPC unavailable to server';
  end if;

  insert into public.clientes(nombre) values ('TEST transaccional nutrición') returning id into c;
  insert into public.clientes(nombre) values ('TEST otro cliente nutrición') returning id into foreign_client;
  payload := jsonb_build_object('nombre','TEST plan','fecha_inicio',current_date,'calorias_objetivo',2000,
    'comidas',(select jsonb_agg(jsonb_build_object('nombre','Comida ' || n,'alimentos',
      jsonb_build_array(jsonb_build_object('nombre','Bebida de prueba','cantidad_g',200,'unidad_medida','ml'))))
      from generate_series(1,35) n));

  -- Private draft works without consent and ignores forged active status.
  select * into saved from public.save_nutrition_plan(c,null,payload || '{"estado":"activo"}',null,false);
  draft_id := saved.id;
  if saved.estado <> 'borrador' or jsonb_array_length(saved.comidas) <> 35 then raise exception 'Draft altered'; end if;
  begin
    perform public.save_nutrition_plan(c,draft_id,payload,null,true);
    raise exception 'Expected consent rejection';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'Consentimiento requerido%' then raise; end if;
  end;

  insert into public.privacy_consent_events(cliente_id,consent_type,granted,policy_version,legal_text_hash,recorded_at)
    values(c,'health_data',true,'test',repeat('0',64),now());
  insert into public.planes_nutricionales(cliente_id,nombre,estado) values(c,'TEST anterior','activo') returning id into old_id;

  -- A constraint failure after finalizing the old plan must roll everything back.
  begin
    perform public.save_nutrition_plan(c,draft_id,payload || '{"calorias_objetivo":1}',null,true);
    raise exception 'Expected constraint rejection';
  exception when check_violation then null;
  end;
  if (select estado from public.planes_nutricionales where id=old_id) <> 'activo'
    or (select estado from public.planes_nutricionales where id=draft_id) <> 'borrador' then
    raise exception 'Failed save changed previous or draft status';
  end if;

  begin
    perform public.save_nutrition_plan(foreign_client,draft_id,payload,null,true);
    raise exception 'Expected scoped ID rejection';
  exception when no_data_found then null;
  end;
  select * into saved from public.save_nutrition_plan(c,draft_id,payload,null,true);
  if saved.estado <> 'activo' or jsonb_array_length(saved.comidas) <> 35
    or saved.comidas->0->'alimentos'->0->>'unidad_medida' <> 'ml'
    or (select estado from public.planes_nutricionales where id=old_id) <> 'finalizado'
    or (select count(*) from public.planes_nutricionales where cliente_id=c and estado='activo') <> 1 then
    raise exception 'Replacement lost status, meals or units';
  end if;
  -- Repeated publish and ordinary active save keep the same plan active.
  perform public.save_nutrition_plan(c,draft_id,payload,null,true);
  perform public.save_nutrition_plan(c,draft_id,payload,null,false);
  -- Creating and publishing a new plan uses the same replacement transaction.
  select * into saved from public.save_nutrition_plan(c,null,payload,null,true);
  new_id := saved.id;
  if (select estado from public.planes_nutricionales where id=draft_id) <> 'finalizado'
    or (select count(*) from public.planes_nutricionales where cliente_id=c and estado='activo') <> 1 then
    raise exception 'New publication did not replace active plan';
  end if;
  -- A stale editor cannot resurrect the finalized plan.
  begin
    perform public.save_nutrition_plan(c,draft_id,payload,null,false);
    raise exception 'Expected finalized-plan rejection';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'Este plan ya está finalizado%' then raise; end if;
  end;
  insert into public.privacy_consent_events(cliente_id,consent_type,granted,policy_version,legal_text_hash,recorded_at)
    values(c,'health_data',false,'test',repeat('0',64),now()+interval '1 second');
  begin
    perform public.save_nutrition_plan(c,new_id,payload,null,false);
    raise exception 'Expected revoked-consent rejection';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'Consentimiento requerido%' then raise; end if;
  end;
  -- Another private draft remains possible after consent withdrawal.
  perform public.save_nutrition_plan(c,null,payload,null,false);
end;
$$;
rollback;
