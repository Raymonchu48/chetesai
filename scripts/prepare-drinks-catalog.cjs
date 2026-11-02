// Produces an idempotent INSERT for review. Does not connect to a database.
const fs = require('node:fs');
const path = require('node:path');
const catalog = process.argv[2] || 'catalogo-bebidas-suplementos.json';
const allowed = ['catalogo-bebidas-suplementos.json', 'catalogo-desayunos-meriendas.json', 'catalogo-documento-alimentos.json'];
if (!allowed.includes(catalog)) throw new Error('Unknown catalog');
const rows = JSON.parse(fs.readFileSync(path.join(__dirname, catalog), 'utf8'));
const keys = new Set();
for (const row of rows) {
  const key = `${row.nombre}|${row.marca}`.toLocaleLowerCase('es');
  if (keys.has(key)) throw new Error(`Duplicate: ${key}`);
  keys.add(key);
  if (!/^https:\/\//.test(row.fuente)) throw new Error(`Missing source: ${row.nombre}`);
  if (!row.etiquetas.includes('unidad_ml') && !row.etiquetas.includes('unidad_g')) throw new Error('Missing unit');
  for (const name of ['energia_kcal', 'proteinas_g', 'carbohidratos_g', 'grasas_g', 'porcion_gramos']) {
    if (!Number.isFinite(row[name]) || row[name] < 0) throw new Error(`Invalid ${name}`);
  }
  if (row.porcion_gramos <= 0) throw new Error('Invalid portion');
}
for (const row of rows) {
  for (const field of ["fibra_g","grasas_saturadas_g","sodio_mg"]) {
    if (row[field] !== undefined && (!Number.isFinite(row[field]) || row[field] < 0)) throw new Error('Invalid ' + field);
  }
}
const data = JSON.stringify(rows).replaceAll("'", "''");
process.stdout.write(`insert into public.alimentos (nombre,categoria,marca,estado_preparacion,porcion_nombre,porcion_gramos,energia_kcal,proteinas_g,carbohidratos_g,grasas_g,fibra_g,grasas_saturadas_g,sodio_mg,alergenos,etiquetas,fuente,notas,es_personalizado,activo)
select nombre,categoria,marca,estado_preparacion,porcion_nombre,porcion_gramos,energia_kcal,proteinas_g,carbohidratos_g,grasas_g,coalesce(fibra_g,0),coalesce(grasas_saturadas_g,0),coalesce(sodio_mg,0),alergenos,etiquetas,fuente,notas,es_personalizado,activo
from jsonb_to_recordset('${data}'::jsonb) as x(nombre text,categoria text,marca text,estado_preparacion text,porcion_nombre text,porcion_gramos numeric,energia_kcal numeric,proteinas_g numeric,carbohidratos_g numeric,grasas_g numeric,fibra_g numeric,grasas_saturadas_g numeric,sodio_mg numeric,alergenos text[],etiquetas text[],fuente text,notas text,es_personalizado boolean,activo boolean)
on conflict do nothing returning nombre,categoria,porcion_nombre;`);
