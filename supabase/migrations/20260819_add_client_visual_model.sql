alter table public.clientes
  add column if not exists modelo_visual text not null default 'hombre';

alter table public.clientes
  drop constraint if exists clientes_modelo_visual_check;

alter table public.clientes
  add constraint clientes_modelo_visual_check
  check (modelo_visual in ('hombre', 'mujer'));
