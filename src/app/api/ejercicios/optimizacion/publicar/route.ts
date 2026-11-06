import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSecret = process.env.MEDIA_MAINTENANCE_SECRET;
const bucket = "exercise-media";
const quality = 92;
const fields = ["imagen_url", "imagen_mujer_url", "miniatura_url"] as const;
type Field = (typeof fields)[number];
type Row = { id: string; nombre: string; imagen_url: string | null; imagen_mujer_url: string | null; miniatura_url: string | null };
type Ref = { exerciseId: string; field: Field; originalUrl: string; newUrl: string };

function errorResponse(message: string, code: number) {
  return NextResponse.json({ ok: false, error: message }, { status: code });
}
function authHeaders(): Record<string,string> {
  if (!base || !service) throw new Error("Supabase no configurado");
  return { apikey: service, Authorization: `Bearer ${service}` };
}
async function authorized(request: NextRequest) {
  const header = request.headers.get("x-media-maintenance-secret");
  if (header && adminSecret) {
    const a = Buffer.from(header);
    const b = Buffer.from(adminSecret);
    if (a.length === b.length && timingSafeEqual(a, b)) return;
  }
  if (!base || !anon || !service) throw new Error("Servicio no configurado");
  const token = (await cookies()).get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");
  const userRes = await fetch(`${base}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store",
  });
  if (!userRes.ok) throw new Error("No autenticado");
  const user = await userRes.json() as { id?: string };
  if (!user.id) throw new Error("No autenticado");
  const roleRes = await fetch(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo&limit=1`, {
    headers: authHeaders(), cache: "no-store",
  });
  if (!roleRes.ok) throw new Error("No autorizado");
  const roles = await roleRes.json() as Array<{ role: string; activo: boolean }>;
  if (roles[0]?.role !== "administrador" || roles[0]?.activo !== true) throw new Error("No autorizado");
}
function objectUrl(path: string) {
  if (!base) throw new Error("Supabase no configurado");
  return `${base}/storage/v1/object/public/${bucket}/${path}`;
}
function safePath(path: string) {
  return /^[a-z0-9-]+\/[a-z0-9-]+\.(png|jpe?g)$/i.test(path) && !path.includes("..");
}
async function rows(): Promise<Row[]> {
  const res = await fetch(`${base}/rest/v1/ejercicios?select=id,nombre,imagen_url,imagen_mujer_url,miniatura_url&limit=1000`, {
    headers: authHeaders(), cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo consultar los ejercicios");
  return await res.json() as Row[];
}
async function previous(path: string) {
  const res = await fetch(`${base}/rest/v1/media_optimization_audit?original_path=eq.${encodeURIComponent(path)}&select=original_path,status,optimized_path&limit=1`, {
    headers: authHeaders(), cache: "no-store",
  });
  if (!res.ok) throw new Error("No se pudo consultar el historial de optimización");
  const previousRows = await res.json() as Array<{ original_path: string; status: string; optimized_path: string }>;
  return previousRows[0] || null;
}
async function publish(path: string) {
  if (!safePath(path)) throw new Error("Ruta no admitida");
  if (await previous(path)) throw new Error("El original ya fue procesado; comprueba el historial");
  const originalUrl = objectUrl(path);
  const references: Ref[] = [];
  const catalog = await rows();
  for (const item of catalog) {
    for (const field of fields) {
      if (item[field] === originalUrl) references.push({ exerciseId: item.id, field, originalUrl, newUrl: "" });
    }
  }
  if (references.length < 1) throw new Error("El archivo no está referenciado; no se puede migrar");
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(`${base}/storage/v1/object/${bucket}/${encodedPath}`, {
    headers: authHeaders(), signal: AbortSignal.timeout(20000), cache: "no-store",
  });
  if (!res.ok) throw new Error(`Descarga Storage HTTP ${res.status}`);
  const original = Buffer.from(await res.arrayBuffer());
  if (original.length < 1 || original.length > 12 * 1024 * 1024) throw new Error("Tamaño original inválido");
  const meta = await sharp(original, { limitInputPixels: 25_000_000 }).metadata();
  if (!meta.width || !meta.height || !["png", "jpeg"].includes(meta.format || "")) throw new Error("Imagen original no válida");
  const webp = await sharp(original, { limitInputPixels: 25_000_000 })
    .flatten({ background: "#ffffff" }).webp({ quality, effort: 5 }).toBuffer();
  const converted = await sharp(webp).metadata();
  if (converted.width !== meta.width || converted.height !== meta.height || converted.format !== "webp") {
    throw new Error("Las dimensiones del WebP son incorrectas");
  }
  const sampling = { width: 256, height: 256, fit: "fill" as const };
  const pixelsA = await sharp(original).flatten({ background: "#ffffff" })
    .resize(sampling.width, sampling.height, { fit: sampling.fit }).removeAlpha().raw().toBuffer();
  const pixelsB = await sharp(webp).resize(sampling.width, sampling.height, { fit: sampling.fit })
    .removeAlpha().raw().toBuffer();
  let sum = 0;
  for (let i = 0; i < pixelsA.length; i++) { const d = pixelsA[i] - pixelsB[i]; sum += d * d; }
  const mse = sum / pixelsA.length;
  const psnr = mse === 0 ? 99 : 10 * Math.log10((255 * 255) / mse);
  const savingPct = Math.round((1 - webp.length / original.length) * 1000) / 10;
  // User-approved example scored 33.81 dB; accept a conservative floor of 32 dB.
  if (psnr < 32 || savingPct < 15) throw new Error(`Calidad insuficiente: PSNR ${psnr.toFixed(2)} dB / ahorro ${savingPct}%`);
  const destPath = path.replace(/\.(png|jpe?g)$/i, `-optimized-q92-${crypto.randomUUID().slice(0,8)}.webp`);
  const newUrl = objectUrl(destPath);
  const destEncoded = destPath.split("/").map(encodeURIComponent).join("/");
  const upload = await fetch(`${base}/storage/v1/object/${bucket}/${destEncoded}`, {
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "image/webp", "x-upsert": "false", "cache-control": "3600" },
    body: new Uint8Array(webp),
    signal: AbortSignal.timeout(20000),
  });
  if (!upload.ok) throw new Error(`Subida WebP HTTP ${upload.status}: ${(await upload.text()).slice(0,140)}`);
  const check = await fetch(newUrl, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(10000) });
  if (!check.ok) throw new Error("El archivo nuevo no es accesible; original intacto");
  const changed: Ref[] = [];
  try {
    for (const ref of references) {
      const patch = await fetch(
        `${base}/rest/v1/ejercicios?id=eq.${encodeURIComponent(ref.exerciseId)}&${ref.field}=eq.${encodeURIComponent(ref.originalUrl)}`,
        {
          method: "PATCH",
          headers: { ...authHeaders(), "Content-Type": "application/json", Prefer: "return=representation" },
          body: JSON.stringify({ [ref.field]: newUrl }),
          cache: "no-store",
        }
      );
      if (!patch.ok) throw new Error(`No se actualizó la referencia ${ref.field}`);
      const result = await patch.json() as Array<{id: string}>;
      if (result.length !== 1) throw new Error("La referencia cambió concurrentemente");
      changed.push({ ...ref, newUrl });
    }
    const audit = await fetch(`${base}/rest/v1/media_optimization_audit`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify({
        original_path: path, optimized_path: destPath, original_bytes: original.length,
        optimized_bytes: webp.length, psnr: Number(psnr.toFixed(2)), quality, refs: changed, status: "published",
      }),
      cache: "no-store",
    });
    if (!audit.ok) throw new Error("La imagen se migró, pero no se pudo guardar el historial");
  } catch (err) {
    // Roll back only the references changed by this request. Original file is NEVER removed.
    for (const ref of changed.reverse()) {
      const rollback = await fetch(
        `${base}/rest/v1/ejercicios?id=eq.${encodeURIComponent(ref.exerciseId)}&${ref.field}=eq.${encodeURIComponent(newUrl)}`,
        { method: "PATCH", headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ [ref.field]: ref.originalUrl }), cache: "no-store" }
      );
      if (!rollback.ok) console.error("Media migration rollback failed", { path, id: ref.exerciseId, field: ref.field });
    }
    throw err;
  }
  return {
    path, optimizedPath: destPath, originalBytes: original.length, optimizedBytes: webp.length,
    savingPct, psnr: Number(psnr.toFixed(2)), width: meta.width, height: meta.height,
    referencesUpdated: changed.length, status: "published", originalPreserved: true,
  };
}

export async function GET(request: NextRequest) {
  try {
    await authorized(request);
    const response = await fetch(`${base}/rest/v1/media_optimization_audit?select=id,original_path,optimized_path,original_bytes,optimized_bytes,psnr,status,created_at,refs&order=created_at.desc&limit=150`, {
      headers: authHeaders(), cache: "no-store",
    });
    if (!response.ok) throw new Error("No se pudo consultar el historial");
    return NextResponse.json({ ok: true, data: await response.json() });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return errorResponse(msg, msg === "No autenticado" ? 401 : msg === "No autorizado" ? 403 : 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await authorized(request);
    const input = (await request.json()) as { action?: string; path?: string };
    if (input.action !== "publish" || typeof input.path !== "string") return errorResponse("Acción inválida", 400);
    const data = await publish(input.path);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de migración";
    console.error("Exercise media migration failed", msg);
    return errorResponse(msg, msg === "No autenticado" ? 401 : msg === "No autorizado" ? 403 : 500);
  }
}
