import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../../lib/supabase-rest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const idCheck = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function professional() {
  if (!url || !anon || !service) throw new Error("Autenticación no configurada");
  const token = (await cookies()).get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");
  const u = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!u.ok) throw new Error("No autenticado");
  const { id } = await u.json() as { id?: string };
  if (!id) throw new Error("No autenticado");
  const p = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(id)}&select=role,activo&limit=1`, { headers: { apikey: service, Authorization: `Bearer ${service}` }, cache: "no-store" });
  if (!p.ok) throw new Error("No autorizado");
  const profiles = await p.json() as Array<{ role: string; activo: boolean }>;
  if (!profiles[0] || profiles[0].activo === false || !["administrador", "profesional"].includes(profiles[0].role)) throw new Error("No autorizado");
  return id;
}
function responseError(error: unknown) {
  const message = error instanceof Error ? error.message : "Error al procesar valoración";
  return NextResponse.json({ ok: false, error: message }, { status: message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500 });
}
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await professional();
    const { id } = await params;
    if (!idCheck.test(id)) return NextResponse.json({ ok: false, error: "Cliente inválido" }, { status: 400 });
    const data = await supabaseRest<Array<Record<string, unknown>>>(`valoraciones_iniciales?cliente_id=eq.${encodeURIComponent(id)}&select=id,created_at,updated_at,estado,respuestas,observaciones_profesional,consentimiento_salud_confirmado_at&order=created_at.desc&limit=30`);
    return NextResponse.json({ ok: true, data });
  } catch(e) { return responseError(e); }
}
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await professional();
    const { id } = await params;
    if (!idCheck.test(id)) return NextResponse.json({ ok: false, error: "Cliente inválido" }, { status: 400 });
    const { respuestas, observaciones_profesional, estado, consentimiento_salud_confirmado } = await request.json() as { respuestas?: Record<string, unknown>; observaciones_profesional?: string; estado?: string; consentimiento_salud_confirmado?: boolean };
    if (!respuestas || typeof respuestas !== "object" || Array.isArray(respuestas) || JSON.stringify(respuestas).length > 24000) return NextResponse.json({ ok: false, error: "Formulario no válido" }, { status: 400 });
    if (!consentimiento_salud_confirmado) return NextResponse.json({ ok: false, error: "Antes de registrar datos de salud confirma el consentimiento explícito del cliente" }, { status: 400 });
    const clients = await supabaseRest<Array<{ id: string }>>(`clientes?id=eq.${encodeURIComponent(id)}&select=id&limit=1`);
    if (!clients.length) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    const saved = await supabaseRest<Array<{ id: string }>>("valoraciones_iniciales", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ cliente_id: id, respuestas, observaciones_profesional: String(observaciones_profesional || "").slice(0, 5000), estado: estado === "completada" ? "completada" : "borrador", consentimiento_salud_confirmado_at: new Date().toISOString() }) });
    return NextResponse.json({ ok: true, data: saved[0] });
  } catch(e) { return responseError(e); }
}
