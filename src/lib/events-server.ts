import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.BOOKING_FROM_EMAIL;
const replyTo = process.env.BOOKING_REPLY_TO;

export type EventRow = {
  id: string;
  titulo: string;
  categoria: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  modalidad: string;
  ubicacion: string | null;
  enlace_online: string | null;
  imagen_url: string | null;
  aforo: number;
  precio: number | string;
  fecha_limite_inscripcion: string | null;
  estado: string;
  publicado_at: string | null;
  invitacion_enviada_at: string | null;
  ultimo_recordatorio_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientRow = {
  id: string;
  nombre: string;
  email: string | null;
  telefono?: string | null;
  estado?: string | null;
};

export type RegistrationRow = {
  id: string;
  evento_id: string;
  cliente_id: string;
  estado: string;
  origen: string;
  notas: string | null;
  fecha_inscripcion: string;
  updated_at: string;
  clientes?: ClientRow | null;
};

export async function serviceRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
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
  const parsed = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = parsed?.message || parsed?.error || text || `Supabase respondió ${response.status}`;
    throw new Error(message);
  }
  return parsed as T;
}

async function getAuthenticatedUser() {
  if (!supabaseUrl || !anonKey) throw new Error("Supabase no está configurado");
  const store = await cookies();
  const token = store.get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Sesión no válida");
  const user = (await response.json()) as { id?: string; email?: string };
  if (!user.id) throw new Error("Sesión no válida");
  return user;
}

export async function assertProfessional() {
  const user = await getAuthenticatedUser();
  const profiles = await serviceRequest<Array<{ role?: string; activo?: boolean }>>(
    `profiles?id=eq.${encodeURIComponent(user.id!)}&select=role,activo&limit=1`
  );
  const profile = profiles[0];
  if (!profile || profile.activo === false || !["administrador", "profesional"].includes(profile.role || "")) {
    throw new Error("No autorizado");
  }
  return { id: user.id!, email: user.email || null };
}

export async function getClientFromSession() {
  const user = await getAuthenticatedUser();
  if (!user.email) throw new Error("Tu cuenta no tiene correo asociado");
  const clients = await serviceRequest<ClientRow[]>(
    `clientes?email=ilike.${encodeURIComponent(user.email)}&select=id,nombre,email,telefono,estado&limit=1`
  );
  if (!clients[0]) throw new Error("Tu cuenta todavía no está vinculada a un cliente");
  return clients[0];
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };
    return entities[character] || character;
  });
}

export function formatEventDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function eventLocation(event: EventRow) {
  if (event.modalidad === "online") return event.enlace_online || "Online";
  if (event.modalidad === "mixta") return event.ubicacion || event.enlace_online || "Presencial y online";
  return event.ubicacion || "Ubicación pendiente de confirmar";
}

export function portalEventsUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  return `${(configured || "https://chetesaifitness.com").replace(/\/$/, "")}/portal/eventos`;
}

export type EmailPayload = {
  from?: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
  reply_to?: string;
};

export function assertEmailConfigured() {
  if (!resendApiKey || !fromEmail) {
    throw new Error("Configura RESEND_API_KEY y BOOKING_FROM_EMAIL en Vercel para activar el envío");
  }
  return { resendApiKey, fromEmail, replyTo };
}

export async function sendEmail(payload: EmailPayload, idempotencyKey: string) {
  const config = assertEmailConfigured();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ChetesaiFitness/1.0",
      "Idempotency-Key": idempotencyKey.slice(0, 250),
    },
    body: JSON.stringify({
      ...payload,
      from: payload.from || config.fromEmail,
      ...(payload.reply_to || config.replyTo ? { reply_to: payload.reply_to || config.replyTo } : {}),
    }),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "No se pudo enviar el correo");
  return (text ? JSON.parse(text) : null) as { id?: string } | null;
}

