import { NextResponse } from "next/server";
import { getClientFromSession, serviceRequest } from "@/lib/events-server";

export const runtime = "nodejs";

type ClientReply = {
  id: string;
  respuesta?: string | null;
  respondido_at?: string | null;
  respuesta_vista_at?: string | null;
};

// Only messages belonging to the authenticated client are returned.
export async function GET() {
  try {
    const client = await getClientFromSession();
    const rows = await serviceRequest<ClientReply[]>(
      `coach_avisos_profesional?cliente_id=eq.${encodeURIComponent(client.id)}&select=id,tipo,mensaje,estado,created_at,respuesta,respondido_at,respuesta_vista_at&order=created_at.desc&limit=50`
    );
    const unread = rows.filter(row =>
      Boolean(row.respuesta?.trim()) && Boolean(row.respondido_at) &&
      (!row.respuesta_vista_at || new Date(row.respuesta_vista_at).getTime() < new Date(row.respondido_at!).getTime())
    ).length;
    return NextResponse.json({ ok: true, avisos: rows, unread }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudieron consultar tus respuestas" }, { status: 403 });
  }
}

// Only the owner of a reply may mark that reply as read.
export async function PATCH(request: Request) {
  try {
    const client = await getClientFromSession();
    const body = await request.json() as { id?: string };
    if (!body.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) {
      return NextResponse.json({ ok: false, error: "Identificador inválido" }, { status: 400 });
    }
    const row = await serviceRequest<ClientReply[]>(
      `coach_avisos_profesional?id=eq.${encodeURIComponent(body.id)}&cliente_id=eq.${encodeURIComponent(client.id)}&select=id,respuesta,respondido_at&limit=1`
    );
    if (!row[0]?.respuesta?.trim() || !row[0].respondido_at) {
      return NextResponse.json({ ok: false, error: "Respuesta no disponible" }, { status: 404 });
    }
    const updated = await serviceRequest<ClientReply[]>(
      `coach_avisos_profesional?id=eq.${encodeURIComponent(body.id)}&cliente_id=eq.${encodeURIComponent(client.id)}&select=id`,
      { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify({ respuesta_vista_at: new Date().toISOString() }) }
    );
    if (updated.length !== 1) throw new Error("No se registró la lectura");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo registrar la lectura" }, { status: 403 });
  }
}
