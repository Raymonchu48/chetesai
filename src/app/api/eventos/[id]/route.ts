import { NextRequest, NextResponse } from "next/server";
import {
  assertProfessional,
  ClientRow,
  EventRow,
  eventEmailTemplate,
  RegistrationRow,
  sendBatchEmails,
  serviceRequest,
} from "@/lib/events-server";

const allowedStates = new Set(["borrador", "publicado", "completo", "finalizado", "cancelado"]);
const allowedCategories = new Set(["pilates", "running", "nutricion", "senderismo", "movilidad", "taller", "otro"]);
const allowedModalities = new Set(["presencial", "online", "mixta"]);

function clean(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const textFields = ["titulo", "descripcion", "ubicacion", "enlace_online", "imagen_url"];
  for (const field of textFields) {
    if (field in body) payload[field] = body[field] ? String(body[field]).trim() : null;
  }
  if (body.fecha_inicio) payload.fecha_inicio = new Date(String(body.fecha_inicio)).toISOString();
  if ("fecha_fin" in body) payload.fecha_fin = body.fecha_fin ? new Date(String(body.fecha_fin)).toISOString() : null;
  if ("fecha_limite_inscripcion" in body) {
    payload.fecha_limite_inscripcion = body.fecha_limite_inscripcion
      ? new Date(String(body.fecha_limite_inscripcion)).toISOString()
      : null;
  }
  if (body.categoria && allowedCategories.has(String(body.categoria))) payload.categoria = String(body.categoria);
  if (body.modalidad && allowedModalities.has(String(body.modalidad))) payload.modalidad = String(body.modalidad);
  if (body.estado && allowedStates.has(String(body.estado))) payload.estado = String(body.estado);
  if (body.aforo !== undefined) payload.aforo = Math.max(1, Math.min(500, Number(body.aforo)));
  if (body.precio !== undefined) payload.precio = Math.max(0, Number(body.precio));
  return payload;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertProfessional();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const existing = await serviceRequest<EventRow[]>(
      `eventos?id=eq.${encodeURIComponent(id)}&select=*&limit=1`
    );
    if (!existing[0]) return NextResponse.json({ ok: false, error: "Evento no encontrado" }, { status: 404 });

    const payload = clean(body);
    if (payload.estado === "publicado" && !existing[0].publicado_at) {
      payload.publicado_at = new Date().toISOString();
    }
    const rows = await serviceRequest<EventRow[]>(`eventos?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });
    const updated = rows[0];
    let warning: string | null = null;

    if (payload.estado === "cancelado" && updated) {
      try {
        const registrations = await serviceRequest<RegistrationRow[]>(
          `inscripciones_eventos?evento_id=eq.${encodeURIComponent(id)}&estado=in.(confirmada,lista_espera)&select=cliente_id,clientes(id,nombre,email)`
        );

        if (registrations.length > 0) {
          await serviceRequest(
            `inscripciones_eventos?evento_id=eq.${encodeURIComponent(id)}&estado=in.(confirmada,lista_espera)`,
            {
              method: "PATCH",
              body: JSON.stringify({
                estado: "cancelada",
                updated_at: new Date().toISOString(),
              }),
            }
          );
        }

        const recipients = registrations
          .map((item) => item.clientes as ClientRow | null)
          .filter((client): client is ClientRow => Boolean(client?.email));
        for (let index = 0; index < recipients.length; index += 100) {
          const group = recipients.slice(index, index + 100);
          const payloads = group.map((client) => {
            const template = eventEmailTemplate(updated, client.nombre, "cancelacion");
            return { to: [client.email!], subject: `Evento cancelado: ${updated.titulo}`, ...template };
          });
          const result = await sendBatchEmails(payloads, `event-cancel-${id}-${index}-${updated.updated_at}`);
          const ids = result?.data || [];
          await serviceRequest("eventos_comunicaciones", {
            method: "POST",
            body: JSON.stringify(group.map((client, itemIndex) => ({
              evento_id: id,
              cliente_id: client.id,
              tipo: "cancelacion",
              email: client.email,
              estado: "enviado",
              proveedor_id: ids[itemIndex]?.id || null,
            }))),
          });
        }
      } catch (error) {
        warning = error instanceof Error ? error.message : "El evento se canceló, pero no se pudieron enviar todos los avisos";
      }
    }

    return NextResponse.json({ ok: true, data: updated, warning });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar el evento";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
