import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const allowedPaymentStates = new Set(["pendiente", "pagado", "vencido", "anulado"]);
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

function todayMadrid() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function statusFor(message: string) {
  return message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
}

export async function GET(request: NextRequest) {
  try {
    await assertProfessional();
    const today = todayMadrid();
    await serviceRequest(
      `bonos_cliente?estado=eq.programado&fecha_inicio=lte.${today}`,
      { method: "PATCH", body: JSON.stringify({ estado: "activo" }) }
    );
    await serviceRequest(
      `bonos_cliente?estado=eq.activo&fecha_fin=lt.${today}`,
      { method: "PATCH", body: JSON.stringify({ estado: "vencido" }) }
    );
    await serviceRequest(
      "bonos_cliente?estado=eq.activo&sesiones_consumidas=gte.sesiones_totales",
      { method: "PATCH", body: JSON.stringify({ estado: "agotado" }) }
    ).catch(() => null);

    const clientId = request.nextUrl.searchParams.get("cliente_id");
    const state = request.nextUrl.searchParams.get("estado");
    const filters: string[] = [];
    if (clientId) filters.push(`cliente_id=eq.${encodeURIComponent(clientId)}`);
    if (state) filters.push(`estado=eq.${encodeURIComponent(state)}`);
    const suffix = filters.length ? `&${filters.join("&")}` : "";

    const [catalog, memberships] = await Promise.all([
      serviceRequest<Array<Record<string, unknown>>>(
        "catalogo_bonos?select=*&order=modalidad.asc,sesiones_incluidas.asc"
      ),
      serviceRequest<Array<Record<string, unknown>>>(
        `bonos_cliente?select=*,clientes(id,nombre,email),catalogo_bonos(id,slug,nombre)&order=fecha_inicio.desc,created_at.desc${suffix}`
      ),
    ]);

    return NextResponse.json({ ok: true, data: { catalogo: catalog, bonos: memberships } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar los bonos";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await assertProfessional();
    const body = (await request.json()) as Record<string, unknown>;
    const clientId = String(body.cliente_id || "").trim();
    const catalogId = String(body.catalogo_bono_id || "").trim();
    const startDate = String(body.fecha_inicio || todayMadrid());
    const paymentState = String(body.estado_pago || "pendiente");
    const paymentMethod = String(body.metodo_pago || "").trim();

    if (!clientId || !catalogId) {
      return NextResponse.json({ ok: false, error: "Selecciona cliente y bono" }, { status: 400 });
    }
    if (!allowedPaymentStates.has(paymentState)) {
      return NextResponse.json({ ok: false, error: "Estado de pago no válido" }, { status: 400 });
    }
    if (paymentMethod && !allowedMethods.has(paymentMethod)) {
      return NextResponse.json({ ok: false, error: "Método de pago no válido" }, { status: 400 });
    }

    const catalogRows = await serviceRequest<Array<{
      id: string;
      nombre: string;
      modalidad: string;
      sesiones_incluidas: number;
      precio_eur: number;
      vigencia_dias: number;
      activo: boolean;
    }>>(
      `catalogo_bonos?id=eq.${encodeURIComponent(catalogId)}&select=*&limit=1`
    );
    const plan = catalogRows[0];
    if (!plan || !plan.activo) {
      return NextResponse.json({ ok: false, error: "El bono seleccionado no está disponible" }, { status: 404 });
    }

    const today = todayMadrid();
    const endDate = addDays(startDate, Math.max(1, Number(plan.vigencia_dias || 31) - 1));
    const membershipRows = await serviceRequest<Array<Record<string, unknown>>>("bonos_cliente", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        cliente_id: clientId,
        catalogo_bono_id: plan.id,
        nombre: plan.nombre,
        modalidad: plan.modalidad,
        sesiones_totales: plan.sesiones_incluidas,
        sesiones_consumidas: 0,
        precio_eur: plan.precio_eur,
        fecha_inicio: startDate,
        fecha_fin: endDate,
        estado: startDate > today ? "programado" : "activo",
        renovacion_automatica: Boolean(body.renovacion_automatica),
        notas: String(body.notas || "").trim() || null,
        created_by: userId,
      }),
    });
    const membership = membershipRows[0] as { id?: string } | undefined;
    if (!membership?.id) throw new Error("No se pudo crear el bono del cliente");

    let payment: Record<string, unknown> | null = null;
    if (body.crear_pago !== false) {
      const paymentRows = await serviceRequest<Array<Record<string, unknown>>>("pagos_cliente", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          cliente_id: clientId,
          bono_cliente_id: membership.id,
          concepto: `Bono ${plan.nombre}`,
          importe_eur: plan.precio_eur,
          fecha_emision: today,
          fecha_vencimiento: paymentState === "pagado" ? today : startDate,
          fecha_pago: paymentState === "pagado" ? today : null,
          metodo_pago: paymentMethod || null,
          estado: paymentState,
          referencia: String(body.referencia || "").trim() || null,
          notas: String(body.notas_pago || "").trim() || null,
          created_by: userId,
        }),
      });
      payment = paymentRows[0] || null;
    }

    return NextResponse.json({ ok: true, data: { bono: membership, pago: payment } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al asignar el bono";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}
