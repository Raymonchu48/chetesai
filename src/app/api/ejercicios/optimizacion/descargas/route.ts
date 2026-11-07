import "server-only";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const chunkSize = 10;
const maxZipBytes = 3_500_000;

type Audit = {
  original_path: string; optimized_path: string; original_bytes: number;
  optimized_bytes: number; psnr: number; quality: number; status: string;
};
type Cleanup = {
  original_path: string; optimized_path: string; original_exists: boolean;
  optimized_exists: boolean; exercise_original_refs: number;
  event_original_refs: number; webp_current_refs: number; status: string;
};
function supabaseHeaders() {
  if (!service || !supabaseUrl) throw new Error("Supabase no configurado");
  return { apikey: service, Authorization: `Bearer ${service}` };
}
async function assertAdmin() {
  if (!supabaseUrl || !anon || !service) throw new Error("Servidor no configurado");
  const token = (await cookies()).get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("No autenticado");
  const user = await userResponse.json() as { id?: string };
  if (!user.id) throw new Error("No autenticado");
  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo&limit=1`,
    { headers: supabaseHeaders(), cache: "no-store" }
  );
  if (!profileResponse.ok) throw new Error("No autorizado");
  const profiles = await profileResponse.json() as Array<{ role?: string; activo?: boolean }>;
  if (profiles[0]?.role !== "administrador" || profiles[0]?.activo !== true) throw new Error("No autorizado");
}
async function getRows<T>(query: string): Promise<T[]> {
  const response = await fetch(`${supabaseUrl}/rest/v1/${query}`, {
    headers: supabaseHeaders(), cache: "no-store",
  });
  if (!response.ok) throw new Error(`No se pudo consultar el inventario (HTTP ${response.status})`);
  return await response.json() as T[];
}
// ZIP store-only format (WebP is already compressed). Each part stays under the
// Vercel function response limit; no third-party archive dependency is needed.
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc32(content: Buffer) {
  let crc = 0xffffffff;
  for (const b of content) crc = crcTable[(crc ^ b) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
function makeZip(entries: Array<{ name: string; data: Buffer }>): Buffer {
  const pieces: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const bytes = entry.data;
    const crc = crc32(bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8
    local.writeUInt16LE(0, 8);      // Store, already-compressed WebP
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(bytes.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    pieces.push(local, name, bytes);

    const cd = Buffer.alloc(46);
    cd.writeUInt32LE(0x02014b50, 0);
    cd.writeUInt16LE(20, 4);
    cd.writeUInt16LE(20, 6);
    cd.writeUInt16LE(0x0800, 8);
    cd.writeUInt16LE(0, 10);
    cd.writeUInt32LE(crc, 16);
    cd.writeUInt32LE(bytes.length, 20);
    cd.writeUInt32LE(bytes.length, 24);
    cd.writeUInt16LE(name.length, 28);
    cd.writeUInt32LE(offset, 42);
    central.push(cd, name);
    offset += local.length + name.length + bytes.length;
  }
  const centralSize = central.reduce((total, item) => total + item.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...pieces, ...central, end]);
}

export async function GET(request: NextRequest) {
  try {
    await assertAdmin();
    const audit = await getRows<Audit>(
      "media_optimization_audit?select=original_path,optimized_path,original_bytes,optimized_bytes,psnr,quality,status&status=in.(published,verified)&order=created_at.asc&limit=1000"
    );
    if (request.nextUrl.searchParams.get("manifest") === "1") {
      const state = await getRows<Cleanup>(
        "media_cleanup_readiness?select=original_path,optimized_path,original_exists,optimized_exists,exercise_original_refs,event_original_refs,webp_current_refs,status&limit=1000"
      );
      const eligible = state.filter(x =>
        x.original_exists && x.optimized_exists && x.exercise_original_refs === 0
        && x.event_original_refs === 0 && x.webp_current_refs >= 1
      );
      return NextResponse.json({
        ok: true, published: audit.length, parts: Math.ceil(audit.length / chunkSize),
        chunkSize, cleanupReviewCandidates: eligible.length,
        cleanupBlocked: state.length - eligible.length,
        possibleSavingsMiB: Number((audit.reduce((acc, x) => acc + x.original_bytes - x.optimized_bytes, 0) / 1048576).toFixed(2)),
        cleanupMode: "read-only",
        warning: "La auditoría de referencias no autoriza borrar originales: descarga y comprueba antes todas las copias y revisa referencias externas.",
      }, { headers: { "Cache-Control": "private, no-store" } });
    }
    const part = Number(request.nextUrl.searchParams.get("part"));
    const parts = Math.ceil(audit.length / chunkSize);
    if (!Number.isInteger(part) || part < 1 || part > parts) {
      return NextResponse.json({ ok: false, error: "Parte de descarga no válida" }, { status: 400 });
    }
    const selected = audit.slice((part - 1) * chunkSize, part * chunkSize);
    const entries: Array<{ name: string; data: Buffer }> = [];
    let size = 0;
    for (const row of selected) {
      const path = row.optimized_path;
      if (!/^[a-z0-9-]+\/[a-z0-9-]+\.webp$/i.test(path)) throw new Error("Ruta inválida en inventario");
      const encoded = path.split("/").map(encodeURIComponent).join("/");
      const response = await fetch(`${supabaseUrl}/storage/v1/object/exercise-media/${encoded}`, {
        headers: supabaseHeaders(), cache: "no-store", signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`No se pudo descargar ${path} (HTTP ${response.status})`);
      const data = Buffer.from(await response.arrayBuffer());
      if (data.length !== row.optimized_bytes || data.subarray(0, 4).toString() !== "RIFF"
          || data.subarray(8, 12).toString() !== "WEBP") {
        throw new Error(`Archivo WebP inválido o tamaño inesperado: ${path}`);
      }
      size += data.length;
      if (size > maxZipBytes) throw new Error("Esta parte excede el límite de Vercel. Reduce el tamaño del lote.");
      entries.push({ name: `chetesai_webp/${path}`, data });
    }
    const manifest = Buffer.from(JSON.stringify({
      project: "Chetesai Fitness+", part, totalParts: parts, files: selected,
      note: "Copia de seguridad de WebP publicadas. Los originales no se han eliminado.",
    }, null, 2), "utf8");
    entries.push({ name: "MANIFIESTO.json", data: manifest });
    const zip = makeZip(entries);
    if (zip.length > 4_000_000) throw new Error("La descarga supera el límite permitido");
    return new NextResponse(new Uint8Array(zip), {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="Chetesai_WebP_parte_${String(part).padStart(2, "0")}_de_${String(parts).padStart(2, "0")}.zip"`,
        "Content-Length": String(zip.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error de exportación";
    return NextResponse.json({ ok: false, error: msg }, {
      status: msg === "No autenticado" ? 401 : msg === "No autorizado" ? 403 : 500,
    });
  }
}
