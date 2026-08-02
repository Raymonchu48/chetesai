import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const bookingFromEmail = process.env.BOOKING_FROM_EMAIL;
const bookingReplyTo = process.env.BOOKING_REPLY_TO;

type SessionRow = {
  id: string;
  titulo: string;
  inicio_at: string;
  duracion_minutos: number;
  estado: string;
  modalidad: string;
  ubicacion: string | null;
  clientes: { nombre: string; email: string | null } | null;
};

async function assertProfessional() {
  if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Supabase no está configurado");
  const store = await cookies();
  const token = store.get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("Sesión no válida");

  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) throw new Error("Sesión no válida");

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" }
  );
  const profiles = profileResponse.ok
    ? ((await profileResponse.json()) as Array<{ role?: string; activo?: boolean }>)
    : [];
  const profile = profiles[0];
  if (!profile || profile.activo === false || !["administrador", "profesional"].includes(profile.role || "")) {
    throw new Error("No autorizado");
  }
}

function escapeHtml(value: string) {
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

function formatDateTime(value: string) {
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertProfessional();
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
    if (!resendApiKey || !bookingFromEmail) {
      return NextResponse.json(
        { ok: false, error: "Configura RESEND_API_KEY y BOOKING_FROM_EMAIL en Vercel para activar el envío" },
        { status: 503 }
      );
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as { tipo?: string };
    const sessionResponse = await fetch(
      `${supabaseUrl}/rest/v1/sesiones_agenda?id=eq.${encodeURIComponent(id)}&select=id,titulo,inicio_at,duracion_minutos,estado,modalidad,ubicacion,clientes(nombre,email)&limit=1`,
      {
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
        cache: "no-store",
      }
    );
    if (!sessionResponse.ok) throw new Error(await sessionResponse.text());

    const sessions = (await sessionResponse.json()) as SessionRow[];
    const session = sessions[0];
    if (!session) return NextResponse.json({ ok: false, error: "Sesión no encontrada" }, { status: 404 });
    if (!session.clientes?.email) {
      return NextResponse.json({ ok: false, error: "El cliente no tiene correo electrónico" }, { status: 400 });
    }

    const isAlternative = body.tipo === "alternativa";
    const appointment = formatDateTime(session.inicio_at);
    const clientName = session.clientes.nombre || "cliente";
    const location = session.ubicacion
      ? `<p><strong>Ubicación o enlace:</strong> ${escapeHtml(session.ubicacion)}</p>`
      : "";
    const subject = isAlternative
      ? "Nueva propuesta de horario · Chetesaí Fitness+"
      : "Confirmación de tu valoración · Chetesaí Fitness+";
    const introduction = isAlternative
      ? "La hora solicitada inicialmente no estaba disponible. Te proponemos esta nueva cita:"
      : "Tu valoración inicial ha quedado confirmada con los siguientes datos:";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#202724;line-height:1.6">
        <h1 style="color:#2f9e24">Chetesaí Fitness+</h1>
        <p>Hola ${escapeHtml(clientName)},</p>
        <p>${introduction}</p>
        <div style="background:#f4f7f3;border:1px solid #dce6da;border-radius:14px;padding:18px;margin:20px 0">
          <p><strong>Sesión:</strong> ${escapeHtml(session.titulo)}</p>
          <p><strong>Fecha y hora:</strong> ${escapeHtml(appointment)}</p>
          <p><strong>Duración:</strong> ${session.duracion_minutos} minutos</p>
          <p><strong>Modalidad:</strong> ${escapeHtml(session.modalidad)}</p>
          ${location}
        </div>
        <p>Responde a este correo si necesitas comunicar algún cambio.</p>
        <p>Chetesaí Fitness+ · Entrena con cabeza. Mejora con método.</p>
      </div>`;

    const text = `Hola ${clientName}. ${introduction} ${session.titulo}, ${appointment}, ${session.duracion_minutos} minutos, modalidad ${session.modalidad}${session.ubicacion ? `, ${session.ubicacion}` : ""}. Responde a este correo si necesitas comunicar algún cambio.`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "ChetesaiFitness/1.0",
        "Idempotency-Key": `${session.id}-${isAlternative ? "alternative" : "confirmation"}-${session.inicio_at}`.slice(0, 250),
      },
      body: JSON.stringify({
        from: bookingFromEmail,
        to: [session.clientes.email],
        ...(bookingReplyTo ? { reply_to: bookingReplyTo } : {}),
        subject,
        html,
        text,
      }),
    });

    const emailText = await emailResponse.text();
    if (!emailResponse.ok) throw new Error(emailText || "No se pudo enviar el correo");
    return NextResponse.json({ ok: true, data: emailText ? JSON.parse(emailText) : null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo enviar el correo";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
