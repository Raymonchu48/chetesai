-- Chetesaí Fitness+ · endurecimiento de funciones y tablas internas.

-- Fijar un search_path inmutable y mínimo en todas las funciones señaladas.
alter function public.set_updated_at() set search_path = pg_catalog;
alter function public.set_ejercicios_updated_at() set search_path = pg_catalog;
alter function public.set_routine_updated_at() set search_path = pg_catalog;
alter function public.touch_updated_at() set search_path = pg_catalog;
alter function public.handle_new_user() set search_path = pg_catalog;
alter function public.sync_bono_consumption_from_session() set search_path = pg_catalog;
alter function public.inscribir_cliente_evento(uuid, uuid) set search_path = pg_catalog;
alter function public.cancelar_inscripcion_evento(uuid, uuid) set search_path = pg_catalog;

-- Las funciones de trigger solo deben ser invocadas por sus triggers.
revoke execute on function public.set_updated_at() from public, anon, authenticated, service_role;
revoke execute on function public.set_ejercicios_updated_at() from public, anon, authenticated, service_role;
revoke execute on function public.set_routine_updated_at() from public, anon, authenticated, service_role;
revoke execute on function public.touch_updated_at() from public, anon, authenticated, service_role;
revoke execute on function public.handle_new_user() from public, anon, authenticated, service_role;
revoke execute on function public.sync_bono_consumption_from_session() from public, anon, authenticated, service_role;

-- Los RPC de eventos se llaman exclusivamente desde rutas de servidor verificadas.
revoke execute on function public.inscribir_cliente_evento(uuid, uuid) from public, anon, authenticated;
revoke execute on function public.cancelar_inscripcion_evento(uuid, uuid) from public, anon, authenticated;
grant execute on function public.inscribir_cliente_evento(uuid, uuid) to service_role;
grant execute on function public.cancelar_inscripcion_evento(uuid, uuid) to service_role;

-- Estas tablas contienen datos internos y el portal opera mediante el backend con service_role.
revoke all privileges on table
  public.clientes,
  public.cliente_rutinas,
  public.sesiones_entrenamiento,
  public.series_entrenamiento
from anon, authenticated;

drop policy if exists "clientes_server_only" on public.clientes;
create policy "clientes_server_only"
on public.clientes for all to anon, authenticated
using (false) with check (false);

drop policy if exists "cliente_rutinas_server_only" on public.cliente_rutinas;
create policy "cliente_rutinas_server_only"
on public.cliente_rutinas for all to anon, authenticated
using (false) with check (false);

drop policy if exists "sesiones_entrenamiento_server_only" on public.sesiones_entrenamiento;
create policy "sesiones_entrenamiento_server_only"
on public.sesiones_entrenamiento for all to anon, authenticated
using (false) with check (false);

drop policy if exists "series_entrenamiento_server_only" on public.series_entrenamiento;
create policy "series_entrenamiento_server_only"
on public.series_entrenamiento for all to anon, authenticated
using (false) with check (false);
