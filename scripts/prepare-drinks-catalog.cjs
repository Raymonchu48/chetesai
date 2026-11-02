// Produces an idempotent INSERT for review. Does not connect to a database.
const fs = require('node:fs');
const path = require('node:path');
const rows = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogo-bebidas-suplementos.json'), 'utf8'));
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
const data = JSON.stringify(rows).replaceAll("'", "''");
process.stdout.write(`insert into public.alimentos (nombre,categoria,marca,estado_preparacion,porcion_nombre,porcion_gramos,energia_kcal,proteinas_g,carbohidratos_g,grasas_g,alergenos,etiquetas,fuente,notas,es_personalizado,activo)
select nombre,categoria,marca,estado_preparacion,porcion_nombre,porcion_gramos,energia_kcal,proteinas_g,carbohidratos_g,grasas_g,alergenos,etiquetas,fuente,notas,es_personalizado,activo
from jsonb_to_recordset('${data}'::jsonb) as x(nombre text,categoria text,marca text,estado_preparacion text,porcion_nombre text,porcion_gramos numeric,energia_kcal numeric,proteinas_g numeric,carbohidratos_g numeric,grasas_g numeric,alergenos text[],etiquetas text[],fuente text,notas text,es_personalizado boolean,activo boolean)
on conflict do nothing returning nombre,categoria,porcion_nombre;`);
