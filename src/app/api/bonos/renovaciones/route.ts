import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const bookingFromEmail = process.env.BOOKING_FROM_EMAIL;
const bookingReplyTo = process.env.BOOKING_REPLY_TO;

type ClientRow = {
  id: string;
  nombre: string;
  email: string | null;
};

type MembershipRow = {
  id: string;
  cliente_id: string;
  catalogo_bono_id: string | null;
  renovado_desde_id: string | null;
  nombre: string;
  modalidad: string;
  sesiones_totales: number;
  sesiones_consumidas: number;
  precio_eur: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  renovacion_automatica: boolean;
  notas: string | null;
  clientes: ClientRow | null;
};

type PaymentRow = {
  id: string;
  cliente_id: string;
  bono_cliente_id: string | null;
  concepto: string;
  importe_eur: number;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  fecha_pago: string | null;
  metodo_pago: string | null;
  estado: string;
  clientes: ClientRow | null;
};

type NoticeRow = {
  id: string;
  bono_cliente_id: string | null;
  pago_cliente_id: string | null;
  tipo: string;
  estado: string;
};

type NoticeType = "pocas_sesiones" | "proximo_vencimiento" | "renovacion_generada" | "cuota_vencida";

type RenewalResult = {
  membership: MembershipRow;
  payment: PaymentRow | null;
  created: boolean;
  emailSent: boolean;
  emailError?: string;
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
  return user.id;
}

async function serviceRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
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
  if (!response.ok) throw new Error(text || "Error de Supabase");
  return (text ? JSON.parse(text) : null) as T;
}

function todayMadrid() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string) {
  const start = new Date(`${from}T12:00:00Z`).getTime();
  const end = new Date(`${to}T12:00:00Z`).getTime();
  return Math.round((end - start) / 86400000);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
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

function statusFor(message: string) {
  return message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
}

async function activateScheduledMemberships(today: string) {
  await serviceRequest(
    `bonos_cliente?estado=eq.programado&fecha_inicio=lte.${today}`,
    { method: "PATCH", body: JSON.stringify({ estado: "activo" }) }
  );
}

async function markOverduePayments(today: string) {
  await serviceRequest(
    `pagos_cliente?estado=eq.pendiente&fecha_vencimiento=lt.${today}`,
    { method: "PATCH", body: JSON.stringify({ estado: "vencido" }) }
  );
}

async function wasNoticeSent(type: NoticeType, membershipId?: string | null, paymentId?: string | null) {
  const filters = [`tipo=eq.${type}`, "estado=eq.enviado", "select=id", "limit=1"];
  if (membershipId) filters.push(`bono_cliente_id=eq.${encodeURIComponent(membershipId)}`);
  if (paymentId) filters.push(`pago_cliente_id=eq.${encodeURIComponent(paymentId)}`);
  const rows = await serviceRequest<Array<{ id: string }>>(`avisos_financieros?${filters.join("&")}`);
  return Boolean(rows[0]);
}

async function sendNotice(args: {
  userId: string;
  type: NoticeType;
  client: ClientRow;
  subject: string;
  introduction: string;
  details: string[];
  membershipId?: string | null;
  paymentId?: string | null;
}) {
  const { userId, type, client, subject, introduction, details, membershipId = null, paymentId = null } = args;
  if (!client.email) return { sent: false, error: "El cliente no tiene correo electrónico" };
  if (!resendApiKey || !bookingFromEmail) {
    return { sent: false, error: "Resend no está configurado" };
  }
  if (await wasNoticeSent(type, membershipId, paymentId)) {
    return { sent: false, alreadySent: true };
  }

  const detailHtml = details
    .map((detail) => `<p style="margin:8px 0">${escapeHtml(detail)}</p>`)
    .join("");
  const html = `<!doctype html><html lang="es"><body>
    <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#202724;line-height:1.6">
      <h1 style="color:#2f9e24">Chetesaí Fitness+</h1>
      <p>Hola ${escapeHtml(client.nombre || "cliente")},</p>
      <p>${escapeHtml(introduction)}</p>
      <div style="background:#f4f7f3;border:1px solid #dce6da;border-radius:14px;padding:18px;margin:20px 0">
        ${detailHtml}
      </div>
      <p>Responde a este correo si necesitas comentar cualquier cambio.</p>
      <p>Chetesaí Fitness+ · Entrena con cabeza. Mejora con método.</p>
    </div>
  </body></html>`;
  const text = `Hola ${client.nombre || "cliente"}. ${introduction} ${details.join(". ")}. Responde a este correo si necesitas comentar cualquier cambio.`;
  const sourceId = membershipId || paymentId || client.id;

  const emailResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "ChetesaiFitness/1.0",
      "Idempotency-Key": `${type}-${sourceId}`.slice(0, 250),
    },
    body: JSON.stringify({
      from: bookingFromEmail,
      to: [client.email],
      ...(bookingReplyTo ? { reply_to: bookingReplyTo } : {}),
      subject,
      html,
      text,
    }),
  });

  const emailText = await emailResponse.text();
  if (!emailResponse.ok) {
    await serviceRequest("avisos_financieros", {
      method: "POST",
      body: JSON.stringify({
        cliente_id: client.id,
        bono_cliente_id: membershipId,
        pago_cliente_id: paymentId,
        tipo: type,
        destinatario: client.email,
        estado: "error",
        error: emailText || "No se pudo enviar el correo",
        created_by: userId,
      }),
    }).catch(() => null);
    return { sent: false, error: emailText || "No se pudo enviar el correo" };
  }

  const emailData = emailText ? (JSON.parse(emailText) as { id?: string }) : {};
  await serviceRequest("avisos_financieros", {
    method: "POST",
    body: JSON.stringify({
      cliente_id: client.id,
      bono_cliente_id: membershipId,
      pago_cliente_id: paymentId,
      tipo: type,
      destinatario: client.email,
      estado: "enviado",
      resend_id: emailData.id || null,
      created_by: userId,
    }),
  });
  return { sent: true, id: emailData.id || null };
}

