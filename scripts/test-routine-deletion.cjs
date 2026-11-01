// Run: node scripts/test-routine-deletion.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(file, mocks, globals = {}) {
  const loadedModule = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module: loadedModule, exports: loadedModule.exports, require: name => mocks[name] ?? require(name),
    Response, Error, JSON, encodeURIComponent,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://database.test', SUPABASE_SERVICE_ROLE_KEY: 'test-only' } },
    ...globals,
  });
  return loadedModule.exports;
}

async function main() {
  const routines = new Map([['active', true], ['inactive', false], ['assigned', true], ['race', true], ['failed', true]]);
  const calls = [];
  const rest = load('lib/supabase-rest.ts', {}, { fetch: async (url, init) => {
    calls.push({ url, ...init });
    const parsed = new URL(url);
    const id = (parsed.searchParams.get('id') || parsed.searchParams.get('rutina_id')).slice(3);
    if (parsed.pathname.endsWith('/cliente_rutinas')) {
      return Response.json(id === 'assigned' ? [{ id: 'assignment' }] : []);
    }
    if (!init.method || init.method === 'GET') {
      return Response.json(routines.has(id) ? [{ id, activa: routines.get(id) }] : []);
    }
    assert.equal(init.method, 'DELETE', 'Deleting a routine must never be a soft-delete PATCH');
    assert.equal(parsed.searchParams.get('select'), 'id');
    assert.equal(init.headers.Prefer, 'return=representation');
    if (id === 'race') return Response.json({ message: 'update or delete violates foreign key constraint "cliente_rutinas_rutina_id_fkey"' }, { status: 409 });
    if (id === 'failed') return Response.json({ message: 'Database unavailable' }, { status: 503 });
    const exists = routines.delete(id);
    return Response.json(exists ? [{ id }] : []);
  } });
  const route = load('src/app/api/rutinas/[id]/route.ts', {
    '../../../../../lib/supabase-rest': rest,
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  });
  const remove = id => route.DELETE({}, { params: Promise.resolve({ id }) });
  for (const id of ['active', 'inactive']) {
    const response = await remove(id);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    assert.equal(routines.has(id), false);
    assert.equal((await route.GET({}, { params: Promise.resolve({ id }) })).status, 404);
  }
  const before = calls.length;
  assert.equal((await remove('assigned')).status, 409);
  assert.equal(calls.length, before + 1, 'Assigned routine must not trigger any delete');
  assert.equal(routines.has('assigned'), true);
  assert.equal((await remove('missing')).status, 404);
  assert.equal((await remove('race')).status, 409);
  assert.equal(routines.has('race'), true);
  assert.equal((await remove('failed')).status, 500);
  assert.equal(routines.has('failed'), true);

  const source = fs.readFileSync(path.join(root, 'src/app/rutinas/page.tsx'), 'utf8');
  const handler = source.match(/  async function deleteRoutine\([\s\S]*?\n  }/)[0];
  let rows = [{ _id: 'active', nombre: 'Rutina de prueba' }];
  let confirmed = false;
  let success = false;
  let errorMessage;
  let requests = 0;
  let responseOk = true;
  const deleteRoutine = vm.runInNewContext(ts.transpile(`(${handler.trim()})`), {
    window: { confirm: () => confirmed }, Error,
    fetch: async () => { requests++; return Response.json(responseOk ? { ok: true } : { ok: false, error: 'Rutina asignada' }, { status: responseOk ? 200 : 409 }); },
    setRutinas: update => { rows = update(rows); }, load: async () => {},
    toast: { success: () => { success = true; }, error: message => { errorMessage = message; } },
  });
  await deleteRoutine(rows[0]);
  assert.equal(requests, 0, 'Cancellation must not send a request');
  confirmed = true;
  responseOk = false;
  await deleteRoutine(rows[0]);
  assert.equal(rows.length, 1, 'Failed deletion must leave the card visible');
  assert.equal(success, false);
  assert.equal(errorMessage, 'Rutina asignada');
  responseOk = true;
  await deleteRoutine(rows[0]);
  assert.equal(rows.length, 0);
  assert.equal(success, true);
  console.log('Routine deletion checks passed (API and UI, simulated database).');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
