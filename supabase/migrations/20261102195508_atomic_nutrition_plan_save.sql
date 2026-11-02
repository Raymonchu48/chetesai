-- All professional saves share a client lock. A failed publication rolls back
-- both the previous plan's finalization and the new plan's content/status.
create or replace function public.save_nutrition_plan(
  p_cliente_id uuid,
  p_plan_id uuid,
  p_payload jsonb,
  p_actor_id uuid,
  p_publicar boolean default false
)
returns setof public.planes_nutricionales
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_plan public.planes_nutricionales%rowtype;
  v_data public.planes_nutricionales%rowtype;
  v_estado text := 'borrador';
  v_consent boolean;
begin
  -- Always lock in the same order, including draft saves and active edits.
  perform 1 from public.clientes where id = p_cliente_id for update;
  if not found then
    raise exception 'Cliente no encontrado' using errcode = 'P0002';
  end if;

  if p_plan_id is not null then
    select * into v_plan from public.planes_nutricionales
      where id = p_plan_id and cliente_id = p_cliente_id for update;
    if not found then
      raise exception 'Plan no encontrado para este cliente' using errcode = 'P0002';
    end if;
    if v_plan.estado not in ('activo', 'borrador') then
      raise exception 'Este plan ya está finalizado. Recarga los planes antes de continuar.' using errcode = 'P0001';
    end if;
    v_estado := v_plan.estado;
  end if;

  if p_publicar or v_estado = 'activo' then
    select granted into v_consent from public.privacy_consent_events
      where cliente_id = p_cliente_id and consent_type = 'health_data'
      order by recorded_at desc, id desc limit 1;
    if v_consent is distinct from true then
      raise exception 'Consentimiento requerido para tratar datos de salud' using errcode = 'P0001';
    end if;
  end if;

  v_data := jsonb_populate_record(null::public.planes_nutricionales, p_payload);
  if p_publicar then
    v_estado := 'activo';
    update public.planes_nutricionales set estado = 'finalizado', updated_at = now()
      where cliente_id = p_cliente_id and estado = 'activo'
        and (p_plan_id is null or id <> p_plan_id);
  end if;

  if p_plan_id is null then
    return query insert into public.planes_nutricionales (
      cliente_id,nombre,objetivo,calorias_objetivo,proteinas_g,carbohidratos_g,
      grasas_g,agua_ml,recomendaciones,comidas,fecha_inicio,fecha_fin,estado,created_by
    ) values (
      p_cliente_id,v_data.nombre,v_data.objetivo,v_data.calorias_objetivo,
      v_data.proteinas_g,v_data.carbohidratos_g,v_data.grasas_g,v_data.agua_ml,
      v_data.recomendaciones,v_data.comidas,v_data.fecha_inicio,v_data.fecha_fin,v_estado,p_actor_id
    ) returning *;
  else
    return query update public.planes_nutricionales set
      nombre = v_data.nombre, objetivo = v_data.objetivo,
      calorias_objetivo = v_data.calorias_objetivo, proteinas_g = v_data.proteinas_g,
      carbohidratos_g = v_data.carbohidratos_g, grasas_g = v_data.grasas_g,
      agua_ml = v_data.agua_ml, recomendaciones = v_data.recomendaciones,
      comidas = v_data.comidas, fecha_inicio = v_data.fecha_inicio,
      fecha_fin = v_data.fecha_fin, estado = v_estado, updated_at = now()
      where id = p_plan_id and cliente_id = p_cliente_id returning *;
  end if;
end;
$$;

-- The authenticated professional API validates the actor and cleans the payload.
-- Never expose this service operation directly to browser JWTs.
revoke all on function public.save_nutrition_plan(uuid,uuid,jsonb,uuid,boolean) from public, anon, authenticated;
grant execute on function public.save_nutrition_plan(uuid,uuid,jsonb,uuid,boolean) to service_role;