async function getMembership(id: string) {
  const rows = await serviceRequest<MembershipRow[]>(
    `bonos_cliente?id=eq.${encodeURIComponent(id)}&select=*,clientes(id,nombre,email)&limit=1`
  );
  return rows[0] || null;
}

async function getPayment(id: string) {
  const rows = await serviceRequest<PaymentRow[]>(
    `pagos_cliente?id=eq.${encodeURIComponent(id)}&select=*,clientes(id,nombre,email)&limit=1`
  );
  return rows[0] || null;
}

async function createRenewal(original: MembershipRow, userId: string): Promise<RenewalResult> {
  const existingRows = await serviceRequest<MembershipRow[]>(
    `bonos_cliente?renovado_desde_id=eq.${encodeURIComponent(original.id)}&select=*,clientes(id,nombre,email)&limit=1`
  );
  if (existingRows[0]) {
    const paymentRows = await serviceRequest<PaymentRow[]>(
      `pagos_cliente?bono_cliente_id=eq.${encodeURIComponent(existingRows[0].id)}&select=*,clientes(id,nombre,email)&limit=1`
    );
    return { membership: existingRows[0], payment: paymentRows[0] || null, created: false, emailSent: false };
  }

  const today = todayMadrid();
  const naturalStart = addDays(original.fecha_fin, 1);
  const startDate = naturalStart < today ? today : naturalStart;
  const duration = Math.max(1, daysBetween(original.fecha_inicio, original.fecha_fin) + 1);
  const endDate = addDays(startDate, duration - 1);
  const state = startDate > today ? "programado" : "activo";

  const membershipRows = await serviceRequest<MembershipRow[]>("bonos_cliente", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      cliente_id: original.cliente_id,
      catalogo_bono_id: original.catalogo_bono_id,
      renovado_desde_id: original.id,
      nombre: original.nombre,
      modalidad: original.modalidad,
      sesiones_totales: original.sesiones_totales,
      sesiones_consumidas: 0,
      precio_eur: original.precio_eur,
      fecha_inicio: startDate,
      fecha_fin: endDate,
      estado: state,
      renovacion_automatica: original.renovacion_automatica,
      notas: original.notas,
      created_by: userId,
    }),
  });
  const createdMembership = membershipRows[0];
  if (!createdMembership) throw new Error("No se pudo crear la renovación");
  createdMembership.clientes = original.clientes;

  const paymentRows = await serviceRequest<PaymentRow[]>("pagos_cliente", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      cliente_id: original.cliente_id,
      bono_cliente_id: createdMembership.id,
      concepto: `Renovación ${original.nombre}`,
      importe_eur: original.precio_eur,
      fecha_emision: today,
      fecha_vencimiento: startDate,
      fecha_pago: null,
      metodo_pago: null,
      estado: "pendiente",
      referencia: null,
      notas: "Cuota generada desde la renovación del bono anterior.",
      created_by: userId,
    }),
  });
  const payment = paymentRows[0] || null;
  if (payment) payment.clientes = original.clientes;

  let emailSent = false;
  let emailError: string | undefined;
  if (original.clientes) {
    const result = await sendNotice({
      userId,
      type: "renovacion_generada",
      client: original.clientes,
      membershipId: createdMembership.id,
      subject: "Renovación de tu bono · Chetesaí Fitness+",
      introduction: "Hemos preparado la renovación de tu bono para el siguiente periodo.",
      details: [
        `Bono: ${original.nombre}`,
        `Nuevo periodo: ${formatDate(startDate)} – ${formatDate(endDate)}`,
        `Sesiones incluidas: ${original.sesiones_totales}`,
        `Importe pendiente: ${formatMoney(original.precio_eur)}`,
      ],
    });
    emailSent = Boolean(result.sent || result.alreadySent);
    emailError = result.error;
  }

  return { membership: createdMembership, payment, created: true, emailSent, emailError };
}

