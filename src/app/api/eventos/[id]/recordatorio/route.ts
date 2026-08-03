import { NextResponse } from "next/server";
import {
  assertProfessional,
  ClientRow,
  EventRow,
  eventEmailTemplate,
  RegistrationRow,
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
    if (!['publicado', 'completo'].includes(event.estado)) {
      return NextResponse.json({ ok: false, error: "Solo puedes recordar eventos publicados" }, { status: 400 });
    }

    const [registrations, disabledPreferences] = await Promise.all([
      serviceRequest<RegistrationRow[]>(
        `inscripciones_eventos?evento_id=eq.${encodeURIComponent(id)}&estado=eq.confirmada&select=cliente_id,clientes(id,nombre,email)`
      ),
      serviceRequest<Array<{ cliente_id: string }>>(
        "preferencias_comunicacion?recordatorios_email=eq.false&select=cliente_id"
      ),
    ]);
    const disabled = new Set(disabledPreferences.map((item) => item.cliente_id));
    const recipients = registrations
      .map((item) => item.clientes as ClientRow | null)
      .filter((client): client is ClientRow => Boolean(client?.email) && !disabled.has(client!.id));
    const sentRows: Array<Record<string, unknown>> = [];

    for (let index = 0; index < recipients.length; index += 100) {
      const group = recipients.slice(index, index + 100);
      const payloads = group.map((client) => {
        const template = eventEmailTemplate(event, client.nombre, "recordatorio");
        return {
          to: [client.email!],
          subject: `Recordatorio: ${event.titulo} · Chetesaí Fitness+`,
          ...template,
        };
      });
      const result = await sendBatchEmails(
        payloads,
        `event-reminder-${event.id}-${index}-${new Date().toISOString().slice(0, 10)}`
      );
      const ids = result?.data || [];
      group.forEach((client, itemIndex) => {
        sentRows.push({
          evento_id: event.id,
          cliente_id: client.id,
          tipo: "recordatorio",
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
    await serviceRequest(`eventos?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ ultimo_recordatorio_at: now, updated_at: now }),
    });

    return NextResponse.json({ ok: true, enviados: sentRows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar el recordatorio";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
