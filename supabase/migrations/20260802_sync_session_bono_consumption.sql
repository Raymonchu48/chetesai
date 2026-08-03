-- Sincroniza automáticamente las sesiones realizadas con el saldo de bonos.
-- Valoraciones, nutrición y revisiones de progreso no consumen sesiones.

-- Evita que una misma cita quede asociada a más de un consumo.
delete from public.consumos_bono a
using public.consumos_bono b
where a.sesion_id is not null
  and a.sesion_id = b.sesion_id
  and (a.created_at, a.id) < (b.created_at, b.id);

create unique index if not exists consumos_bono_sesion_unique_idx
  on public.consumos_bono (sesion_id)
  where sesion_id is not null;

create or replace function public.sync_bono_consumption_from_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  consumo record;
  bono record;
  fecha_sesion date;
  debe_restaurar boolean := false;
  debe_consumir boolean := false;
  nuevo_consumo integer;
begin
  -- Al eliminar una sesión realizada, restaura cualquier consumo asociado.
  if tg_op = 'DELETE' then
    if old.estado = 'realizada' then
      for consumo in
        select id, bono_cliente_id, cantidad
        from public.consumos_bono
        where sesion_id = old.id
        for update
      loop
        update public.bonos_cliente
        set
          sesiones_consumidas = greatest(0, sesiones_consumidas - consumo.cantidad),
          estado = case
            when estado = 'agotado' then 'activo'
            else estado
          end
        where id = consumo.bono_cliente_id;
      end loop;

      delete from public.consumos_bono
      where sesion_id = old.id;
    end if;

    return old;
  end if;

  -- Si una sesión realizada deja de serlo o cambia de cliente/fecha/tipo,
  -- primero restaura el consumo anterior.
  if tg_op = 'UPDATE' then
    debe_restaurar := old.estado = 'realizada'
      and (
        new.estado <> 'realizada'
        or old.cliente_id is distinct from new.cliente_id
        or (old.inicio_at at time zone 'Europe/Madrid')::date
           is distinct from (new.inicio_at at time zone 'Europe/Madrid')::date
        or old.tipo_sesion is distinct from new.tipo_sesion
      );
  end if;

  if debe_restaurar then
    for consumo in
      select id, bono_cliente_id, cantidad
      from public.consumos_bono
      where sesion_id = old.id
      for update
    loop
      update public.bonos_cliente
      set
        sesiones_consumidas = greatest(0, sesiones_consumidas - consumo.cantidad),
        estado = case
          when estado = 'agotado' then 'activo'
          else estado
        end
      where id = consumo.bono_cliente_id;
    end loop;

    delete from public.consumos_bono
    where sesion_id = old.id;
  end if;

  -- Solo consumen bono los entrenamientos. Las valoraciones iniciales,
  -- nutrición y revisiones de progreso quedan excluidas.
  debe_consumir := new.estado = 'realizada'
    and new.tipo_sesion in ('entrenamiento_personal', 'grupo_reducido', 'online', 'otro')
    and not exists (
      select 1
      from public.consumos_bono
      where sesion_id = new.id
    );

  if not debe_consumir then
    return new;
  end if;

  fecha_sesion := (new.inicio_at at time zone 'Europe/Madrid')::date;

  -- Usa primero el bono activo que antes vence y cuya modalidad encaja.
  select b.*
  into bono
  from public.bonos_cliente b
  where b.cliente_id = new.cliente_id
    and b.estado = 'activo'
    and b.fecha_inicio <= fecha_sesion
    and b.fecha_fin >= fecha_sesion
    and b.sesiones_consumidas < b.sesiones_totales
    and (
      (new.tipo_sesion = 'grupo_reducido' and b.modalidad in ('grupo', 'mixto', 'otro'))
      or (new.tipo_sesion in ('entrenamiento_personal', 'online') and b.modalidad in ('personal', 'mixto', 'otro'))
      or new.tipo_sesion = 'otro'
    )
  order by b.fecha_fin asc, b.created_at asc
  limit 1
  for update skip locked;

  if not found then
    -- La sesión puede cerrarse aunque no exista un bono válido.
    -- No se genera consumo y el profesional podrá regularizarlo después.
    return new;
  end if;

  nuevo_consumo := bono.sesiones_consumidas + 1;

  insert into public.consumos_bono (
    bono_cliente_id,
    sesion_id,
    cantidad,
    concepto,
    fecha,
    created_by
  )
  values (
    bono.id,
    new.id,
    1,
    'Sesión descontada automáticamente: ' || coalesce(new.titulo, 'Entrenamiento'),
    fecha_sesion,
    new.created_by
  )
  on conflict (sesion_id) where sesion_id is not null do nothing;

  if found then
    update public.bonos_cliente
    set
      sesiones_consumidas = nuevo_consumo,
      estado = case
        when nuevo_consumo >= sesiones_totales then 'agotado'
        else 'activo'
      end
    where id = bono.id;
  end if;

  return new;
end;
$$;

drop trigger if exists sesiones_agenda_sync_bono on public.sesiones_agenda;
create trigger sesiones_agenda_sync_bono
after insert or update of estado, cliente_id, inicio_at, tipo_sesion or delete
on public.sesiones_agenda
for each row
execute function public.sync_bono_consumption_from_session();

-- Regulariza sesiones ya marcadas como realizadas antes de crear el trigger.
update public.sesiones_agenda
set estado = estado
where estado = 'realizada';
