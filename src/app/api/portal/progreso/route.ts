import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getConsentState, privacyErrorStatus, requireConsent } from "@/lib/privacy-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

async function getClient() {
  if (!supabaseUrl || !anonKey) throw new Error("Supabase no está configurado");
  const store = await cookies();
  const token = store.get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("Sesión no válida");
  const user = (await userResponse.json()) as { id?: string; email?: string };
  if (!user.email) throw new Error("Tu cuenta no tiene correo asociado");

  const clients = await serviceRequest<Array<{ id: string; nombre: string; email: string | null }>>(
    `clientes?email=ilike.${encodeURIComponent(user.email)}&select=id,nombre,email&limit=1`
  );
  if (!clients[0]) throw new Error("Tu cuenta todavía no está vinculada a un cliente");
  return { userId: user.id || null, client: clients[0] };
}

function optionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function GET() {
  try {
    const { client } = await getClient();
    await requireConsent(client.id, "health_data");
    const photoConsent = (await getConsentState(client.id)).progress_photos.granted === true;
    const rows = await serviceRequest<Array<Record<string, unknown>>>(
      `mediciones_corporales?cliente_id=eq.${encodeURIComponent(client.id)}&select=id,fecha,peso_kg,altura_cm,grasa_corporal_pct,masa_muscular_kg,agua_corporal_pct,pecho_cm,cintura_cm,cadera_cm,brazo_izq_cm,brazo_der_cm,muslo_izq_cm,muslo_der_cm,foto_frontal_path,foto_lateral_path,foto_posterior_path,comentario_cliente,origen,created_at&order=fecha.desc,created_at.desc`
    );
    const safeRows = photoConsent ? rows : rows.map((row) => ({
      ...row,
      foto_frontal_path: null,
      foto_lateral_path: null,
      foto_posterior_path: null,
    }));
    return NextResponse.json({ ok: true, data: { cliente: client, mediciones: safeRows } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar tu progreso";
    const status = privacyErrorStatus(message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, client } = await getClient();
    await requireConsent(client.id, "health_data");
    const body = (await request.json()) as Record<string, unknown>;
    const payload = {
      cliente_id: client.id,
      fecha: String(body.fecha || new Date().toISOString().slice(0, 10)),
      peso_kg: optionalNumber(body.peso_kg),
      grasa_corporal_pct: optionalNumber(body.grasa_corporal_pct),
      masa_muscular_kg: optionalNumber(body.masa_muscular_kg),
      agua_corporal_pct: optionalNumber(body.agua_corporal_pct),
      comentario_cliente: String(body.comentario_cliente || "").trim() || null,
      origen: "cliente",
      created_by: userId,
    };
    if (!payload.peso_kg && !payload.grasa_corporal_pct && !payload.masa_muscular_kg && !payload.agua_corporal_pct) {
      return NextResponse.json({ ok: false, error: "Introduce al menos una medición" }, { status: 400 });
    }

    const rows = await serviceRequest<Array<Record<string, unknown>>>("mediciones_corporales", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    return NextResponse.json({ ok: true, data: rows[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar tu medición";
    const status = privacyErrorStatus(message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
