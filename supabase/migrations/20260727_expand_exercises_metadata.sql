-- Chetesaí Fitness+ · ficha profesional definitiva de ejercicios
alter table public.ejercicios
  add column if not exists nombre_alternativo text,
  add column if not exists codigo_interno text,
  add column if not exists gif_url text,
  add column if not exists miniatura_url text,
  add column if not exists tipo_movimiento text,
  add column if not exists lateralidad text,
  add column if not exists plano_movimiento text,
  add column if not exists articulacion_principal text,
  add column if not exists musculos_estabilizadores text[] not null default '{}',
  add column if not exists subcategoria text,
  add column if not exists posicion_inicial text,
  add column if not exists pasos_ejecucion text,
  add column if not exists respiracion text,
  add column if not exists tempo_recomendado text,
  add column if not exists rango_movimiento text,
  add column if not exists contraindicaciones text,
  add column if not exists nivel_tecnico text,
  add column if not exists riesgo_lesion text,
  add column if not exists material_alternativo text,
  add column if not exists apto_casa boolean not null default false,
  add column if not exists apto_gimnasio boolean not null default true,
  add column if not exists variante_facil text,
  add column if not exists variante_avanzada text,
  add column if not exists regresion text,
  add column if not exists progresion text,
  add column if not exists etiquetas text[] not null default '{}',
  add column if not exists objetivos text[] not null default '{}',
  add column if not exists ia_contexto jsonb not null default '{}'::jsonb;

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

alter table public.ejercicios
  drop constraint if exists ejercicios_riesgo_lesion_check,
  add constraint ejercicios_riesgo_lesion_check
    check (riesgo_lesion is null or riesgo_lesion in ('bajo', 'medio', 'alto'));

create unique index if not exists ejercicios_codigo_interno_unique
  on public.ejercicios(codigo_interno)
  where codigo_interno is not null;
create index if not exists ejercicios_tipo_movimiento_idx on public.ejercicios(tipo_movimiento);
create index if not exists ejercicios_lateralidad_idx on public.ejercicios(lateralidad);
create index if not exists ejercicios_articulacion_idx on public.ejercicios(articulacion_principal);
create index if not exists ejercicios_etiquetas_gin_idx on public.ejercicios using gin(etiquetas);
create index if not exists ejercicios_objetivos_gin_idx on public.ejercicios using gin(objetivos);