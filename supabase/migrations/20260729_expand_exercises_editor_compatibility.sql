-- Chetesaí Fitness+ · compatibilidad del editor visual de rutinas
-- Esta migración es idempotente y puede ejecutarse varias veces.

alter table public.ejercicios
  add column if not exists nombre_alternativo text,
  add column if not exists codigo_interno text,
  add column if not exists musculos_estabilizadores text,
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
  add column if not exists imagen_url text,
  add column if not exists miniatura_url text,
  add column if not exists gif_url text,
  add column if not exists video_url text,
  add column if not exists tipo_movimiento text,
  add column if not exists lateralidad text,
  add column if not exists plano_movimiento text,
  add column if not exists articulacion_principal text,
  add column if not exists variante_facil text,
  add column if not exists variante_avanzada text,
  add column if not exists regresion text,
  add column if not exists progresion text,
  add column if not exists etiquetas text[] not null default '{}',
  add column if not exists objetivos text[] not null default '{}',
  add column if not exists contexto_ia jsonb not null default '{}'::jsonb;

create index if not exists ejercicios_codigo_interno_idx
  on public.ejercicios(codigo_interno);

create index if not exists ejercicios_tipo_movimiento_idx
  on public.ejercicios(tipo_movimiento);

create index if not exists ejercicios_lateralidad_idx
  on public.ejercicios(lateralidad);

create index if not exists ejercicios_etiquetas_gin_idx
  on public.ejercicios using gin(etiquetas);

create index if not exists ejercicios_objetivos_gin_idx
  on public.ejercicios using gin(objetivos);

create index if not exists ejercicios_contexto_ia_gin_idx
  on public.ejercicios using gin(contexto_ia);

comment on column public.ejercicios.miniatura_url is
  'Miniatura utilizada por la biblioteca y el editor visual de rutinas';
comment on column public.ejercicios.gif_url is
  'Demostración animada opcional del ejercicio';
comment on column public.ejercicios.contexto_ia is
  'Metadatos estructurados para recomendaciones futuras de Chetesaí IA';
