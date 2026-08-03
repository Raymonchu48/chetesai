import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const allowedStates = new Set(["nueva", "contactada", "convertida", "descartada"]);
const allowedModalities = new Set(["entrenamiento_personal", "grupo_reducido", "orientacion"]);

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
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" }
  );
  const profiles = profileResponse.ok
    ? ((await profileResponse.json()) as Array<{ role?: string; activo?: boolean }>)
    : [];
  const profile = profiles[0];
  if (!profile || profile.activo === false || !["administrador", "profesional"].includes(profile.role || "")) {
    throw new Error("No autorizado");
  }
}

function clean(value: unknown, max = 1000) {
  return String(value || "").trim().slice(0, max);
}

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (clean(body.website, 120)) return NextResponse.json({ ok: true });

    const nombre = clean(body.nombre ?? body.Nombre, 120);
    const email = clean(body.email ?? body.Email, 180).toLowerCase();
    const telefono = clean(body.telefono ?? body.Telefono, 40);
    const modalidad = clean(body.modalidad ?? body.Plan, 40) || "orientacion";
    const objetivo = clean(body.objetivo, 300);
    const mensaje = clean(body.mensaje ?? body.Mensaje, 2000);
    const fechaPreferida = clean(body.fecha_preferida, 20) || null;
    const franjaHoraria = clean(body.franja_horaria, 80) || null;
    const consentimiento = body.consentimiento === true || body.Consentimiento === "Aceptado";

    if (nombre.length < 2) return NextResponse.json({ ok: false, error: "Introduce tu nombre" }, { status: 400 });
    if (!validEmail(email)) return NextResponse.json({ ok: false, error: "Introduce un correo válido" }, { status: 400 });
    if (!consentimiento) return NextResponse.json({ ok: false, error: "Debes aceptar el tratamiento de datos" }, { status: 400 });
    if (!allowedModalities.has(modalidad)) {
      return NextResponse.json({ ok: false, error: "Modalidad no válida" }, { status: 400 });
    }

    const rows = await serviceRequest<Array<Record<string, unknown>>>("solicitudes_reserva", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        nombre,
        email,
        telefono: telefono || null,
        modalidad,
        objetivo: objetivo || null,
        mensaje: mensaje || null,
        fecha_preferida: fechaPreferida,
        franja_horaria: franjaHoraria,
        consentimiento: true,
        origen: "web",
      }),
    });
    return NextResponse.json({ ok: true, data: { id: rows[0]?.id || null } }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo enviar la solicitud" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await assertProfessional();
    const state = request.nextUrl.searchParams.get("estado");
    const filter = state && allowedStates.has(state) ? `&estado=eq.${encodeURIComponent(state)}` : "";
    const rows = await serviceRequest<Array<Record<string, unknown>>>(
      `solicitudes_reserva?select=*&order=created_at.desc${filter}`
    );
    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar solicitudes";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await assertProfessional();
    const body = (await request.json()) as Record<string, unknown>;
    const id = clean(body.id, 80);
    const estado = clean(body.estado, 30);
    if (!id || !allowedStates.has(estado)) {
      return NextResponse.json({ ok: false, error: "Solicitud o estado no válido" }, { status: 400 });
    }
    const payload: Record<string, unknown> = { estado };
    if (body.cliente_id !== undefined) payload.cliente_id = clean(body.cliente_id, 80) || null;
    const rows = await serviceRequest<Array<Record<string, unknown>>>(
      `solicitudes_reserva?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      }
    );
    return NextResponse.json({ ok: true, data: rows[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar la solicitud";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
