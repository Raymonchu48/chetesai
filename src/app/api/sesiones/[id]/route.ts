import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const allowedTypes = new Set([
  "valoracion_inicial",
  "entrenamiento_personal",
  "grupo_reducido",
  "revision_progreso",
  "nutricion",
  "online",
  "otro",
]);
const allowedStates = new Set(["pendiente", "confirmada", "realizada", "cancelada", "no_asistio"]);
const allowedModalities = new Set(["presencial", "online", "exterior"]);

async function assertProfessional() {
  if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Supabase no está configurado");
  const store = await cookies();
  const token = store.get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("Sesión no válida");
  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) throw new Error("Sesión no válida");

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo&limit=1`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    }
  );
  const profiles = profileResponse.ok
    ? ((await profileResponse.json()) as Array<{ role?: string; activo?: boolean }>)
    : [];
  const profile = profiles[0];
  if (!profile || profile.activo === false || !["administrador", "profesional"].includes(profile.role || "")) {
    throw new Error("No autorizado");
  }
}

async function serviceRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Error de Supabase");
  return (text ? JSON.parse(text) : null) as T;
}

function normalizeDate(value: unknown) {
  if (value === undefined) return undefined;
  const date = new Date(String(value || ""));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function statusFor(message: string) {
  return message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertProfessional();
    const { id } = await params;
    const rows = await serviceRequest<Array<Record<string, unknown>>>(
      `sesiones_agenda?id=eq.${encodeURIComponent(id)}&select=*,clientes(id,nombre,email,telefono)&limit=1`
    );
    if (!rows[0]) return NextResponse.json({ ok: false, error: "Sesión no encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar la sesión";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertProfessional();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload: Record<string, unknown> = {};

    if (body.cliente_id !== undefined || body.cliente !== undefined) {
      const value = String(body.cliente_id || body.cliente || "");
      if (!value) return NextResponse.json({ ok: false, error: "Selecciona un cliente" }, { status: 400 });
      payload.cliente_id = value;
    }
    if (body.titulo !== undefined) {
      const value = String(body.titulo || "").trim();
      if (!value) return NextResponse.json({ ok: false, error: "Escribe un título" }, { status: 400 });
      payload.titulo = value;
    }
    if (body.inicio_at !== undefined || body.fecha !== undefined) {
      const value = normalizeDate(body.inicio_at ?? body.fecha);
      if (!value) return NextResponse.json({ ok: false, error: "Fecha no válida" }, { status: 400 });
      payload.inicio_at = value;
    }
    if (body.duracion_minutos !== undefined) {
      const value = Number(body.duracion_minutos);
      if (!Number.isFinite(value) || value < 15 || value > 240) {
        return NextResponse.json({ ok: false, error: "Duración no válida" }, { status: 400 });
      }
      payload.duracion_minutos = value;
    }
    if (body.tipo_sesion !== undefined) {
      const value = String(body.tipo_sesion);
      if (!allowedTypes.has(value)) return NextResponse.json({ ok: false, error: "Tipo no válido" }, { status: 400 });
      payload.tipo_sesion = value;
    }
    if (body.estado !== undefined || body.estado_sesion !== undefined) {
      const value = String(body.estado ?? body.estado_sesion);
      if (!allowedStates.has(value)) return NextResponse.json({ ok: false, error: "Estado no válido" }, { status: 400 });
      payload.estado = value;
    }
    if (body.modalidad !== undefined) {
      const value = String(body.modalidad);
      if (!allowedModalities.has(value)) return NextResponse.json({ ok: false, error: "Modalidad no válida" }, { status: 400 });
      payload.modalidad = value;
    }

    const optionalText: Array<[string, unknown]> = [
      ["ubicacion", body.ubicacion],
      ["notas_profesional", body.notas_profesional ?? body.notas_sesion],
      ["mensaje_cliente", body.mensaje_cliente],
      ["motivo_cancelacion", body.motivo_cancelacion],
    ];
    for (const [field, value] of optionalText) {
      if (value !== undefined) payload[field] = String(value || "").trim() || null;
    }
    if (body.recordatorio_minutos !== undefined) payload.recordatorio_minutos = Number(body.recordatorio_minutos);

    const rows = await serviceRequest<Array<Record<string, unknown>>>(
      `sesiones_agenda?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      }
    );
    if (!rows[0]) return NextResponse.json({ ok: false, error: "Sesión no encontrada" }, { status: 404 });
    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar la sesión";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertProfessional();
    const { id } = await params;
    await serviceRequest(`sesiones_agenda?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar la sesión";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}
