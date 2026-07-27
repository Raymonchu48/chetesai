-- Chetesaí Fitness+ · ampliación profesional de ejercicios
alter table public.ejercicios
  add column if not exists gif_url text,
  add column if not exists miniatura_url text,
  add column if not exists tipo_movimiento text,
  add column if not exists lateralidad text,
  add column if not exists plano_movimiento text,
  add column if not exists articulacion_principal text,
  add column if not exists etiquetas text[] not null default '{}';

alter table public.ejercicios
  drop constraint if exists ejercicios_tipo_movimiento_check,
  add constraint ejercicios_tipo_movimiento_check
    check (tipo_movimiento is null or tipo_movimiento in ('empuje', 'traccion', 'bisagra', 'sentadilla', 'zancada', 'rotacion', 'anti_rotacion', 'locomocion', 'aislamiento', 'movilidad'));

alter table public.ejercicios
  drop constraint if exists ejercicios_lateralidad_check,
  add constraint ejercicios_lateralidad_check
    check (lateralidad is null or lateralidad in ('bilateral', 'unilateral', 'alterno'));

alter table public.ejercicios
  drop constraint if exists ejercicios_plano_movimiento_check,
  add constraint ejercicios_plano_movimiento_check
    check (plano_movimiento is null or plano_movimiento in ('horizontal', 'vertical', 'sagital', 'frontal', 'transversal', 'multiplanar'));

create index if not exists ejercicios_tipo_movimiento_idx on public.ejercicios(tipo_movimiento);
create index if not exists ejercicios_lateralidad_idx on public.ejercicios(lateralidad);
create index if not exists ejercicios_etiquetas_gin_idx on public.ejercicios using gin(etiquetas);
