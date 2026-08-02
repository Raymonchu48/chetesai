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
  return user.id;
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
  const date = new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    await assertProfessional();
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    const state = request.nextUrl.searchParams.get("estado");
    const clientId = request.nextUrl.searchParams.get("cliente_id");

    const filters: string[] = [];
    if (from) filters.push(`inicio_at=gte.${encodeURIComponent(from)}`);
    if (to) filters.push(`inicio_at=lte.${encodeURIComponent(to)}`);
    if (state && allowedStates.has(state)) filters.push(`estado=eq.${encodeURIComponent(state)}`);
    if (clientId) filters.push(`cliente_id=eq.${encodeURIComponent(clientId)}`);

    const suffix = filters.length ? `&${filters.join("&")}` : "";
    const rows = await serviceRequest<Array<Record<string, unknown>>>(
      `sesiones_agenda?select=*,clientes(id,nombre,email,telefono)&order=inicio_at.asc${suffix}`
    );
    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar las sesiones";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await assertProfessional();
    const body = (await request.json()) as Record<string, unknown>;
    const clienteId = String(body.cliente_id || body.cliente || "");
    const titulo = String(body.titulo || "").trim();
    const inicioAt = normalizeDate(body.inicio_at || body.fecha);
    const duration = Number(body.duracion_minutos || 60);
    const type = String(body.tipo_sesion || "entrenamiento_personal");
    const state = String(body.estado || body.estado_sesion || "pendiente");
    const modality = String(body.modalidad || "presencial");

    if (!clienteId) return NextResponse.json({ ok: false, error: "Selecciona un cliente" }, { status: 400 });
    if (!titulo) return NextResponse.json({ ok: false, error: "Escribe un título" }, { status: 400 });
    if (!inicioAt) return NextResponse.json({ ok: false, error: "Selecciona una fecha y hora válidas" }, { status: 400 });
    if (!Number.isFinite(duration) || duration < 15 || duration > 240) {
      return NextResponse.json({ ok: false, error: "La duración debe estar entre 15 y 240 minutos" }, { status: 400 });
    }
    if (!allowedTypes.has(type) || !allowedStates.has(state) || !allowedModalities.has(modality)) {
      return NextResponse.json({ ok: false, error: "Tipo, estado o modalidad no válidos" }, { status: 400 });
    }

    const payload = {
      cliente_id: clienteId,
      solicitud_id: String(body.solicitud_id || "").trim() || null,
      titulo,
      inicio_at: inicioAt,
      duracion_minutos: duration,
      tipo_sesion: type,
      estado: state,
      modalidad: modality,
      ubicacion: String(body.ubicacion || "").trim() || null,
      notas_profesional: String(body.notas_profesional || body.notas_sesion || "").trim() || null,
      mensaje_cliente: String(body.mensaje_cliente || "").trim() || null,
      motivo_cancelacion: String(body.motivo_cancelacion || "").trim() || null,
      recordatorio_minutos: Number(body.recordatorio_minutos ?? 1440),
      created_by: userId,
    };

    const rows = await serviceRequest<Array<Record<string, unknown>>>("sesiones_agenda", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    return NextResponse.json({ ok: true, data: rows[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear la sesión";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
