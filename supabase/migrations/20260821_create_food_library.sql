create table if not exists public.alimentos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null default 'otros',
  marca text,
  estado_preparacion text not null default 'tal_como_se_compra',
  porcion_nombre text not null default '100 g',
  porcion_gramos numeric(8,2) not null default 100,
  energia_kcal numeric(8,2) not null default 0,
  proteinas_g numeric(8,2) not null default 0,
  carbohidratos_g numeric(8,2) not null default 0,
  grasas_g numeric(8,2) not null default 0,
  fibra_g numeric(8,2) not null default 0,
  azucares_g numeric(8,2) not null default 0,
  grasas_saturadas_g numeric(8,2) not null default 0,
  sodio_mg numeric(10,2) not null default 0,
  alergenos text[] not null default '{}',
  etiquetas text[] not null default '{}',
  fuente text not null default 'BEDCA',
  notas text,
  es_personalizado boolean not null default false,
  activo boolean not null default true,
  creado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alimentos_porcion_check check (porcion_gramos > 0 and porcion_gramos <= 5000),
  constraint alimentos_nutrientes_check check (
    energia_kcal >= 0 and proteinas_g >= 0 and carbohidratos_g >= 0 and grasas_g >= 0
    and fibra_g >= 0 and azucares_g >= 0 and grasas_saturadas_g >= 0 and sodio_mg >= 0
  )
);

create unique index if not exists alimentos_catalogo_nombre_idx
  on public.alimentos (lower(nombre), lower(coalesce(marca, '')), estado_preparacion)
  where activo = true;
create index if not exists alimentos_busqueda_idx on public.alimentos (categoria, activo, nombre);

alter table public.alimentos enable row level security;

drop policy if exists "Profesionales consultan alimentos" on public.alimentos;
create policy "Profesionales consultan alimentos"
on public.alimentos for select to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.activo = true
      and profiles.role in ('administrador', 'profesional')
  )
);

drop policy if exists "Profesionales crean alimentos" on public.alimentos;
create policy "Profesionales crean alimentos"
on public.alimentos for insert to authenticated
with check (
  creado_por = (select auth.uid()) and es_personalizado = true
  and exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.activo = true
      and profiles.role in ('administrador', 'profesional')
  )
);

drop policy if exists "Profesionales editan sus alimentos" on public.alimentos;
create policy "Profesionales editan sus alimentos"
on public.alimentos for update to authenticated
using (creado_por = (select auth.uid()) and es_personalizado = true)
with check (creado_por = (select auth.uid()) and es_personalizado = true);

grant select, insert, update on table public.alimentos to authenticated;

insert into public.alimentos
  (nombre, categoria, porcion_nombre, porcion_gramos, energia_kcal, proteinas_g, carbohidratos_g, grasas_g, fibra_g, azucares_g, grasas_saturadas_g, sodio_mg, alergenos, etiquetas, fuente)
