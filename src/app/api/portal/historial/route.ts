import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function rest<T>(path: string): Promise<T> {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Error de Supabase");
  return (text ? JSON.parse(text) : null) as T;
}

export async function GET() {
  try {
    if (!supabaseUrl || !anonKey) throw new Error("Supabase no está configurado");

    const store = await cookies();
    const token = store.get("chetesai_access_token")?.value;
    if (!token) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!userResponse.ok) return NextResponse.json({ ok: false, error: "Sesión no válida" }, { status: 401 });

    const user = (await userResponse.json()) as { email?: string };
    if (!user.email) return NextResponse.json({ ok: true, data: [] });

    const clientes = await rest<Array<{ id: string }>>(
      `clientes?email=ilike.${encodeURIComponent(user.email)}&select=id&limit=1`
    );
    const cliente = clientes[0];
    if (!cliente) return NextResponse.json({ ok: true, data: [] });

    const sesiones = await rest<Array<Record<string, unknown>>>(
      `sesiones_entrenamiento?cliente_id=eq.${cliente.id}&estado=eq.completada&select=id,dia,iniciada_at,finalizada_at,duracion_segundos,series_completadas,ejercicios_completados,volumen_total,rpe_sesion,comentario_cliente&order=finalizada_at.desc&limit=10`
    );

    return NextResponse.json({ ok: true, data: sesiones });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al cargar el historial" },
      { status: 500 }
    );
  }
}
