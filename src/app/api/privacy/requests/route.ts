import { NextRequest, NextResponse } from "next/server";
import { assertProfessional, escapeHtml, sendEmail, serviceRequest } from "@/lib/events-server";

const allowedStatuses = new Set(["in_progress", "completed", "rejected", "cancelled"]);

type PrivacyRequestRow = {
  id: string;
  request_type: "access_export" | "erasure";
  status: string;
  requested_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  clientes?: { nombre?: string; email?: string | null } | null;
};

export async function GET() {
  try {
    await assertProfessional();
    const rows = await serviceRequest<PrivacyRequestRow[]>(
      "privacy_requests?select=id,request_type,status,requested_at,updated_at,resolved_at,resolution_note,clientes(nombre,email)&order=requested_at.desc&limit=200"
    );
    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar las solicitudes";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await assertProfessional();
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id || "");
    const status = String(body.status || "");
    const note = String(body.resolution_note || "").trim();
    if (!id || !allowedStatuses.has(status)) {
      return NextResponse.json({ ok: false, error: "Actualización no válida" }, { status: 400 });
    }
    if ((status === "completed" || status === "rejected") && note.length < 10) {
      return NextResponse.json(
        { ok: false, error: "Añade una nota de resolución de al menos 10 caracteres" },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const rows = await serviceRequest<PrivacyRequestRow[]>(
      `privacy_requests?id=eq.${encodeURIComponent(id)}&select=id,request_type,status,requested_at,updated_at,resolved_at,resolution_note,clientes(nombre,email)`,
      {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        status,
        resolution_note: note || null,
        updated_at: now,
        resolved_at: ["completed", "rejected", "cancelled"].includes(status) ? now : null,
      }),
      }
    );
    const updated = rows[0];
    if (!updated) return NextResponse.json({ ok: false, error: "Solicitud no encontrada" }, { status: 404 });

    const clientEmail = updated.clientes?.email;
    if (clientEmail && ["completed", "rejected"].includes(status)) {
      const completed = status === "completed";
      await sendEmail(
        {
          to: [clientEmail],
          subject: completed ? "Tu solicitud de privacidad ha sido completada" : "Actualización de tu solicitud de privacidad",
          html: `<p>Hola ${escapeHtml(updated.clientes?.nombre || "")},</p><p>${completed ? "Hemos completado" : "Hemos revisado"} tu solicitud relacionada con la protección de datos.</p><p><strong>Detalle:</strong> ${escapeHtml(note)}</p><p>Si necesitas más información, responde a este correo.</p>`,
          text: `${completed ? "Hemos completado" : "Hemos revisado"} tu solicitud de privacidad. Detalle: ${note}`,
        },
        `privacy-request-${id}-${status}`
      ).catch((emailError) => {
        console.error("[privacy] No se pudo enviar la resolución", emailError);
      });
    }

    return NextResponse.json({ ok: true, data: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la solicitud";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