values
  ('Avena en copos', 'cereales', '100 g', 100, 379, 13.2, 67.7, 6.5, 10.1, 1.0, 1.2, 6, '{gluten}', '{vegetariano,vegano}', 'BEDCA'),
  ('Arroz blanco cocido', 'cereales', '100 g cocido', 100, 130, 2.7, 28.2, 0.3, 0.4, 0.1, 0.1, 1, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Arroz integral cocido', 'cereales', '100 g cocido', 100, 123, 2.7, 25.6, 1.0, 1.6, 0.2, 0.2, 4, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Pan integral', 'cereales', '100 g', 100, 247, 9.0, 41.0, 3.4, 7.0, 4.5, 0.7, 430, '{gluten}', '{vegetariano}', 'BEDCA'),
  ('Patata cocida', 'tuberculos', '100 g cocida', 100, 87, 1.9, 20.1, 0.1, 1.8, 0.9, 0.0, 4, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Boniato asado', 'tuberculos', '100 g asado', 100, 90, 2.0, 20.7, 0.2, 3.3, 6.5, 0.0, 36, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Pechuga de pollo a la plancha', 'carnes', '100 g cocinada', 100, 165, 31.0, 0.0, 3.6, 0.0, 0.0, 1.0, 74, '{}', '{alto_proteina,sin_gluten}', 'BEDCA'),
  ('Pechuga de pavo', 'carnes', '100 g cocinada', 100, 135, 29.0, 0.0, 1.8, 0.0, 0.0, 0.5, 55, '{}', '{alto_proteina,sin_gluten}', 'BEDCA'),
  ('Ternera magra', 'carnes', '100 g cocinada', 100, 190, 29.0, 0.0, 7.0, 0.0, 0.0, 2.8, 65, '{}', '{alto_proteina,sin_gluten}', 'BEDCA'),
  ('Salmón', 'pescados', '100 g', 100, 208, 20.4, 0.0, 13.4, 0.0, 0.0, 3.1, 59, '{pescado}', '{omega_3,alto_proteina,sin_gluten}', 'BEDCA'),
  ('Merluza', 'pescados', '100 g', 100, 86, 18.0, 0.0, 1.8, 0.0, 0.0, 0.4, 80, '{pescado}', '{alto_proteina,sin_gluten}', 'BEDCA'),
  ('Atún al natural escurrido', 'pescados', '100 g escurrido', 100, 116, 25.5, 0.0, 0.8, 0.0, 0.0, 0.2, 320, '{pescado}', '{alto_proteina,sin_gluten}', 'BEDCA'),
  ('Huevo de gallina', 'huevos', '1 huevo mediano', 60, 143, 12.6, 0.7, 9.5, 0.0, 0.4, 3.1, 142, '{huevo}', '{vegetariano,alto_proteina,sin_gluten}', 'BEDCA'),
  ('Clara de huevo', 'huevos', '100 g', 100, 52, 10.9, 0.7, 0.2, 0.0, 0.7, 0.0, 166, '{huevo}', '{vegetariano,alto_proteina,sin_gluten}', 'BEDCA'),
  ('Leche semidesnatada', 'lacteos', '100 ml', 100, 46, 3.2, 4.8, 1.6, 0.0, 4.8, 1.0, 44, '{leche}', '{vegetariano}', 'BEDCA'),
  ('Yogur natural', 'lacteos', '1 unidad', 125, 63, 3.8, 4.7, 3.5, 0.0, 4.7, 2.3, 46, '{leche}', '{vegetariano,fermentado}', 'BEDCA'),
  ('Queso fresco batido 0%', 'lacteos', '100 g', 100, 46, 8.0, 3.5, 0.2, 0.0, 3.5, 0.1, 50, '{leche}', '{vegetariano,alto_proteina}', 'Etiqueta del fabricante'),
  ('Lentejas cocidas', 'legumbres', '100 g cocidas', 100, 116, 9.0, 20.1, 0.4, 7.9, 1.8, 0.1, 2, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Garbanzos cocidos', 'legumbres', '100 g cocidos', 100, 164, 8.9, 27.4, 2.6, 7.6, 4.8, 0.3, 7, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Tofu firme', 'legumbres', '100 g', 100, 144, 17.3, 2.8, 8.7, 2.3, 0.6, 1.3, 14, '{soja}', '{vegetariano,vegano,alto_proteina,sin_gluten}', 'BEDCA'),
  ('Plátano', 'frutas', '100 g', 100, 89, 1.1, 22.8, 0.3, 2.6, 12.2, 0.1, 1, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Manzana', 'frutas', '100 g', 100, 52, 0.3, 13.8, 0.2, 2.4, 10.4, 0.0, 1, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Naranja', 'frutas', '100 g', 100, 47, 0.9, 11.8, 0.1, 2.4, 9.4, 0.0, 0, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Fresas', 'frutas', '100 g', 100, 32, 0.7, 7.7, 0.3, 2.0, 4.9, 0.0, 1, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Aguacate', 'frutas', '100 g', 100, 160, 2.0, 8.5, 14.7, 6.7, 0.7, 2.1, 7, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Brócoli cocido', 'verduras', '100 g cocido', 100, 35, 2.4, 7.2, 0.4, 3.3, 1.4, 0.1, 41, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Espinaca', 'verduras', '100 g', 100, 23, 2.9, 3.6, 0.4, 2.2, 0.4, 0.1, 79, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Tomate', 'verduras', '100 g', 100, 18, 0.9, 3.9, 0.2, 1.2, 2.6, 0.0, 5, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Aceite de oliva virgen extra', 'grasas', '1 cucharada', 10, 884, 0.0, 0.0, 100.0, 0.0, 0.0, 14.0, 2, '{}', '{vegetariano,vegano,sin_gluten}', 'BEDCA'),
  ('Almendras', 'frutos_secos', '30 g', 30, 579, 21.2, 21.6, 49.9, 12.5, 4.4, 3.8, 1, '{frutos_de_cascara}', '{vegetariano,vegano,sin_gluten}', 'BEDCA')
on conflict do nothing;
