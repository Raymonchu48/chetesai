import { NextRequest, NextResponse } from "next/server";
import {
  ClientRow,
  EventRow,
  eventEmailTemplate,
  formatEventDate,
  getClientFromSession,
  portalEventsUrl,
  sendEmail,
  serviceRequest,
} from "@/lib/events-server";

type RegistrationResult = {
  inscripcion_id?: string;
  estado: string;
  plazas_disponibles?: number;
};
type CancellationResult = {
  estado: string;
  cliente_promovido_id?: string | null;
  plazas_disponibles?: number;
};

async function logCommunication(eventId: string, client: ClientRow, type: string, providerId?: string | null) {
  if (!client.email) return;
  await serviceRequest("eventos_comunicaciones", {
    method: "POST",
    body: JSON.stringify({
      evento_id: eventId,
      cliente_id: client.id,
      tipo: type,
      email: client.email,
      estado: "enviado",
      proveedor_id: providerId || null,
    }),
  });
}

export async function GET() {
  try {
    const client = await getClientFromSession();
    let preferences = await serviceRequest<Array<{ cliente_id: string; eventos_email: boolean; recordatorios_email: boolean }>>(
      `preferencias_comunicacion?cliente_id=eq.${encodeURIComponent(client.id)}&select=cliente_id,eventos_email,recordatorios_email&limit=1`
    );
    if (!preferences[0]) {
      preferences = await serviceRequest("preferencias_comunicacion", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ cliente_id: client.id, eventos_email: true, recordatorios_email: true }),
      });
    }

    const [events, registrations] = await Promise.all([
      serviceRequest<EventRow[]>(
        "eventos?estado=in.(publicado,completo,finalizado)&select=*&order=fecha_inicio.asc"
      ),
      serviceRequest<Array<Record<string, unknown>>>(
        `inscripciones_eventos?cliente_id=eq.${encodeURIComponent(client.id)}&select=*&order=fecha_inscripcion.desc`
      ),
    ]);

    return NextResponse.json({
      ok: true,
      data: { cliente: client, eventos: events, inscripciones: registrations, preferencias: preferences[0] },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar los eventos";
    const status = message === "No autenticado" ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = await getClientFromSession();
    const body = (await request.json()) as { evento_id?: string };
    if (!body.evento_id) return NextResponse.json({ ok: false, error: "Evento no indicado" }, { status: 400 });

    const result = await serviceRequest<RegistrationResult>("rpc/inscribir_cliente_evento", {
      method: "POST",
      body: JSON.stringify({ p_evento_id: body.evento_id, p_cliente_id: client.id }),
    });
    const events = await serviceRequest<EventRow[]>(
      `eventos?id=eq.${encodeURIComponent(body.evento_id)}&select=*&limit=1`
    );
    const event = events[0];
    let warning: string | null = null;

    if (event && client.email) {
      try {
        const type = result.estado === "lista_espera" ? "lista_espera" : "confirmacion";
        const template = eventEmailTemplate(event, client.nombre, type);
        const email = await sendEmail(
          {
            to: [client.email],
            subject: result.estado === "lista_espera"
              ? `Lista de espera: ${event.titulo}`
              : `Plaza confirmada: ${event.titulo}`,
            ...template,
          },
          `event-registration-${event.id}-${client.id}-${result.estado}`
        );
        await logCommunication(event.id, client, type, email?.id || null);
      } catch (error) {
        warning = error instanceof Error ? error.message : "La plaza se guardó, pero no se pudo enviar el correo";
      }
    }

    return NextResponse.json({ ok: true, data: result, warning });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo reservar la plaza";
    const status = message === "No autenticado" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const client = await getClientFromSession();
    const body = (await request.json()) as { evento_id?: string };
    if (!body.evento_id) return NextResponse.json({ ok: false, error: "Evento no indicado" }, { status: 400 });

    const result = await serviceRequest<CancellationResult>("rpc/cancelar_inscripcion_evento", {
      method: "POST",
      body: JSON.stringify({ p_evento_id: body.evento_id, p_cliente_id: client.id }),
    });
    const events = await serviceRequest<EventRow[]>(
      `eventos?id=eq.${encodeURIComponent(body.evento_id)}&select=*&limit=1`
    );
    const event = events[0];
    let warning: string | null = null;

    if (event && client.email) {
      try {
        const date = formatEventDate(event.fecha_inicio);
        const email = await sendEmail({
          to: [client.email],
          subject: `Inscripción cancelada: ${event.titulo}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#202724;line-height:1.6"><h1 style="color:#46624f">Chetesaí Fitness+</h1><p>Hola ${client.nombre},</p><p>Tu inscripción en <strong>${event.titulo}</strong>, prevista para ${date}, ha quedado cancelada.</p><p>Puedes consultar otras actividades en <a href="${portalEventsUrl()}">Eventos y comunidad</a>.</p></div>`,
          text: `Hola ${client.nombre}. Tu inscripción en ${event.titulo}, prevista para ${date}, ha quedado cancelada. ${portalEventsUrl()}`,
        }, `event-unregister-${event.id}-${client.id}`);
        await logCommunication(event.id, client, "cancelacion", email?.id || null);
      } catch (error) {
        warning = error instanceof Error ? error.message : "La cancelación se guardó, pero no se pudo enviar el correo";
      }
    }

    if (event && result.cliente_promovido_id) {
      try {
        const promoted = await serviceRequest<ClientRow[]>(
          `clientes?id=eq.${encodeURIComponent(result.cliente_promovido_id)}&select=id,nombre,email&limit=1`
        );
        const promotedClient = promoted[0];
        if (promotedClient?.email) {
          const template = eventEmailTemplate(event, promotedClient.nombre, "confirmacion");
          const email = await sendEmail({
            to: [promotedClient.email],
            subject: `Ya tienes plaza: ${event.titulo}`,
            ...template,
          }, `event-promoted-${event.id}-${promotedClient.id}`);
          await logCommunication(event.id, promotedClient, "confirmacion", email?.id || null);
        }
      } catch (error) {
        warning = warning || (error instanceof Error ? error.message : "No se pudo avisar a la persona promovida");
      }
    }

    return NextResponse.json({ ok: true, data: result, warning });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cancelar la inscripción";
    const status = message === "No autenticado" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const client = await getClientFromSession();
    const body = (await request.json()) as { eventos_email?: boolean; recordatorios_email?: boolean };
    const payload = {
      cliente_id: client.id,
      eventos_email: body.eventos_email !== false,
      recordatorios_email: body.recordatorios_email !== false,
      updated_at: new Date().toISOString(),
    };
    const rows = await serviceRequest<Array<Record<string, unknown>>>("preferencias_comunicacion?on_conflict=cliente_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload),
    });
    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron guardar tus preferencias";
    const status = message === "No autenticado" ? 401 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
