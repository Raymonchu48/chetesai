-- Chetesaí Fitness+ · Fase 2.2 · Editor completo de ejercicios
alter table public.rutina_ejercicios
  add column if not exists notas_entrenador text,
  add column if not exists instrucciones_cliente text;

comment on column public.rutina_ejercicios.notas_entrenador is
  'Notas privadas visibles únicamente para el profesional';
comment on column public.rutina_ejercicios.instrucciones_cliente is
  'Indicaciones que se mostrarán al cliente durante el entrenamiento';
