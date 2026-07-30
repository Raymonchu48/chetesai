import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Error de Supabase");
  return (text ? JSON.parse(text) : null) as T;
}

export async function GET() {
  try {
    const [clientes, rutinas, asignaciones] = await Promise.all([
      rest<Array<Record<string, unknown>>>("clientes?select=id,nombre,email,estado&order=nombre.asc"),
      rest<Array<Record<string, unknown>>>("rutinas?activa=eq.true&select=id,nombre,objetivo,nivel,dias_semana,duracion_semanas&order=nombre.asc"),
      rest<Array<Record<string, unknown>>>("cliente_rutinas?select=*,clientes(id,nombre,email),rutinas(id,nombre,objetivo,nivel,dias_semana)&order=created_at.desc"),
    ]);
    return NextResponse.json({ ok: true, data: { clientes, rutinas, asignaciones } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al cargar asignaciones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const clienteId = String(body.cliente_id || "");
    const rutinaId = String(body.rutina_id || "");
    const fechaInicio = String(body.fecha_inicio || new Date().toISOString().slice(0, 10));
    const fechaFin = body.fecha_fin ? String(body.fecha_fin) : null;
    const notas = body.notas ? String(body.notas).trim() : null;
    if (!clienteId || !rutinaId) return NextResponse.json({ ok: false, error: "Cliente y rutina son obligatorios" }, { status: 400 });

    await rest("cliente_rutinas?cliente_id=eq." + encodeURIComponent(clienteId) + "&estado=in.(activa,programada)", {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ estado: "completada", fecha_fin: fechaInicio }),
    });

    const rows = await rest<Array<Record<string, unknown>>>("cliente_rutinas", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ cliente_id: clienteId, rutina_id: rutinaId, fecha_inicio: fechaInicio, fecha_fin: fechaFin, estado: "activa", progreso: 0, notas }),
    });
    return NextResponse.json({ ok: true, data: rows[0] || null });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al asignar rutina" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id || "");
    const estado = String(body.estado || "");
    if (!id || !["activa", "pausada", "completada", "cancelada"].includes(estado)) return NextResponse.json({ ok: false, error: "Datos de actualización no válidos" }, { status: 400 });
    const payload: Record<string, unknown> = { estado };
    if (["completada", "cancelada"].includes(estado)) payload.fecha_fin = new Date().toISOString().slice(0, 10);
    await rest(`cliente_rutinas?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al actualizar asignación" }, { status: 500 });
  }
}
