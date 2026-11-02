// Run: node scripts/test-nutrition-plan-selection.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load(file, mocks, globals = {}) {
  const mod = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { module: mod, exports: mod.exports, require: name => mocks[name] ?? require(name),
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://db.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test', SUPABASE_SERVICE_ROLE_KEY: 'test' } },
    Response, URL, Date, JSON, Error, encodeURIComponent, ...globals });
  return mod.exports;
}
async function main() {
  let role = 'profesional';
  let consent = true;
  const plans = [
    { id: 'draft', cliente_id: 'client', estado: 'borrador', comidas: Array.from({ length: 35 }, () => ({ nombre: 'Comida', alimentos: [] })) },
    { id: 'active', cliente_id: 'client', estado: 'activo', comidas: [] },
  ];
  const mutations = [];
  const route = load('src/app/api/nutricion/route.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'test-session' }) }) },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '@/lib/privacy-server': { requireConsent: async () => { if (!consent) throw new Error('Consentimiento requerido'); }, getConsentState: async () => ({ health_data: { granted: consent } }), privacyErrorStatus: message => message.startsWith("Consentimiento requerido") ? 409 : 403 },
  }, { fetch: async (url, init = {}) => {
    const parsed = new URL(url);
    if (parsed.pathname === '/auth/v1/user') return Response.json({ id: 'professional' });
    if (parsed.pathname.endsWith('/profiles')) return Response.json([{ role, activo: true }]);
    if (!parsed.pathname.endsWith('/planes_nutricionales')) return Response.json([]);
    assert.equal(parsed.searchParams.get('cliente_id'), init.method === 'POST' ? null : 'eq.client');
    const id = parsed.searchParams.get('id')?.slice(3);
    const selected = id ? plans.filter(plan => plan.id === id) : plans;
    if (init.method === 'PATCH' || init.method === 'POST') {
      const payload = JSON.parse(init.body);
      mutations.push(payload);
      return Response.json([{ id: id || 'new', ...payload }]);
    }
    if (!id) {
      assert.equal(parsed.searchParams.get('estado'), 'in.(borrador,activo)');
      assert.equal(parsed.searchParams.has('limit'), false, 'All selectable plans must be returned');
    }
    return Response.json(selected);
  } });
  const get = query => route.GET({ nextUrl: new URL(`https://app.test/api/nutricion?cliente_id=client${query}`) });
  let response = await get(''); let result = await response.json();
  assert.equal(result.data.planes.length, 2);
  assert.equal(result.data.plan.id, 'draft');
  assert.equal(result.data.plan.comidas.length, 35);
  assert.equal((await (await get('&plan_id=active')).json()).data.plan.id, 'active');
  assert.equal((await get('&plan_id=another-clients-plan')).status, 404);
  assert.equal(mutations.length, 0, 'Reading or selecting must never mutate a plan');
  const post = body => route.POST({ json: async () => ({ action: 'save_plan', cliente_id: 'client', objetivo: 'Test', ...body }) });
  result = await (await post({ id: 'draft', estado: 'activo' })).json();
  assert.equal(result.data.estado, 'borrador', 'Client-supplied status must not activate a draft');
  assert.equal(result.published, false);
  assert.equal((await (await post({})).json()).data.estado, 'borrador');
  assert.equal((await (await post({ id: 'active' })).json()).data.estado, 'activo');
  assert.equal((await (await post({ id: 'draft', publicar: true })).json()).data.estado, 'activo');
  const count = mutations.length;
  assert.equal((await post({ id: 'foreign' })).status, 404);
  role = 'cliente';
  assert.equal((await get('')).status, 403);
  assert.equal((await post({ id: 'draft' })).status, 403);
  assert.equal(mutations.length, count, 'Unauthorized clients cannot write');
  role = 'profesional'; consent = false;
  result = await (await get('')).json();
  assert.equal(result.data.plan.id, 'draft');
  assert.equal(result.data.health_data_consent, false);
  assert.equal(result.data.plan.comidas.length, 35);
  assert.equal((await (await get('&plan_id=active')).json()).data.plan.id, 'active');
  assert.equal((await (await post({ id: 'draft' })).json()).data.estado, 'borrador');
  assert.equal((await (await post({})).json()).data.estado, 'borrador');
  const savedUnits = await (await post({ id: 'draft', comidas: [{ nombre: 'Comida', alimentos: [{ nombre: 'Bebida', cantidad_g: 200, unidad_medida: 'ml', categoria: 'suplementos', macros_no_declarados: true }] }] })).json();
  assert.equal(savedUnits.data.comidas[0].alimentos[0].unidad_medida, 'ml');
  assert.equal(savedUnits.data.comidas[0].alimentos[0].macros_no_declarados, true);
  assert.equal(savedUnits.data.comidas[0].alimentos[0].categoria, 'suplementos');
  const beforeBlockedPublication = mutations.length;
  assert.equal((await post({ id: 'draft', publicar: true })).status, 409);
  assert.equal((await post({ id: 'active' })).status, 409);
  assert.equal((await post({ publicar: true, health_data_consent: true })).status, 409, 'A forged browser consent flag must not authorize publication');
  assert.equal(mutations.length, beforeBlockedPublication, 'No client-visible writes without consent');

  const summary = load('src/app/api/clientes/[id]/resumen/route.ts', {
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
    '../../../../../../lib/supabase-rest': { supabaseRest: async query => query.startsWith('clientes?') ? [{ id: 'client' }] : query.startsWith('planes_nutricionales?') ? plans : [] },
  });
  result = await (await summary.GET({}, { params: Promise.resolve({ id: 'client' }) })).json();
  assert.equal(result.data.plan_nutricional.id, 'active');
  assert.equal(result.data.planes_nutricionales.length, 2);
  assert.match(fs.readFileSync(path.join(root, 'src/app/api/portal/bienestar/route.ts'), 'utf8'), /planes_nutricionales\?cliente_id=eq\.\$\{encoded\}&estado=eq\.activo/);
  console.log('Nutrition: selection, 35-meal draft, scoped IDs, status preservation, explicit publication, authorization, consent and active-only portal passed. No live data was written.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
