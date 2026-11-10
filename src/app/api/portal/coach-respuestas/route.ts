import { NextResponse } from "next/server";
import { getClientFromSession, serviceRequest } from "@/lib/events-server";

export const runtime = "nodejs";

// Only the authenticated client's own consultations and professional replies.
export async function GET() {
  try {
    const client = await getClientFromSession();
    const rows = await serviceRequest<Array<Record<string, unknown>>>(
      `coach_avisos_profesional?cliente_id=eq.${encodeURIComponent(client.id)}&select=id,tipo,mensaje,estado,created_at,respuesta,respondido_at&order=created_at.desc&limit=50`
    );
    return NextResponse.json({ ok: true, avisos: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, error: "No se pudo consultar tus respuestas" }, { status: 403 });
  }
}
