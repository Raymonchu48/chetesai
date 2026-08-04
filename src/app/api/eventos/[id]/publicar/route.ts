import { NextResponse } from "next/server";
import {
  assertProfessional,
  ClientRow,
  EventRow,
  eventEmailTemplate,
  sendBatchEmails,
  serviceRequest,
} from "@/lib/events-server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertProfessional();
    const { id } = await params;
    const events = await serviceRequest<EventRow[]>(
      `eventos?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
    );
    const event = events[0];
    if (!event) return NextResponse.json({ ok: false, error: "Evento no encontrado" }, { status: 404 });
    if (event.estado === "cancelado" || event.estado === "finalizado") {
      return NextResponse.json({ ok: false, error: "El evento no puede publicarse en su estado actual" }, { status: 400 });
    }

    const [clients, disabledPreferences] = await Promise.all([
      serviceRequest<ClientRow[]>(
        "clientes?estado=eq.activo&email=not.is.null&select=id,nombre,email,telefono,estado&order=nombre.asc"
      ),
      serviceRequest<Array<{ cliente_id: string }>>(
        "preferencias_comunicacion?eventos_email=eq.false&select=cliente_id"
      ),
    ]);
    const disabled = new Set(disabledPreferences.map((item) => item.cliente_id));
    const recipients = clients.filter((client) => client.email && !disabled.has(client.id));
    const sentRows: Array<Record<string, unknown>> = [];

    for (let index = 0; index < recipients.length; index += 100) {
      const group = recipients.slice(index, index + 100);
      const payloads = group.map((client) => {
        const template = eventEmailTemplate(event, client.nombre, "invitacion");
        return {
          to: [client.email!],
          subject: `Invitación: ${event.titulo} · Chetesaí Fitness+`,
          ...template,
        };
      });
      const result = await sendBatchEmails(
        payloads,
        `event-invite-${event.id}-${index}-${event.updated_at}`
      );
      const ids = result?.data || [];
      group.forEach((client, itemIndex) => {
        sentRows.push({
          evento_id: event.id,
          cliente_id: client.id,
          tipo: "invitacion",
          email: client.email,
          estado: "enviado",
          proveedor_id: ids[itemIndex]?.id || null,
        });
      });
    }

    if (sentRows.length) {
      await serviceRequest("eventos_comunicaciones", {
        method: "POST",
        body: JSON.stringify(sentRows),
      });
    }

    const now = new Date().toISOString();
    const updated = await serviceRequest<EventRow[]>(`eventos?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        estado: event.estado === "completo" ? "completo" : "publicado",
        publicado_at: event.publicado_at || now,
        invitacion_enviada_at: now,
        updated_at: now,
      }),
    });

    return NextResponse.json({
      ok: true,
      data: updated[0],
      enviados: sentRows.length,
      excluidos: clients.length - recipients.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo publicar el evento";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
