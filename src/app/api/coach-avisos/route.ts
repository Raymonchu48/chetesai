import { NextResponse } from "next/server";
import { assertProfessional, serviceRequest } from "@/lib/events-server";

export const runtime = "nodejs";

type Profile = { role: "administrador" | "profesional" | "cliente"; activo: boolean };
type Assignment = { cliente_id: string };
type CoachAlert = { id: string; cliente_id: string; estado: string };

async function professionalScope() {
  const user = await assertProfessional();
  const profiles = await serviceRequest<Profile[]>(
    `profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo&limit=1`
  );
  if (!profiles[0]?.activo) throw new Error("No autorizado");
  if (profiles[0].role === "administrador") return { admin: true, clients: null as Set<string> | null, userId: user.id };
  const assignments = await serviceRequest<Assignment[]>(
    `cliente_rutinas?asignada_por=eq.${encodeURIComponent(user.id)}&estado=eq.activa&select=cliente_id`
  );
  return { admin: false, clients: new Set(assignments.map(a => a.cliente_id)), userId: user.id };
}

export async function GET() {
  try {
    const scope = await professionalScope();
    const rows = await serviceRequest<Array<Record<string, unknown>>>(
      "coach_avisos_profesional?select=id,cliente_id,tipo,mensaje,estado,created_at,respuesta,respondido_at,clientes(nombre)&order=created_at.desc&limit=200"
    );
    const avisos = scope.admin ? rows : rows.filter(a => scope.clients?.has(String(a.cliente_id)));
    return NextResponse.json({ ok: true, avisos }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "No autorizado o no se pudo cargar la bandeja" }, { status: 403 });
  }
}

export async function PATCH(request: Request) {
  try {
    const scope = await professionalScope();
    const body = await request.json() as { id?: string; estado?: string; respuesta?: string };
    if (!body.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) {
      return NextResponse.json({ ok: false, error: "Identificador inválido" }, { status: 400 });
    }
    if (body.estado !== undefined && !["pendiente", "en_revision", "resuelto"].includes(body.estado)) {
      return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
    }
    const hasResponse = body.respuesta !== undefined;
    const reply = typeof body.respuesta === "string" ? body.respuesta.trim() : "";
    if (hasResponse && (reply.length < 2 || reply.length > 2000)) {
      return NextResponse.json({ ok: false, error: "La respuesta debe tener entre 2 y 2000 caracteres" }, { status: 400 });
    }
    if (!hasResponse && body.estado === undefined) return NextResponse.json({ ok: false, error: "No hay cambios" }, { status: 400 });

    const current = await serviceRequest<CoachAlert[]>(
      `coach_avisos_profesional?id=eq.${body.id}&select=id,cliente_id,estado&limit=1`
    );
    const alert = current[0];
    if (!alert || (!scope.admin && !scope.clients?.has(alert.cliente_id))) {
      return NextResponse.json({ ok: false, error: "Aviso no disponible" }, { status: 404 });
    }
    const changes: Record<string, string> = {};
    if (body.estado !== undefined) changes.estado = body.estado;
    if (hasResponse) {
      changes.respuesta = reply;
      changes.respondido_at = new Date().toISOString();
      changes.respondido_por = scope.userId;
      if (body.estado === undefined && alert.estado === "pendiente") changes.estado = "en_revision";
    }
    const updated = await serviceRequest<CoachAlert[]>(
      `coach_avisos_profesional?id=eq.${body.id}&select=id,cliente_id,estado`,
      { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(changes) }
    );
    if (updated.length !== 1) throw new Error("No se pudo actualizar el aviso");
    return NextResponse.json({ ok: true, aviso: updated[0] });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo actualizar el aviso" }, { status: 403 });
  }
}
