import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const allowedStates = new Set(["pendiente", "pagado", "vencido", "anulado"]);
const allowedMethods = new Set(["efectivo", "tarjeta", "transferencia", "bizum", "domiciliacion", "otro"]);

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
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function statusFor(message: string) {
  return message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertProfessional();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const estado = String(body.estado || body.estado_pago || "pendiente");
    const metodo = String(body.metodo_pago || "").trim();
    const importe = Number(body.importe_eur ?? body.monto ?? 0);

    if (!allowedStates.has(estado)) {
      return NextResponse.json({ ok: false, error: "Estado de pago no válido" }, { status: 400 });
    }
    if (metodo && !allowedMethods.has(metodo)) {
      return NextResponse.json({ ok: false, error: "Método de pago no válido" }, { status: 400 });
    }
    if (!Number.isFinite(importe) || importe < 0) {
      return NextResponse.json({ ok: false, error: "El importe no es válido" }, { status: 400 });
    }

    const payload = {
      cliente_id: String(body.cliente_id || body.cliente || "").trim(),
      bono_cliente_id: String(body.bono_cliente_id || "").trim() || null,
      concepto: String(body.concepto || "").trim(),
      importe_eur: importe,
      fecha_emision: normalizeDate(body.fecha_emision) || new Date().toISOString().slice(0, 10),
      fecha_vencimiento: normalizeDate(body.fecha_vencimiento),
      fecha_pago: estado === "pagado"
        ? normalizeDate(body.fecha_pago) || new Date().toISOString().slice(0, 10)
        : null,
      metodo_pago: metodo || null,
      estado,
      referencia: String(body.referencia || "").trim() || null,
      notas: String(body.notas || "").trim() || null,
    };

    if (!payload.cliente_id || !payload.concepto) {
      return NextResponse.json({ ok: false, error: "Completa cliente y concepto" }, { status: 400 });
    }

    const rows = await serviceRequest<Array<Record<string, unknown>>>(
      `pagos_cliente?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      }
    );
    if (!rows[0]) return NextResponse.json({ ok: false, error: "Pago no encontrado" }, { status: 404 });
    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar el pago";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertProfessional();
    const { id } = await params;
    await serviceRequest(`pagos_cliente?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar el pago";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}