async function processAutomaticRenewals(userId: string) {
  const today = todayMadrid();
  const threshold = addDays(today, 7);
  await activateScheduledMemberships(today);
  await markOverduePayments(today);

  const candidates = await serviceRequest<MembershipRow[]>(
    `bonos_cliente?renovacion_automatica=eq.true&estado=in.(activo,agotado,vencido)&fecha_fin=lte.${threshold}&select=*,clientes(id,nombre,email)&order=fecha_fin.asc`
  );
  const results: RenewalResult[] = [];
  for (const candidate of candidates) {
    results.push(await createRenewal(candidate, userId));
  }
  return results;
}

export async function GET() {
  try {
    await assertProfessional();
    const today = todayMadrid();
    await activateScheduledMemberships(today);
    await markOverduePayments(today);

    const [memberships, overduePayments, notices] = await Promise.all([
      serviceRequest<MembershipRow[]>(
        "bonos_cliente?select=*,clientes(id,nombre,email)&order=fecha_fin.asc,created_at.asc"
      ),
      serviceRequest<PaymentRow[]>(
        "pagos_cliente?estado=eq.vencido&select=*,clientes(id,nombre,email)&order=fecha_vencimiento.asc"
      ),
      serviceRequest<NoticeRow[]>(
        "avisos_financieros?estado=eq.enviado&select=id,bono_cliente_id,pago_cliente_id,tipo,estado"
      ),
    ]);

    const sentKeys = new Set(
      notices.map((notice) => `${notice.tipo}:${notice.bono_cliente_id || notice.pago_cliente_id || ""}`)
    );
    const childByParent = new Map(
      memberships
        .filter((membership) => membership.renovado_desde_id)
        .map((membership) => [membership.renovado_desde_id as string, membership])
    );

    const alerts: Array<Record<string, unknown>> = [];
    for (const membership of memberships) {
      if (!["activo", "agotado"].includes(membership.estado)) continue;
      const remaining = Math.max(0, Number(membership.sesiones_totales) - Number(membership.sesiones_consumidas));
      const daysToExpiry = daysBetween(today, membership.fecha_fin);
      const child = childByParent.get(membership.id);

      if (remaining <= 2) {
        alerts.push({
          id: `pocas_sesiones-${membership.id}`,
          tipo: "pocas_sesiones",
          nivel: remaining === 0 ? "critico" : "aviso",
          titulo: remaining === 0 ? "Bono sin sesiones" : `Solo quedan ${remaining} sesiones`,
          descripcion: `${membership.clientes?.nombre || "Cliente"} · ${membership.nombre}`,
          cliente_nombre: membership.clientes?.nombre || "Cliente",
          email: membership.clientes?.email || null,
          bono_cliente_id: membership.id,
          pago_cliente_id: null,
          email_enviado: sentKeys.has(`pocas_sesiones:${membership.id}`),
          renovacion_automatica: membership.renovacion_automatica,
          renovacion_programada_id: child?.id || null,
        });
      }

      if (daysToExpiry >= 0 && daysToExpiry <= 7) {
        alerts.push({
          id: `proximo_vencimiento-${membership.id}`,
          tipo: "proximo_vencimiento",
          nivel: daysToExpiry <= 2 ? "critico" : "aviso",
          titulo: daysToExpiry === 0 ? "El bono vence hoy" : `El bono vence en ${daysToExpiry} días`,
          descripcion: `${membership.clientes?.nombre || "Cliente"} · ${membership.nombre} · ${formatDate(membership.fecha_fin)}`,
          cliente_nombre: membership.clientes?.nombre || "Cliente",
          email: membership.clientes?.email || null,
          bono_cliente_id: membership.id,
          pago_cliente_id: null,
          email_enviado: sentKeys.has(`proximo_vencimiento:${membership.id}`),
          renovacion_automatica: membership.renovacion_automatica,
          renovacion_programada_id: child?.id || null,
        });
      }
    }

    for (const payment of overduePayments) {
      alerts.push({
        id: `cuota_vencida-${payment.id}`,
        tipo: "cuota_vencida",
        nivel: "critico",
        titulo: `Cuota vencida · ${formatMoney(payment.importe_eur)}`,
        descripcion: `${payment.clientes?.nombre || "Cliente"} · ${payment.concepto}`,
        cliente_nombre: payment.clientes?.nombre || "Cliente",
        email: payment.clientes?.email || null,
        bono_cliente_id: payment.bono_cliente_id,
        pago_cliente_id: payment.id,
        email_enviado: sentKeys.has(`cuota_vencida:${payment.id}`),
      });
    }

    const scheduled = memberships
      .filter((membership) => membership.estado === "programado")
      .map((membership) => ({
        id: membership.id,
        cliente_nombre: membership.clientes?.nombre || "Cliente",
        nombre: membership.nombre,
        fecha_inicio: membership.fecha_inicio,
        fecha_fin: membership.fecha_fin,
        precio_eur: membership.precio_eur,
      }));

    return NextResponse.json({
      ok: true,
      data: {
        alertas: alerts,
        renovaciones_programadas: scheduled,
        resumen: {
          total_alertas: alerts.length,
          cuotas_vencidas: overduePayments.length,
          renovaciones_programadas: scheduled.length,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar alertas financieras";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await assertProfessional();
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = String(body.action || "");

    if (action === "procesar_automaticas") {
      const results = await processAutomaticRenewals(userId);
      return NextResponse.json({
        ok: true,
        data: {
          creadas: results.filter((result) => result.created).length,
          existentes: results.filter((result) => !result.created).length,
          correos_enviados: results.filter((result) => result.emailSent).length,
        },
      });
    }

    if (action === "generar_renovacion") {
      const membershipId = String(body.bono_cliente_id || "").trim();
      if (!membershipId) {
        return NextResponse.json({ ok: false, error: "Falta el bono a renovar" }, { status: 400 });
      }
      const membership = await getMembership(membershipId);
      if (!membership) return NextResponse.json({ ok: false, error: "Bono no encontrado" }, { status: 404 });
      const result = await createRenewal(membership, userId);
      return NextResponse.json({ ok: true, data: result });
    }

    if (action === "enviar_aviso") {
      const type = String(body.tipo || "") as NoticeType;
      if (!["pocas_sesiones", "proximo_vencimiento", "cuota_vencida"].includes(type)) {
        return NextResponse.json({ ok: false, error: "Tipo de aviso no válido" }, { status: 400 });
      }

      if (type === "cuota_vencida") {
        const paymentId = String(body.pago_cliente_id || "").trim();
        const payment = paymentId ? await getPayment(paymentId) : null;
        if (!payment || !payment.clientes) {
          return NextResponse.json({ ok: false, error: "Cuota o cliente no encontrado" }, { status: 404 });
        }
        const result = await sendNotice({
          userId,
          type,
          client: payment.clientes,
          paymentId: payment.id,
          membershipId: payment.bono_cliente_id,
          subject: "Recordatorio de cuota pendiente · Chetesaí Fitness+",
          introduction: "Te recordamos que tienes una cuota pendiente de regularizar.",
          details: [
            `Concepto: ${payment.concepto}`,
            `Importe: ${formatMoney(payment.importe_eur)}`,
            `Fecha de vencimiento: ${payment.fecha_vencimiento ? formatDate(payment.fecha_vencimiento) : "sin fecha"}`,
          ],
        });
        return NextResponse.json({ ok: true, data: result });
      }

      const membershipId = String(body.bono_cliente_id || "").trim();
      const membership = membershipId ? await getMembership(membershipId) : null;
      if (!membership || !membership.clientes) {
        return NextResponse.json({ ok: false, error: "Bono o cliente no encontrado" }, { status: 404 });
      }
      const remaining = Math.max(0, membership.sesiones_totales - membership.sesiones_consumidas);
      const isLow = type === "pocas_sesiones";
      const result = await sendNotice({
        userId,
        type,
        client: membership.clientes,
        membershipId: membership.id,
        subject: isLow
          ? "Aviso sobre tus sesiones disponibles · Chetesaí Fitness+"
          : "Tu bono está próximo a vencer · Chetesaí Fitness+",
        introduction: isLow
          ? "Tu bono se está acercando al final de sus sesiones disponibles."
          : "Tu bono se acerca a su fecha de vencimiento.",
        details: isLow
          ? [
              `Bono: ${membership.nombre}`,
              `Sesiones disponibles: ${remaining} de ${membership.sesiones_totales}`,
              `Vigencia hasta: ${formatDate(membership.fecha_fin)}`,
            ]
          : [
              `Bono: ${membership.nombre}`,
              `Fecha de vencimiento: ${formatDate(membership.fecha_fin)}`,
              `Sesiones disponibles: ${remaining}`,
            ],
      });
      return NextResponse.json({ ok: true, data: result });
    }

    return NextResponse.json({ ok: false, error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al procesar renovaciones";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}
