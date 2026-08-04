alter table public.eventos_comunicaciones
  add column if not exists clave text;

create unique index if not exists eventos_comunicaciones_recordatorio_clave_uidx
  on public.eventos_comunicaciones (evento_id, cliente_id, clave)
  where clave is not null and estado = 'enviado';

comment on column public.eventos_comunicaciones.clave is
  'Clave estable para impedir envíos duplicados, por ejemplo recordatorio_7d o recordatorio_1d.';
