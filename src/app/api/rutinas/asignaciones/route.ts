import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../lib/supabase-rest";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
type Row = { id: string; rutina_id?: string };

async function verifyProfessional() {
  if (!url || !anon || !service) throw new Error("Configuración de autenticación incompleta");
  const token = (await cookies()).get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");
  const u = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!u.ok) throw new Error("No autenticado");
  const user = await u.json() as { id?: string };
  if (!user.id) throw new Error("No autenticado");
  const p = await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo&limit=1`, { headers: { apikey: service, Authorization: `Bearer ${service}` }, cache: "no-store" });
  if (!p.ok) throw new Error("No autorizado");
  const profiles = await p.json() as Array<{ role: string; activo: boolean }>;
  if (!profiles[0] || profiles[0].activo === false || !["administrador", "profesional"].includes(profiles[0].role)) throw new Error("No autorizado");
}

export async function POST(request: NextRequest) {
  try {
    await verifyProfessional();
    const body = await request.json() as { cliente_id?: string; rutina_id?: string; fecha_inicio?: string };
    const clienteId = String(body.cliente_id || "");
    const rutinaId = String(body.rutina_id || "");
    const date = body.fecha_inicio || new Date().toISOString().slice(0, 10);
    const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuid.test(clienteId) || !uuid.test(rutinaId) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ ok: false, error: "Cliente, rutina o fecha no válidos" }, { status: 400 });
    const [clients, routines, active] = await Promise.all([
      supabaseRest<Row[]>(`clientes?id=eq.${clienteId}&select=id&limit=1`),
      supabaseRest<Row[]>(`rutinas?id=eq.${rutinaId}&select=id&limit=1`),
      supabaseRest<Row[]>(`cliente_rutinas?cliente_id=eq.${clienteId}&rutina_id=eq.${rutinaId}&estado=eq.activa&select=id,rutina_id&limit=1`),
    ]);
    if (!clients.length || !routines.length) return NextResponse.json({ ok: false, error: "Cliente o rutina no encontrados" }, { status: 404 });
    if (active.length) return NextResponse.json({ ok: false, error: "Este cliente ya tiene asignada esta misma rutina. Puedes retirarla o elegir otra." }, { status: 409 });
    const result = await supabaseRest<Row[]>("cliente_rutinas", { method: "POST", headers: { Prefer: "return=representation" }, body: JSON.stringify({ cliente_id: clienteId, rutina_id: rutinaId, fecha_inicio: date, estado: "activa", progreso: 0 }) });
    return NextResponse.json({ ok: true, data: result[0] || null });
  } catch (e) {
    const error = e instanceof Error ? e.message : "No se pudo asignar la rutina";
    return NextResponse.json({ ok: false, error }, { status: error === "No autenticado" ? 401 : error === "No autorizado" ? 403 : 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await verifyProfessional();
    const clientId = new URL(request.url).searchParams.get("cliente_id") || "";
    if (!/^[0-9a-f-]{36}$/i.test(clientId)) return NextResponse.json({ ok: false, error: "Cliente no válido" }, { status: 400 });
    const rows = await supabaseRest<Array<Record<string, unknown>>>(`cliente_rutinas?cliente_id=eq.${encodeURIComponent(clientId)}&select=id,rutina_id,estado,fecha_inicio,progreso,rutinas(id,nombre,nivel,dias_semana)&order=fecha_inicio.desc`);
    return NextResponse.json({ ok: true, data: rows });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudieron obtener las asignaciones";
    return NextResponse.json({ ok: false, error: message }, { status: message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await verifyProfessional();
    const body = await request.json() as { cliente_id?: string; asignacion_id?: string };
    const id = body.asignacion_id || "";
    const clientId = body.cliente_id || "";
    const uuid = /^[0-9a-f-]{36}$/i;
    if (!uuid.test(id) || !uuid.test(clientId)) return NextResponse.json({ ok: false, error: "Identificador inválido" }, { status: 400 });
    const rows = await supabaseRest<Row[]>(`cliente_rutinas?id=eq.${encodeURIComponent(id)}&cliente_id=eq.${encodeURIComponent(clientId)}&select=id&limit=1`);
    if (!rows.length) return NextResponse.json({ ok: false, error: "Asignación no encontrada" }, { status: 404 });
    await supabaseRest(`cliente_rutinas?id=eq.${encodeURIComponent(id)}&cliente_id=eq.${encodeURIComponent(clientId)}`, { method: "PATCH", body: JSON.stringify({ estado: "finalizada", fecha_fin: new Date().toISOString().slice(0, 10) }) });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "No se pudo retirar la rutina";
    return NextResponse.json({ ok: false, error: message }, { status: message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500 });
  }
}
