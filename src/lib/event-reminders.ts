import {
  ClientRow,
  EventRow,
  eventEmailTemplate,
  sendBatchEmails,
  serviceRequest,
} from "@/lib/events-server";

type ReminderKey = "recordatorio_7d" | "recordatorio_1d";

type RegistrationWithClient = {
  cliente_id: string;
  clientes?: ClientRow | null;
};

type CommunicationRow = {
  cliente_id: string | null;
};

type ReminderDefinition = {
  key: ReminderKey;
  subjectPrefix: string;
};

export type AutomaticReminderEventResult = {
  evento_id: string;
  titulo: string;
  clave: ReminderKey;
  dias_restantes: number;
  enviados: number;
  omitidos: number;
  error?: string;
};

export type AutomaticReminderRunResult = {
  fecha_madrid: string;
  eventos_revisados: number;
  eventos_con_recordatorio: number;
  enviados: number;
  errores: number;
  resultados: AutomaticReminderEventResult[];
};

const DAY_MS = 24 * 60 * 60 * 1000;

function madridDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function dateKeyToUtcDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function daysUntilMadrid(eventDate: string, now: Date) {
  const today = dateKeyToUtcDay(madridDateKey(now));
  const eventDay = dateKeyToUtcDay(madridDateKey(new Date(eventDate)));
  return Math.round((eventDay - today) / DAY_MS);
}

function reminderForDays(days: number): ReminderDefinition | null {
  // El margen permite reintentar en el siguiente cron si el proveedor de correo
  // o la función de Vercel fallan el primer día.
  if (days >= 0 && days <= 1) {
    return { key: "recordatorio_1d", subjectPrefix: days === 0 ? "Es hoy" : "Mañana" };
  }
  if (days >= 5 && days <= 7) {
    return { key: "recordatorio_7d", subjectPrefix: `Faltan ${days} días` };
  }
  return null;
}

async function processEvent(
  event: EventRow,
  definition: ReminderDefinition,
  days: number,
  disabledClientIds: Set<string>,
  runDate: string
): Promise<AutomaticReminderEventResult> {
  const [registrations, sentCommunications] = await Promise.all([
    serviceRequest<RegistrationWithClient[]>(
      `inscripciones_eventos?evento_id=eq.${encodeURIComponent(event.id)}&estado=eq.confirmada&select=cliente_id,clientes(id,nombre,email)`
    ),
    serviceRequest<CommunicationRow[]>(
      `eventos_comunicaciones?evento_id=eq.${encodeURIComponent(event.id)}&clave=eq.${definition.key}&estado=eq.enviado&select=cliente_id`
    ),
  ]);

  const alreadySent = new Set(
    sentCommunications.map((item) => item.cliente_id).filter((id): id is string => Boolean(id))
  );
  const recipients = registrations
    .map((item) => item.clientes || null)
    .filter((client): client is ClientRow => Boolean(client?.email))
    .filter((client) => !disabledClientIds.has(client.id) && !alreadySent.has(client.id));

  const communicationRows: Array<Record<string, unknown>> = [];

  for (let index = 0; index < recipients.length; index += 100) {
    const group = recipients.slice(index, index + 100);
    const payloads = group.map((client) => {
      const template = eventEmailTemplate(event, client.nombre, "recordatorio");
      return {
        to: [client.email!],
        subject: `${definition.subjectPrefix}: ${event.titulo} · Chetesaí Fitness+`,
        ...template,
      };
    });
    const response = await sendBatchEmails(
      payloads,
      `event-auto-${definition.key}-${event.id}-${runDate}-${index}`
    );
    const providerRows = response?.data || [];

    group.forEach((client, itemIndex) => {
      communicationRows.push({
        evento_id: event.id,
        cliente_id: client.id,
        tipo: "recordatorio",
        clave: definition.key,
        email: client.email,
        estado: "enviado",
        proveedor_id: providerRows[itemIndex]?.id || null,
      });
    });
  }

  if (communicationRows.length) {
    await serviceRequest("eventos_comunicaciones", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates" },
      body: JSON.stringify(communicationRows),
    });
    const now = new Date().toISOString();
    await serviceRequest(`eventos?id=eq.${encodeURIComponent(event.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ ultimo_recordatorio_at: now, updated_at: now }),
    });
  }

  return {
    evento_id: event.id,
    titulo: event.titulo,
    clave: definition.key,
    dias_restantes: days,
    enviados: communicationRows.length,
    omitidos: registrations.length - communicationRows.length,
  };
}

export async function runAutomaticEventReminders(now = new Date()): Promise<AutomaticReminderRunResult> {
  const runDate = madridDateKey(now);
  const future = new Date(now.getTime() + 8 * DAY_MS);

  const [events, disabledPreferences] = await Promise.all([
    serviceRequest<EventRow[]>(
      `eventos?estado=in.(publicado,completo)&fecha_inicio=gte.${encodeURIComponent(now.toISOString())}&fecha_inicio=lte.${encodeURIComponent(future.toISOString())}&select=*&order=fecha_inicio.asc`
    ),
    serviceRequest<Array<{ cliente_id: string }>>(
      "preferencias_comunicacion?recordatorios_email=eq.false&select=cliente_id"
    ),
  ]);

  const disabledClientIds = new Set(disabledPreferences.map((item) => item.cliente_id));
  const results: AutomaticReminderEventResult[] = [];

  for (const event of events) {
    const days = daysUntilMadrid(event.fecha_inicio, now);
    const definition = reminderForDays(days);
    if (!definition) continue;

    try {
      results.push(await processEvent(event, definition, days, disabledClientIds, runDate));
    } catch (error) {
      results.push({
        evento_id: event.id,
        titulo: event.titulo,
        clave: definition.key,
        dias_restantes: days,
        enviados: 0,
        omitidos: 0,
        error: error instanceof Error ? error.message : "Error al procesar el recordatorio",
      });
    }
  }

  return {
    fecha_madrid: runDate,
    eventos_revisados: events.length,
    eventos_con_recordatorio: results.length,
    enviados: results.reduce((total, item) => total + item.enviados, 0),
    errores: results.filter((item) => Boolean(item.error)).length,
    resultados: results,
  };
}
