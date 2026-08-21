create index if not exists alimentos_creado_por_idx
  on public.alimentos (creado_por)
  where creado_por is not null;
