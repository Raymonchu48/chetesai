import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function statusFor(message: string) {
  return message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await assertProfessional();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "actualizar");

    const rows = await serviceRequest<Array<{
      id: string;
      sesiones_totales: number;
      sesiones_consumidas: number;
      estado: string;
    }>>(
      `bonos_cliente?id=eq.${encodeURIComponent(id)}&select=id,sesiones_totales,sesiones_consumidas,estado&limit=1`
    );
    const membership = rows[0];
    if (!membership) return NextResponse.json({ ok: false, error: "Bono no encontrado" }, { status: 404 });

    if (action === "consumir") {
      if (membership.estado !== "activo") {
        return NextResponse.json({ ok: false, error: "El bono no está activo" }, { status: 400 });
      }
      const quantity = Math.max(1, Number(body.cantidad || 1));
      const consumed = Number(membership.sesiones_consumidas || 0) + quantity;
      if (consumed > Number(membership.sesiones_totales || 0)) {
        return NextResponse.json({ ok: false, error: "No quedan sesiones suficientes" }, { status: 400 });
      }

      await serviceRequest("consumos_bono", {
        method: "POST",
        body: JSON.stringify({
          bono_cliente_id: id,
          sesion_id: String(body.sesion_id || "").trim() || null,
          cantidad: quantity,
          concepto: String(body.concepto || "Sesión consumida manualmente").trim(),
          fecha: String(body.fecha || new Date().toISOString().slice(0, 10)),
          created_by: userId,
        }),
      });

      const updatedRows = await serviceRequest<Array<Record<string, unknown>>>(
        `bonos_cliente?id=eq.${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            sesiones_consumidas: consumed,
            estado: consumed >= membership.sesiones_totales ? "agotado" : "activo",
          }),
        }
      );
      return NextResponse.json({ ok: true, data: updatedRows[0] || null });
    }

    if (action === "restaurar") {
      const consumptionRows = await serviceRequest<Array<{
        id: string;
        cantidad: number;
        sesion_id: string | null;
      }>>(
        `consumos_bono?bono_cliente_id=eq.${encodeURIComponent(id)}&select=id,cantidad,sesion_id&order=created_at.desc&limit=1`
      );
      const latestConsumption = consumptionRows[0];

      if (latestConsumption?.sesion_id) {
        return NextResponse.json(
          {
            ok: false,
            error: "Ese consumo pertenece a una cita realizada. Cambia el estado de la cita para restaurar la sesión automáticamente.",
          },
          { status: 400 }
        );
      }

      if (!latestConsumption && Number(membership.sesiones_consumidas || 0) <= 0) {
        return NextResponse.json({ ok: false, error: "No hay sesiones para restaurar" }, { status: 400 });
      }

      const quantity = latestConsumption
        ? Math.max(1, Number(latestConsumption.cantidad || 1))
        : Math.max(1, Number(body.cantidad || 1));
      const consumed = Math.max(0, Number(membership.sesiones_consumidas || 0) - quantity);

      if (latestConsumption) {
        await serviceRequest(`consumos_bono?id=eq.${encodeURIComponent(latestConsumption.id)}`, {
          method: "DELETE",
        });
      }

      const updatedRows = await serviceRequest<Array<Record<string, unknown>>>(
        `bonos_cliente?id=eq.${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ sesiones_consumidas: consumed, estado: "activo" }),
        }
      );
      return NextResponse.json({ ok: true, data: updatedRows[0] || null });
    }

    const allowedStates = new Set(["activo", "agotado", "vencido", "cancelado"]);
    const state = String(body.estado || membership.estado);
    if (!allowedStates.has(state)) {
      return NextResponse.json({ ok: false, error: "Estado de bono no válido" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      estado: state,
      renovacion_automatica: Boolean(body.renovacion_automatica),
      notas: String(body.notas || "").trim() || null,
    };
    if (body.fecha_fin) payload.fecha_fin = String(body.fecha_fin);

    const updatedRows = await serviceRequest<Array<Record<string, unknown>>>(
      `bonos_cliente?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      }
    );
    return NextResponse.json({ ok: true, data: updatedRows[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al actualizar el bono";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await assertProfessional();
    const { id } = await params;
    await serviceRequest(`bonos_cliente?id=eq.${encodeURIComponent(id)}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar el bono";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}
