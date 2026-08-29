import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getConsentState, privacyErrorStatus, requireConsent } from "@/lib/privacy-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const numericFields = [
  "peso_kg",
  "altura_cm",
  "grasa_corporal_pct",
  "masa_muscular_kg",
  "agua_corporal_pct",
  "pecho_cm",
  "cintura_cm",
  "cadera_cm",
  "brazo_izq_cm",
  "brazo_der_cm",
  "muslo_izq_cm",
  "muslo_der_cm",
] as const;

type Measurement = Record<string, unknown>;

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

function optionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function GET(request: NextRequest) {
  try {
    await assertProfessional();
    const clienteId = request.nextUrl.searchParams.get("cliente_id");
    if (!clienteId) return NextResponse.json({ ok: true, data: [] });
    await requireConsent(clienteId, "health_data");
    const photoConsent = (await getConsentState(clienteId)).progress_photos.granted === true;

    const rows = await serviceRequest<Measurement[]>(
      `mediciones_corporales?cliente_id=eq.${encodeURIComponent(clienteId)}&select=*&order=fecha.desc,created_at.desc`
    );
    return NextResponse.json({
      ok: true,
      data: photoConsent ? rows : rows.map((row) => ({
        ...row,
        foto_frontal_path: null,
        foto_lateral_path: null,
        foto_posterior_path: null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar el progreso";
    const status = privacyErrorStatus(message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await assertProfessional();
    const body = (await request.json()) as Record<string, unknown>;
    const clienteId = String(body.cliente_id || "");
    if (!clienteId) return NextResponse.json({ ok: false, error: "Selecciona un cliente" }, { status: 400 });
    await requireConsent(clienteId, "health_data");

    const payload: Record<string, unknown> = {
      cliente_id: clienteId,
      fecha: String(body.fecha || new Date().toISOString().slice(0, 10)),
      notas_profesional: String(body.notas_profesional || "").trim() || null,
      comentario_cliente: null,
      foto_frontal_path: String(body.foto_frontal_path || "").trim() || null,
      foto_lateral_path: String(body.foto_lateral_path || "").trim() || null,
      foto_posterior_path: String(body.foto_posterior_path || "").trim() || null,
      origen: "profesional",
      created_by: userId,
    };

    for (const field of numericFields) payload[field] = optionalNumber(body[field]);

    const rows = await serviceRequest<Measurement[]>("mediciones_corporales", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    return NextResponse.json({ ok: true, data: rows[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar la medición";
    const status = privacyErrorStatus(message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await assertProfessional();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Medición no válida" }, { status: 400 });
    await serviceRequest(`mediciones_corporales?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar la medición";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
