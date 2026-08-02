import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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
  const user = (await userResponse.json()) as { email?: string };
  if (!user.email) throw new Error("Tu cuenta no tiene correo asociado");

  const clients = await serviceRequest<Array<{ id: string; nombre: string; email: string | null }>>(
    `clientes?email=ilike.${encodeURIComponent(user.email)}&select=id,nombre,email&limit=1`
  );
  if (!clients[0]) throw new Error("Tu cuenta todavía no está vinculada a un cliente");
  return clients[0];
}

export async function GET() {
  try {
    const client = await getClient();
    const today = new Date().toISOString().slice(0, 10);

    await serviceRequest(
      `bonos_cliente?cliente_id=eq.${encodeURIComponent(client.id)}&estado=eq.activo&fecha_fin=lt.${today}`,
      { method: "PATCH", body: JSON.stringify({ estado: "vencido" }) }
    );
    await serviceRequest(
      `pagos_cliente?cliente_id=eq.${encodeURIComponent(client.id)}&estado=eq.pendiente&fecha_vencimiento=lt.${today}`,
      { method: "PATCH", body: JSON.stringify({ estado: "vencido" }) }
    );

    const [memberships, payments] = await Promise.all([
      serviceRequest<Array<Record<string, unknown>>>(
        `bonos_cliente?cliente_id=eq.${encodeURIComponent(client.id)}&select=*&order=fecha_inicio.desc,created_at.desc`
      ),
      serviceRequest<Array<Record<string, unknown>>>(
        `pagos_cliente?cliente_id=eq.${encodeURIComponent(client.id)}&select=*&order=fecha_emision.desc,created_at.desc`
      ),
    ]);

    return NextResponse.json({ ok: true, data: { cliente: client, bonos: memberships, pagos: payments } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar tus pagos";
    const status = message === "No autenticado" ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
