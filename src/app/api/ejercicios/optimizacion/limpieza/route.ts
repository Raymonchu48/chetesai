import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "exercise-media";
const maxBatch = 10;

type Candidate = {
  original_path: string;
  optimized_path: string;
  original_bytes: number;
  optimized_bytes: number;
  original_exists: boolean;
  optimized_exists: boolean;
  exercise_original_refs: number;
  event_original_refs: number;
  webp_current_refs: number;
  status: string;
};
function headers() {
  if (!service || !base) throw new Error("Servidor sin servicio de Storage");
  return { apikey: service, Authorization: `Bearer ${service}` };
}
function fail(message: string, status = 500) {
  return NextResponse.json({ ok: false, error: message }, { status });
}
async function assertAdmin() {
  if (!anon || !service || !base) throw new Error("Servicio no configurado");
  const token = (await cookies()).get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");
  const user = await fetch(`${base}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store",
  });
  if (!user.ok) throw new Error("No autenticado");
  const identity = await user.json() as { id?: string };
  if (!identity.id) throw new Error("No autenticado");
  const res = await fetch(`${base}/rest/v1/profiles?id=eq.${encodeURIComponent(identity.id)}&select=role,activo&limit=1`, {
    headers: headers(), cache: "no-store",
  });
  if (!res.ok) throw new Error("No autorizado");
  const profiles = await res.json() as Array<{ role: string; activo: boolean }>;
  if (profiles[0]?.role !== "administrador" || profiles[0]?.activo !== true) throw new Error("No autorizado");
}
async function selectCandidate(path: string): Promise<Candidate | null> {
  const res = await fetch(
    `${base}/rest/v1/media_cleanup_readiness?original_path=eq.${encodeURIComponent(path)}&select=*&limit=1`,
    { headers: headers(), cache: "no-store" }
  );
  if (!res.ok) throw new Error("No se pudo comprobar el inventario");
  const rows = await res.json() as Candidate[];
  return rows[0] || null;
}
function eligible(row: Candidate | null) {
  return Boolean(
    row && row.status === "published" && row.original_exists && row.optimized_exists
    && row.exercise_original_refs === 0 && row.event_original_refs === 0
    && row.webp_current_refs >= 1
    && /^[a-z0-9-]+\/[a-z0-9-]+\.(png|jpe?g)$/i.test(row.original_path)
    && /^[a-z0-9-]+\/[a-z0-9-]+\.webp$/i.test(row.optimized_path)
  );
}
async function audited(path: string) {
  const res = await fetch(
    `${base}/rest/v1/media_cleanup_log?original_path=eq.${encodeURIComponent(path)}&select=status&limit=1`,
    { headers: headers(), cache: "no-store" }
  );
  if (!res.ok) throw new Error("No se pudo comprobar el registro de limpieza");
  return (await res.json() as Array<{ status: string }>)[0] || null;
}
async function mark(path: string, status: "deleted" | "failed", details: string) {
  const res = await fetch(`${base}/rest/v1/media_cleanup_log?original_path=eq.${encodeURIComponent(path)}`, {
    method: "PATCH",
    headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({ status, details, ...(status === "deleted" ? { deleted_at: new Date().toISOString() } : {}) }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error("El resultado de limpieza no se pudo registrar");
}
async function removeOne(path: string) {
  const candidate = await selectCandidate(path);
  if (!eligible(candidate) || !candidate) throw new Error("La imagen ya no es candidata a eliminación segura");
  if (await audited(path)) throw new Error("La imagen tiene una operación de limpieza previa; requiere revisión manual");

  // Verify actual bytes and decoding of the WEBP substitute before deleting its PNG.
  const filename = candidate.optimized_path.split("/").map(encodeURIComponent).join("/");
  const imageResponse = await fetch(`${base}/storage/v1/object/${bucket}/${filename}`, {
    headers: headers(), cache: "no-store", signal: AbortSignal.timeout(15000),
  });
  if (!imageResponse.ok) throw new Error("La WebP de sustitución no puede descargarse");
  const webp = Buffer.from(await imageResponse.arrayBuffer());
  const meta = await sharp(webp).metadata();
  await sharp(webp).resize({ width: 8 }).raw().toBuffer();
  if (meta.format !== "webp" || !meta.width || !meta.height || webp.length !== candidate.optimized_bytes) {
    throw new Error("La WebP de sustitución no supera las verificaciones");
  }

  // Write a pending audit entry first. Fail closed if it cannot be committed.
  const record = await fetch(`${base}/rest/v1/media_cleanup_log`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      original_path: candidate.original_path, optimized_path: candidate.optimized_path,
      original_bytes: candidate.original_bytes, status: "pending",
      details: "Copia local confirmada por el administrador. Borrado exclusivo del PNG original.",
    }),
    cache: "no-store",
  });
  if (!record.ok) throw new Error("No se pudo registrar la operación antes de borrar");

  try {
    // Supabase Storage API, NOT a direct SQL DELETE against storage.objects.
    const deletion = await fetch(`${base}/storage/v1/object/${bucket}`, {
      method: "DELETE",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: [path] }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!deletion.ok) {
      throw new Error(`Storage rechazó la eliminación HTTP ${deletion.status}: ${(await deletion.text()).slice(0,160)}`);
    }
    const checked = await selectCandidate(path);
    if (!checked || checked.original_exists) throw new Error("Storage respondió correctamente, pero el PNG sigue en el inventario");
    if (!checked.optimized_exists || checked.webp_current_refs < 1) throw new Error("El sustituto WebP dejó de estar disponible");
    await mark(path, "deleted", "PNG eliminado mediante Supabase Storage API; WebP activa verificada.");
    return {
      path,
      optimizedPath: candidate.optimized_path,
      freedBytes: candidate.original_bytes,
      originalRemoved: true,
      replacementAvailable: true,
    };
  } catch (error) {
    try { await mark(path, "failed", error instanceof Error ? error.message : "Error desconocido"); }
    catch (logError) { console.error("No se pudo registrar el error de limpieza", logError); }
    throw error;
  }
}
export async function GET() {
  try {
    await assertAdmin();
    const res = await fetch(
      `${base}/rest/v1/media_cleanup_readiness?select=original_path,optimized_path,original_bytes,optimized_bytes,original_exists,optimized_exists,exercise_original_refs,event_original_refs,webp_current_refs,status&status=eq.published&original_exists=eq.true&optimized_exists=eq.true&exercise_original_refs=eq.0&event_original_refs=eq.0&webp_current_refs=gte.1&order=original_path.asc&limit=1000`,
      { headers: headers(), cache: "no-store" }
    );
    if (!res.ok) throw new Error("No se pudo consultar candidatas");
    const candidates = await res.json() as Candidate[];
    const auditRes = await fetch(`${base}/rest/v1/media_cleanup_log?select=original_path,status,original_bytes&limit=1000`, {
      headers: headers(), cache: "no-store",
    });
    if (!auditRes.ok) throw new Error("No se pudo consultar el histórico");
    const logs = await auditRes.json() as Array<{ original_path: string; status: string; original_bytes: number }>;
    const processed = new Set(logs.map(x => x.original_path));
    const safe = candidates.filter(c => eligible(c) && !processed.has(c.original_path));
    return NextResponse.json({
      ok: true, batchSize: maxBatch,
      remainingCandidates: safe.length,
      estimatedRemainingMiB: Number((safe.reduce((n, c) => n + c.original_bytes, 0) / 1048576).toFixed(2)),
      cleaned: logs.filter(x => x.status === "deleted").length,
      freedMiB: Number((logs.filter(x => x.status === "deleted").reduce((n, c) => n + c.original_bytes, 0) / 1048576).toFixed(2)),
      preview: safe.slice(0, maxBatch).map(c => ({ path: c.original_path, bytes: c.original_bytes })),
      mode: "admin-controlled",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de inventario";
    return fail(message, message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500);
  }
}
export async function POST(request: NextRequest) {
  try {
    await assertAdmin();
    const body = await request.json() as { action?: string; paths?: unknown; backupsConfirmed?: boolean };
    if (body.action !== "cleanup" || body.backupsConfirmed !== true
      || !Array.isArray(body.paths) || body.paths.length < 1 || body.paths.length > maxBatch
      || body.paths.some(x => typeof x !== "string")
      || new Set(body.paths).size !== body.paths.length) {
      return fail("Debes confirmar copias locales y seleccionar entre 1 y 10 PNG originales distintos.", 400);
    }
    const results: Array<{ path: string; ok: boolean; freedBytes?: number; error?: string }> = [];
    for (const path of body.paths as string[]) {
      try {
        const cleaned = await removeOne(path);
        results.push({ path, ok: true, freedBytes: cleaned.freedBytes });
      } catch (error) {
        results.push({ path, ok: false, error: error instanceof Error ? error.message : "Error" });
      }
    }
    return NextResponse.json({
      ok: true, processed: results.length, removed: results.filter(x => x.ok).length,
      freedMiB: Number((results.reduce((n, x) => n + (x.freedBytes || 0), 0) / 1048576).toFixed(2)),
      results, originalsRestorableFromLocalCopy: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error de limpieza";
    return fail(message, message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500);
  }
}