export async function sendBatchEmails(payloads: EmailPayload[], idempotencyKey: string) {
  const config = assertEmailConfigured();
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ChetesaiFitness/1.0",
      "Idempotency-Key": idempotencyKey.slice(0, 250),
    },
    body: JSON.stringify(payloads.map((payload) => ({
      ...payload,
      from: payload.from || config.fromEmail,
      ...(payload.reply_to || config.replyTo ? { reply_to: payload.reply_to || config.replyTo } : {}),
    }))),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "No se pudo enviar el lote de correos");
  return (text ? JSON.parse(text) : null) as { data?: Array<{ id?: string }> } | null;
}

export function eventEmailTemplate(event: EventRow, clientName: string, type: "invitacion" | "confirmacion" | "lista_espera" | "recordatorio" | "cancelacion") {
  const date = formatEventDate(event.fecha_inicio);
  const location = eventLocation(event);
  const price = Number(event.precio || 0);
  const link = portalEventsUrl();
  const headings = {
    invitacion: "Tienes una nueva experiencia Chetesaí",
    confirmacion: "Tu plaza está confirmada",
    lista_espera: "Te hemos añadido a la lista de espera",
    recordatorio: "Recordatorio de tu próximo evento",
    cancelacion: "El evento ha sido cancelado",
  };
  const introductions = {
    invitacion: "Este mes hemos preparado una actividad especial para entrenar, aprender y compartir fuera de la rutina habitual.",
    confirmacion: "Tu inscripción está confirmada. Ya tienes tu plaza reservada.",
    lista_espera: "El aforo está completo, pero hemos guardado tu solicitud. Te avisaremos si queda una plaza libre.",
    recordatorio: "Tu evento está cerca. Aquí tienes de nuevo todos los datos.",
    cancelacion: "Por motivos organizativos, este evento no podrá celebrarse en la fecha prevista.",
  };
  const action = type === "cancelacion" ? "Consulta los próximos eventos" : type === "invitacion" ? "Reservar plaza" : "Ver mi inscripción";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#202724;line-height:1.6">
      <div style="background:#17211c;border-radius:18px 18px 0 0;padding:26px;color:white">
        <p style="margin:0;color:#d6b45f;font-size:12px;letter-spacing:2px;font-weight:bold">EVENTOS Y COMUNIDAD</p>
        <h1 style="margin:8px 0 0;font-size:28px">${escapeHtml(headings[type])}</h1>
      </div>
      <div style="border:1px solid #dce6da;border-top:0;border-radius:0 0 18px 18px;padding:26px">
        <p>Hola ${escapeHtml(clientName || "cliente")},</p>
        <p>${escapeHtml(introductions[type])}</p>
        <div style="background:#f4f7f3;border:1px solid #dce6da;border-radius:14px;padding:20px;margin:22px 0">
          <h2 style="margin:0 0 12px;color:#46624f">${escapeHtml(event.titulo)}</h2>
          <p><strong>Fecha y hora:</strong> ${escapeHtml(date)}</p>
          <p><strong>Modalidad:</strong> ${escapeHtml(event.modalidad)}</p>
          <p><strong>Lugar o enlace:</strong> ${escapeHtml(location)}</p>
          <p><strong>Precio:</strong> ${price > 0 ? `${price.toFixed(2).replace(".", ",")} €` : "Actividad gratuita"}</p>
          ${event.descripcion ? `<p style="margin-bottom:0">${escapeHtml(event.descripcion)}</p>` : ""}
        </div>
        <p style="text-align:center;margin:28px 0">
          <a href="${escapeHtml(link)}" style="display:inline-block;background:#2f9e24;color:white;text-decoration:none;padding:13px 22px;border-radius:10px;font-weight:bold">${escapeHtml(action)}</a>
        </p>
        <p style="color:#66706b;font-size:13px">Chetesaí Fitness+ · Entrena con cabeza. Mejora con método.</p>
      </div>
    </div>`;
  const text = `${headings[type]}. Hola ${clientName}. ${event.titulo}. ${date}. ${event.modalidad}. ${location}. ${price > 0 ? `${price.toFixed(2)} EUR` : "Actividad gratuita"}. ${link}`;
  return { html, text };
}
