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
    console, Response, FormData, URL, crypto: require('node:crypto').webcrypto, ...globals });
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
    if (url.includes('/storage/v1/object/upload/sign/')) {
      assert.equal(init.headers['x-upsert'], 'false');
      return Response.json({ url: '/object/upload/sign/exercise-media/test' });
    }
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

  for (const model of ['mujer', 'hombre']) for (const kind of ['imagen', 'video']) {
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
    const tree = Uploader({ kind, label: 'Recurso', exerciseName: 'Squat', exerciseId: 'one', visualModel: model, value: null, compact: true, onUploaded: url => { uploaded = url; } });
    const input = tree.props.children[0];
    await input.props.onChange({ target: { files: [new File(['test'], kind === 'video' ? 'test.mp4' : 'test.png', { type: kind === 'video' ? 'video/mp4' : 'image/png' })] } });
    assert.equal(uploaded, 'new-image');
    assert.equal(requests.length, 2);
    for (const request of requests) { assert.equal(request.visualModel, model); assert.equal(request.exerciseId, 'one'); assert.equal(request.kind, kind); }
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
  for (const [model, field, other] of [['mujer', 'video_mujer_url', 'video_url'], ['hombre', 'video_url', 'video_mujer_url'], [undefined, 'video_url', 'video_mujer_url']]) {
    const before = rows.one[other];
    const result = await route.POST({ json: async () => ({ action: 'finalize', kind: 'video', path: 'squat/video-123-abcdef12.mp4', exerciseId: 'one', visualModel: model }) });
    assert.equal(result.status, 200);
    assert.deepEqual(Object.keys(patches.at(-1)), [field]);
    assert.equal(rows.one[other], before);
  }
  const media = load('src/lib/exercise-visual-variants.ts');
  const example = { nombre: 'Squat', grupo_muscular: 'piernas', video_url: 'https://test/man.mp4', video_mujer_url: 'https://test/woman.mp4' };
  assert.equal(media.getExerciseVisualVariants(example, 'hombre')[0].video_url, example.video_url);
  assert.equal(media.getExerciseVisualVariants(example, 'mujer')[0].video_url, example.video_mujer_url);
  assert.equal(media.getExerciseVisualVariants({ ...example, video_mujer_url: null }, 'mujer')[0].video_url, null);
  const context = { variantes_visuales: [{ id: 'one', nombre: 'Pies altos', video_url: example.video_url, video_mujer_url: example.video_mujer_url }] };
  const roundTrip = media.withExerciseVisualVariants(context, media.parseExerciseVisualVariants(context));
  assert.equal(roundTrip.variantes_visuales[0].video_mujer_url, example.video_mujer_url);
  assert.equal(media.getExerciseVisualVariants({ ...example, contexto_ia: roundTrip }, 'mujer')[0].video_url, example.video_mujer_url);
  assert.equal(media.getExerciseVisualVariants({ ...example, contexto_ia: { variantes_visuales: [{ nombre: 'Legacy', video_url: example.video_url }] } }, 'mujer')[0].video_url, null);
  const Viewer = load('src/components/exercises/InteractiveExerciseViewer.tsx', {
    '@/lib/exercise-visual-variants': media,
    '@/components/exercises/ExerciseMediaVisual': { default: () => React.createElement('div', { 'data-fallback': true }) },
  }).default;
  const render = (item, visualModel) => require('react-dom/server').renderToStaticMarkup(React.createElement(Viewer, { item, visualModel }));
  assert.match(render(example, 'hombre'), /src="https:\/\/test\/man.mp4"/);
  assert.match(render(example, 'mujer'), /src="https:\/\/test\/woman.mp4"/);
  assert.doesNotMatch(render({ ...example, video_mujer_url: null }, 'mujer'), /<video|man.mp4/);
  assert.match(render({ ...example, contexto_ia: roundTrip }, 'mujer'), /woman.mp4/);
  let memo;
  let memoDeps;
  const SwitchingViewer = load('src/components/exercises/InteractiveExerciseViewer.tsx', {
    react: { useState: init => [init, () => {}], useMemo: (fn, deps) => {
      if (!memoDeps || deps.some((value, index) => value !== memoDeps[index])) { memo = fn(); memoDeps = deps; }
      return memo;
    } },
    '@/lib/exercise-visual-variants': media,
    '@/components/exercises/ExerciseMediaVisual': { default: 'fallback' },
  }).default;
  function player(tree) {
    if (!tree || typeof tree !== 'object') return null;
    if (tree.type === 'video') return tree;
    for (const child of React.Children.toArray(tree.props?.children)) { const found = player(child); if (found) return found; }
    return null;
  }
  assert.equal(player(SwitchingViewer({ item: example, visualModel: 'hombre' })).props.src, example.video_url);
  assert.equal(player(SwitchingViewer({ item: example, visualModel: 'mujer' })).props.src, example.video_mujer_url);
  assert.equal(player(SwitchingViewer({ item: example, visualModel: 'hombre' })).props.src, example.video_url);
  for (const model of ['hombre', 'mujer']) {
    const result = await route.POST({ json: async () => ({ action: 'sign', kind: 'video', exerciseName: 'Squat', visualModel: model, fileType: 'video/mp4', fileSize: 10 }) });
    assert.equal(result.status, 200);
    assert.match((await result.json()).data.path, new RegExp(`^squat-${model}/video-`));
  }
  for (const file of ['src/app/api/ejercicios/route.ts', 'src/app/api/ejercicios/[id]/route.ts']) {
    const calls = [];
    const api = load(file, {
      'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
      [file.includes('[id]') ? '../../../../../lib/supabase-rest' : '../../../../lib/supabase-rest']: { supabaseRest: async (url, init) => { calls.push(JSON.parse(init.body)); return [{ id: 'one' }]; } },
      '@/lib/exercise-visual-variants': media,
    });
    const save = body => file.includes('[id]') ? api.PUT({ json: async () => body }, { params: Promise.resolve({ id: 'one' }) }) : api.POST({ json: async () => body });
    assert.equal((await save({ nombre: 'Squat', grupo_muscular: 'piernas', ...example, contexto_ia: roundTrip })).status, 200);
    assert.equal(calls.at(-1).video_mujer_url, example.video_mujer_url);
    assert.equal(calls.at(-1).contexto_ia.variantes_visuales[0].video_mujer_url, example.video_mujer_url);
    await save({ nombre: 'Squat', grupo_muscular: 'piernas' });
    assert.equal(Object.hasOwn(calls.at(-1), 'video_mujer_url'), false);
  }
  const videoFn = source.match(/  function updateExerciseVideo[\s\S]*?\n  }/)[0];
  const updateVideo = vm.runInNewContext(ts.transpile(`(${videoFn.trim()})`), {
    setItems: fn => { items = fn(items); }, setSelected: fn => { selected = fn(selected); },
  });
  updateVideo('one', 'mujer', 'female-video');
  assert.equal(items[0].video_mujer_url, 'female-video');
  assert.equal(items[0].video_url, undefined);
  assert.equal(selected._id, 'two');
  console.log('PASS: male/female video persistence, legacy isolation, variants round-trip, rendered players, missing female fallback, API saves, navigation during video upload');
  console.log('PASS: upload requests, API persistence isolation, legacy uploads, model rendering, missing exercise, and navigation during upload');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
