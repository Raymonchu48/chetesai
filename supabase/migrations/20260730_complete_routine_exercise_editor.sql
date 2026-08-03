-- Chetesaí Fitness+ · Fase 2.2 definitiva
-- Amplía la configuración avanzada de cada ejercicio dentro de una rutina.

alter table public.rutina_ejercicios
  add column if not exists tipo_serie text not null default 'normal',
  add column if not exists rol_ejercicio text not null default 'principal',
  add column if not exists vueltas integer,
  add column if not exists descanso_entre_vueltas integer,
  add column if not exists series_calentamiento integer not null default 0,
  add column if not exists porcentaje_descarga numeric(5,2),
  add column if not exists pausas_rest_pause integer,
  add column if not exists visible_cliente boolean not null default true;

alter table public.rutina_ejercicios
  drop constraint if exists rutina_ejercicios_tipo_serie_check,
  add constraint rutina_ejercicios_tipo_serie_check
    check (tipo_serie in ('normal', 'superserie', 'triserie', 'circuito', 'dropset', 'rest_pause', 'calentamiento'));

alter table public.rutina_ejercicios
  drop constraint if exists rutina_ejercicios_rol_check,
  add constraint rutina_ejercicios_rol_check
    check (rol_ejercicio in ('principal', 'accesorio', 'activacion', 'tecnica', 'movilidad', 'finisher'));

alter table public.rutina_ejercicios
  drop constraint if exists rutina_ejercicios_vueltas_check,
  add constraint rutina_ejercicios_vueltas_check
    check (vueltas is null or vueltas between 1 and 20);

alter table public.rutina_ejercicios
  drop constraint if exists rutina_ejercicios_calentamiento_check,
  add constraint rutina_ejercicios_calentamiento_check
    check (series_calentamiento between 0 and 10);

alter table public.rutina_ejercicios
  drop constraint if exists rutina_ejercicios_descarga_check,
  add constraint rutina_ejercicios_descarga_check
    check (porcentaje_descarga is null or porcentaje_descarga between 0 and 100);

alter table public.rutina_ejercicios
  drop constraint if exists rutina_ejercicios_rest_pause_check,
  add constraint rutina_ejercicios_rest_pause_check
    check (pausas_rest_pause is null or pausas_rest_pause between 1 and 10);

create index if not exists rutina_ejercicios_tipo_serie_idx
  on public.rutina_ejercicios (tipo_serie);

create index if not exists rutina_ejercicios_rol_idx
  on public.rutina_ejercicios (rol_ejercicio);
