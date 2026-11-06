import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "exercise-media";
const prefix = `/storage/v1/object/public/${bucket}/`;
const maxImageBytes = 12 * 1024 * 1024;
const quality = 92;

type Candidate = { path: string; exerciseId: string; name: string; field: string; url: string };

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

async function requireAdministrator() {
  if (!apiUrl || !anonKey || !serviceKey) throw new Error("Servicio no configurado");
  const token = (await cookies()).get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");
  const userResponse = await fetch(`${apiUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("No autenticado");
  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) throw new Error("No autenticado");
  const profileResponse = await fetch(
    `${apiUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" }
  );
  if (!profileResponse.ok) throw new Error("No autorizado");
  const profiles = (await profileResponse.json()) as Array<{ role?: string; activo?: boolean }>;
  if (profiles[0]?.role !== "administrador" || profiles[0]?.activo !== true) {
    throw new Error("No autorizado");
  }
}

async function candidates(): Promise<Candidate[]> {
  if (!apiUrl || !serviceKey) throw new Error("Servicio no configurado");
  const response = await fetch(
    `${apiUrl}/rest/v1/ejercicios?select=id,nombre,imagen_url,imagen_mujer_url,miniatura_url&limit=1000`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" }
  );
  if (!response.ok) throw new Error("No se pudo consultar el catálogo de ejercicios");
  const rows = (await response.json()) as Array<{
    id: string; nombre: string; imagen_url?: string | null; imagen_mujer_url?: string | null; miniatura_url?: string | null;
  }>;
  const results: Candidate[] = [];
  for (const item of rows) {
    for (const field of ["imagen_url", "imagen_mujer_url", "miniatura_url"] as const) {
      const url = item[field];
      if (!url) continue;
      let parsed: URL;
      try { parsed = new URL(url); } catch { continue; }
      if (parsed.origin !== new URL(apiUrl).origin || !parsed.pathname.startsWith(prefix)) continue;
      const path = decodeURIComponent(parsed.pathname.slice(prefix.length));
      if (!/^[a-z0-9-]+\/[a-z0-9-]+\.(png|jpe?g)$/i.test(path)) continue;
      results.push({ path, exerciseId: item.id, name: item.nombre, field, url });
    }
  }
  return results.sort((a, b) => a.name.localeCompare(b.name, "es") || a.field.localeCompare(b.field));
}

async function analyze(candidate: Candidate, includePreview: boolean) {
  if (!apiUrl || !serviceKey) throw new Error("Servicio no configurado");
  const storagePath = candidate.path.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`${apiUrl}/storage/v1/object/${bucket}/${storagePath}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Descarga Storage HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  if (!body.length || body.length > maxImageBytes) throw new Error("Archivo vacío o superior a 12 MB");
  const original = sharp(body, { limitInputPixels: 25_000_000 });
  const meta = await original.metadata();
  if (!meta.width || !meta.height || !["png", "jpeg"].includes(meta.format || "")) {
    throw new Error("Formato o dimensiones no válidas");
  }
  // Flatten transparent areas on white, matching the approved image trial.
  const optimized = await sharp(body, { limitInputPixels: 25_000_000 })
    .flatten({ background: "#ffffff" })
    .webp({ quality, effort: 5 }).toBuffer();
  const newMeta = await sharp(optimized).metadata();
  if (newMeta.width !== meta.width || newMeta.height !== meta.height) {
    throw new Error("La conversión ha cambiado la resolución");
  }
  // Compare the decoded raster, not just file sizes, at equal sample dimensions.
  const sampling = { width: 256, height: 256, fit: "fill" as const };
  const basePixels = await sharp(body).flatten({ background: "#ffffff" })
    .resize(sampling.width, sampling.height, { fit: sampling.fit }).removeAlpha().raw().toBuffer();
  const newPixels = await sharp(optimized).resize(sampling.width, sampling.height, { fit: sampling.fit })
    .removeAlpha().raw().toBuffer();
  let squaredError = 0;
  for (let i = 0; i < basePixels.length; i++) {
    const delta = basePixels[i] - newPixels[i];
    squaredError += delta * delta;
  }
  const mse = squaredError / basePixels.length;
  const psnr = mse === 0 ? 99 : 10 * Math.log10((255 * 255) / mse);
  const savingPct = Number(((1 - optimized.length / body.length) * 100).toFixed(1));
  // PSNR is a coarse objective gate; legibility of fine labels still needs visual review.
  const passed = savingPct >= 15 && psnr >= 36;
  return {
    exerciseId: candidate.exerciseId,
    name: candidate.name,
    field: candidate.field,
    path: candidate.path,
    originalBytes: body.length,
    optimizedBytes: optimized.length,
    savingPct,
    width: meta.width,
    height: meta.height,
    psnr: Number(psnr.toFixed(2)),
    passed,
    notes: passed ? "Apta para revisión visual" : "Revisión manual necesaria",
    ...(includePreview ? { originalUrl: candidate.url, previewDataUrl: `data:image/webp;base64,${optimized.toString("base64")}` } : {}),
  };
}

export async function GET() {
  try {
    await requireAdministrator();
    const all = await candidates();
    return NextResponse.json({ ok: true, data: all, count: all.length, readOnly: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "No se pudo consultar";
    return jsonError(msg, msg === "No autenticado" ? 401 : msg === "No autorizado" ? 403 : 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdministrator();
    const body = (await request.json()) as { action?: string; paths?: unknown };
    if (body.action !== "analyze" || !Array.isArray(body.paths) || body.paths.length < 1 || body.paths.length > 20) {
      return jsonError("Solo se permite analizar entre 1 y 20 imágenes", 400);
    }
    const all = await candidates();
    const byPath = new Map(all.map((c) => [c.path, c]));
    const requested = body.paths;
    if (requested.some((p) => typeof p !== "string" || !byPath.has(p)) || new Set(requested).size !== requested.length) {
      return jsonError("La selección contiene archivos no vinculados o repetidos", 400);
    }
    const results = [];
    for (const path of requested as string[]) {
      try { results.push(await analyze(byPath.get(path)!, requested.length === 1)); }
      catch (error) {
        results.push({ path, passed: false, error: error instanceof Error ? error.message : "Error al procesar" });
      }
    }
    return NextResponse.json({
      ok: true,
      readOnly: true,
      quality,
      processed: results.length,
      passed: results.filter((r) => r.passed).length,
      data: results,
      message: "Solo análisis: no se ha subido, reemplazado ni eliminado ningún archivo.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error durante el análisis";
    return jsonError(msg, msg === "No autenticado" ? 401 : msg === "No autorizado" ? 403 : 500);
  }
}
