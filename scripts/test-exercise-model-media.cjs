// Run: node scripts/test-exercise-model-media.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const root = require('node:path').resolve(__dirname, '..');
function load(path, mocks = {}, globals = {}) {
  const code = ts.transpileModule(fs.readFileSync(`${root}/${path}`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => name in mocks ? mocks[name] : require(name),
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://storage.test', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public', SUPABASE_SERVICE_ROLE_KEY: 'server' } },
    console, Response, FormData, ...globals });
  return module.exports;
}
async function main() {
  const rows = { one: { id: 'one', imagen_url: 'old-man', imagen_mujer_url: 'old-woman', video_url: 'old-video' } };
  const patches = [];
  const route = load('src/app/api/ejercicios/media/route.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'session' }) }) },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  }, { fetch: async (url, init = {}) => {
    if (url.endsWith('/auth/v1/user')) return Response.json({ id: 'professional' });
    if (url.includes('/profiles?')) return Response.json([{ role: 'profesional', activo: true }]);
    if (init.method === 'HEAD') return new Response(null, { status: 200 });
    if (init.method === 'PATCH') {
      const id = decodeURIComponent(url.split('id=eq.')[1]);
      const patch = JSON.parse(init.body);
      patches.push(patch);
      if (!rows[id]) return Response.json([]);
      Object.assign(rows[id], patch);
      return Response.json([rows[id]]);
    }
    throw new Error('Unexpected request ' + url);
  } });
  for (const [model, field, other] of [['mujer', 'imagen_mujer_url', 'imagen_url'], ['hombre', 'imagen_url', 'imagen_mujer_url'], [undefined, 'imagen_url', 'imagen_mujer_url']]) {
    const before = rows.one[other];
    const result = await route.POST({ json: async () => ({ action: 'finalize', kind: 'imagen', path: 'squat/imagen-123-abcdef12.png', exerciseId: 'one', visualModel: model }) });
    assert.equal(result.status, 200);
    assert.deepEqual(Object.keys(patches.at(-1)), [field]);
    assert.equal(rows.one[other], before);
    assert.equal(rows.one.video_url, 'old-video');
  }
  assert.equal((await route.POST({ json: async () => ({ action: 'finalize', visualModel: 'invalid' }) })).status, 400);
  assert.equal((await route.POST({ json: async () => ({ action: 'finalize', kind: 'imagen', path: 'squat/imagen-123-abcdef12.png', exerciseId: 'missing', visualModel: 'mujer' }) })).status, 500);

  for (const model of ['mujer', 'hombre']) {
    const requests = [];
    let uploaded;
    const Uploader = load('src/components/ExerciseMediaUploader.tsx', {
      react: { useRef: () => ({ current: null }), useState: () => [false, () => {}] },
      'lucide-react': { Upload: 'svg', Loader2: 'svg' }, '@/components/ui/button': { Button: 'button' }, '@/components/ui/label': { Label: 'label' },
      sonner: { toast: { error: message => { throw new Error(message); }, success: () => {} } },
    }, { fetch: async (url, init) => {
      if (url === 'https://signed.test') { assert.equal(init.headers['x-upsert'], 'false'); return new Response(); }
      const body = JSON.parse(init.body); requests.push(body);
      return Response.json({ ok: true, data: body.action === 'sign' ? { signedUrl: 'https://signed.test', path: 'new-path' } : { url: 'new-image' } });
    } }).default;
    const tree = Uploader({ kind: 'imagen', label: 'Imagen', exerciseName: 'Squat', exerciseId: 'one', visualModel: model, value: null, compact: true, onUploaded: url => { uploaded = url; } });
    const input = tree.props.children[0];
    await input.props.onChange({ target: { files: [new File(['test'], 'test.png', { type: 'image/png' })] } });
    assert.equal(uploaded, 'new-image');
    assert.equal(requests.length, 2);
    for (const request of requests) { assert.equal(request.visualModel, model); assert.equal(request.exerciseId, 'one'); }
  }
  const Visual = load('src/components/exercises/ExerciseMediaVisual.tsx', {
    '@/components/exercises/LegCardSpriteVisual': { default: 'sprite', getFinalLegTile: () => -1 },
    '@/components/exercises/ProfessionalExerciseVisual': { default: 'illustration' },
  }).default;
  const item = { nombre: 'Squat', grupo_muscular: 'piernas', imagen_url: 'man', imagen_mujer_url: 'woman' };
  assert.equal(Visual({ item, visualModel: 'mujer' }).props.src, 'woman');
  assert.equal(Visual({ item, visualModel: 'hombre' }).props.src, 'man');
  assert.equal(Visual({ item: { ...item, imagen_mujer_url: null }, visualModel: 'mujer' }).props.visualModel, 'mujer');

  const source = fs.readFileSync(`${root}/src/app/ejercicios/entrenamiento/page.tsx`, 'utf8');
  const fn = source.match(/  function updateExerciseImage[\s\S]*?\n  }/)[0];
  let items = [{ _id: 'one', imagen_url: 'man' }, { _id: 'two', imagen_url: 'other' }];
  let selected = items[1];
  const update = vm.runInNewContext(ts.transpile(`(${fn.trim()})`), {
    setItems: fn => { items = fn(items); }, setSelected: fn => { selected = fn(selected); },
  });
  update('one', 'mujer', 'woman');
  assert.equal(items[0].imagen_url, 'man');
  assert.equal(items[0].imagen_mujer_url, 'woman');
  assert.equal(selected._id, 'two');
  assert.equal(selected.imagen_url, 'other');
  console.log('PASS: upload requests, API persistence isolation, legacy uploads, model rendering, missing exercise, and navigation during upload');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
