import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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

function statusFor(message: string) {
  return message === "No autenticado" ? 401 : 500;
}

export async function GET() {
  try {
    const client = await getClient();
    const rows = await serviceRequest<Array<Record<string, unknown>>>(
      `sesiones_agenda?cliente_id=eq.${encodeURIComponent(client.id)}&select=*&order=inicio_at.asc`
    );
    return NextResponse.json({ ok: true, data: { cliente: client, sesiones: rows } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar tus citas";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const client = await getClient();
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id || "");
    const action = String(body.action || "");
    if (!id || !["confirmar", "cancelar"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Acción no válida" }, { status: 400 });
    }

    const sessions = await serviceRequest<Array<{ id: string; cliente_id: string; estado: string }>>(
      `sesiones_agenda?id=eq.${encodeURIComponent(id)}&cliente_id=eq.${encodeURIComponent(client.id)}&select=id,cliente_id,estado&limit=1`
    );
    const session = sessions[0];
    if (!session) return NextResponse.json({ ok: false, error: "Cita no encontrada" }, { status: 404 });
    if (["realizada", "no_asistio"].includes(session.estado)) {
      return NextResponse.json({ ok: false, error: "Esta cita ya está cerrada" }, { status: 400 });
    }

    const payload = action === "confirmar"
      ? { estado: "confirmada", motivo_cancelacion: null }
      : {
          estado: "cancelada",
          motivo_cancelacion: String(body.motivo_cancelacion || "Cancelada por el cliente").trim().slice(0, 500),
        };

    const rows = await serviceRequest<Array<Record<string, unknown>>>(
      `sesiones_agenda?id=eq.${encodeURIComponent(id)}&cliente_id=eq.${encodeURIComponent(client.id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      }
    );
    return NextResponse.json({ ok: true, data: rows[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar tu cita";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}
