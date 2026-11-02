const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}, globals = {}) {
  const mod = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { module: mod, exports: mod.exports, require: name => mocks[name] ?? require(name),
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://database.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test', SUPABASE_SERVICE_ROLE_KEY: 'test' } },
    Response, URL, Date, JSON, Error, encodeURIComponent, ...globals });
  return mod.exports;
}
async function main() {
  const lib = load('src/lib/nutrition-foods.ts');
  const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, 'catalogo-bebidas-suplementos.json'), 'utf8'));
  assert.equal(catalog.length, 15);
  assert.equal(new Set(catalog.map(row => `${row.nombre}|${row.marca}`)).size, 15);
  assert.equal(lib.foodUnit({ porcion_nombre: '100 ml' }), 'ml', 'Legacy milk is recognized without rewriting old plans');
  assert.equal(lib.foodUnit({}), 'g');
  assert.equal(lib.foodUnit({ unidad_medida: 'g', porcion_nombre: '100 ml' }), 'g', 'Explicit unit wins');
  assert.equal(lib.normalizeFoodSearch('CAFÉ'), lib.normalizeFoodSearch('cafe'));
  const soy = catalog.find(row => row.nombre.includes('soja'));
  assert.equal(lib.foodUnit(soy), 'ml');
  assert.equal(lib.scaleFoodNutrients(soy, 200).energia_kcal, 66);
  assert.equal(lib.scaleFoodNutrients(soy, 200).proteinas_g, 6.6);
  const whey = catalog.find(row => row.nombre.startsWith('Proteína para'));
  assert.equal(lib.scaleFoodNutrients(whey, 24).energia_kcal, 92.9, 'Powder amount is weighed, not drink volume');
  const coffeeMilk = catalog.find(row => row.nombre.startsWith('Café con leche'));
  assert.equal(lib.scaleFoodNutrients(coffeeMilk, 200).energia_kcal, 47.4);
  const unknown = catalog.filter(lib.nutritionUndeclared);
  assert.equal(unknown.length, 3);
  const partial = lib.nutritionTotals([{ ...lib.scaleFoodNutrients(soy, 200) }, { energia_kcal: 999, proteinas_g: 999, carbohidratos_g: 999, grasas_g: 999, macros_no_declarados: true }]);
  assert.equal(partial.kcal, 66);
  assert.equal(partial.incomplete, 1, 'Undeclared macros are not treated as complete zero-energy data');

  let role = 'profesional';
  const writes = [];
  const route = load('src/app/api/alimentos/route.ts', {
    '@/lib/nutrition-foods': lib,
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'session' }) }) },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  }, { fetch: async (url, init = {}) => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith('/user')) return Response.json({ id: 'professional' });
    if (parsed.pathname.endsWith('/profiles')) return Response.json([{ role, activo: true }]);
    if (init.method === 'POST') { const row = JSON.parse(init.body); writes.push(row); return Response.json([{ id: 'custom', ...row }]); }
    return Response.json(catalog);
  } });
  let result = await (await route.GET({ nextUrl: new URL('https://app.test/api/alimentos') })).json();
  assert.equal(result.data.find(row => row.nombre === soy.nombre).unidad_medida, 'ml');
  assert.equal(result.data.filter(row => row.macros_no_declarados).length, 3);
  const post = body => route.POST({ json: async () => ({ nombre: 'Producto de prueba', ...body }) });
  assert.equal((await post({})).status, 400, 'Blank nutrition must not silently become zeros');
  result = await (await post({ unidad_medida: 'ml', energia_kcal: 33, proteinas_g: 3.3, carbohidratos_g: 0, grasas_g: 1.9 })).json();
  assert.ok(result.ok);
  assert.ok(writes.at(-1).etiquetas.includes('unidad_ml'));
  assert.equal(writes.at(-1).porcion_nombre, '100 ml');
  await post({ macros_no_declarados: true });
  assert.ok(writes.at(-1).etiquetas.includes('macros_no_declarados'));
  role = 'cliente';
  const count = writes.length;
  assert.equal((await post({ macros_no_declarados: true })).status, 403);
  assert.equal(writes.length, count);
  console.log('Catalog: 15 sourced entries, g/ml, legacy compatibility, scaling, partial totals, custom product validation and professional access passed. No live data written.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
