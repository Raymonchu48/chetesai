import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Client = {
  id: string;
  nombre: string;
  email: string | null;
  estado: string;
  fecha_alta: string | null;
};

type Session = {
  id: string;
  cliente_id: string;
  titulo: string;
  inicio_at: string;
  duracion_minutos: number;
  tipo_sesion: string;
  estado: string;
  modalidad: string;
  clientes: { id: string; nombre: string; email: string | null } | null;
};

type RequestRow = {
  id: string;
  nombre: string;
  email: string;
  estado: string;
  created_at: string;
  fecha_preferida: string | null;
  franja_horaria: string | null;
};

type Payment = {
  id: string;
  cliente_id: string;
  concepto: string;
  importe_eur: number;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  fecha_pago: string | null;
  estado: string;
  metodo_pago: string | null;
  created_at: string;
  clientes: { id: string; nombre: string; email: string | null } | null;
};

type Membership = {
  id: string;
  cliente_id: string;
  nombre: string;
  estado: string;
  sesiones_totales: number;
  sesiones_consumidas: number;
  fecha_inicio: string;
  fecha_fin: string;
  renovacion_automatica: boolean;
  created_at: string;
  clientes: { id: string; nombre: string; email: string | null } | null;
};

type AlertItem = {
  id: string;
  tipo: "solicitud" | "agenda" | "bono" | "pago";
  nivel: "critico" | "aviso" | "info";
  titulo: string;
  detalle: string;
  href: string;
};

type ActivityItem = {
  id: string;
  tipo: "sesion" | "pago" | "solicitud" | "bono";
  titulo: string;
  detalle: string;
  fecha: string;
  href: string;
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
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    }
  );
  const profiles = profileResponse.ok
    ? ((await profileResponse.json()) as Array<{ role?: string; activo?: boolean }>)
    : [];
  const profile = profiles[0];
  if (!profile || profile.activo === false || !["administrador", "profesional"].includes(profile.role || "")) {
    throw new Error("No autorizado");
  }
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

function dateMadrid(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
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

function money(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function monthLabel(key: string) {
  return new Intl.DateTimeFormat("es-ES", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  })
    .format(new Date(`${key}-15T12:00:00Z`))
    .replace(".", "");
}

function lastSixMonths(today: string) {
  const rows: Array<{ mes: string; etiqueta: string; facturado: number; cobrado: number }> = [];
  const cursor = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
  cursor.setUTCMonth(cursor.getUTCMonth() - 5);
  for (let index = 0; index < 6; index += 1) {
    const key = cursor.toISOString().slice(0, 7);
    rows.push({ mes: key, etiqueta: monthLabel(key), facturado: 0, cobrado: 0 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return rows;
}

function sessionLabel(type: string) {
  const labels: Record<string, string> = {
    valoracion_inicial: "Valoración inicial",
    entrenamiento_personal: "Entrenamiento personal",
    grupo_reducido: "Grupo reducido",
    revision_progreso: "Revisión de progreso",
    nutricion: "Nutrición",
    online: "Sesión online",
    otro: "Otra sesión",
  };
  return labels[type] || type;
}

function statusFor(message: string) {
  return message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
}

export async function GET() {
  try {
    await assertProfessional();
    const today = todayMadrid();
    const monthStart = `${today.slice(0, 7)}-01`;
    const nextSevenEnd = addDays(today, 7);

    await Promise.all([
      serviceRequest(`pagos_cliente?estado=eq.pendiente&fecha_vencimiento=lt.${today}`, {
        method: "PATCH",
        body: JSON.stringify({ estado: "vencido" }),
      }),
      serviceRequest(`bonos_cliente?estado=eq.programado&fecha_inicio=lte.${today}`, {
        method: "PATCH",
        body: JSON.stringify({ estado: "activo" }),
      }),
      serviceRequest(`bonos_cliente?estado=eq.activo&fecha_fin=lt.${today}`, {
        method: "PATCH",
        body: JSON.stringify({ estado: "vencido" }),
      }),
    ]);

    const [clients, sessions, requests, payments, memberships] = await Promise.all([
      serviceRequest<Client[]>(
        "clientes?select=id,nombre,email,estado,fecha_alta&order=fecha_alta.desc&limit=5000"
      ),
      serviceRequest<Session[]>(
        "sesiones_agenda?select=id,cliente_id,titulo,inicio_at,duracion_minutos,tipo_sesion,estado,modalidad,clientes(id,nombre,email)&order=inicio_at.asc&limit=5000"
      ),
      serviceRequest<RequestRow[]>(
        "solicitudes_reserva?select=id,nombre,email,estado,created_at,fecha_preferida,franja_horaria&order=created_at.desc&limit=2000"
      ),
      serviceRequest<Payment[]>(
        "pagos_cliente?select=id,cliente_id,concepto,importe_eur,fecha_emision,fecha_vencimiento,fecha_pago,estado,metodo_pago,created_at,clientes(id,nombre,email)&order=created_at.desc&limit=5000"
      ),
      serviceRequest<Membership[]>(
        "bonos_cliente?select=id,cliente_id,nombre,estado,sesiones_totales,sesiones_consumidas,fecha_inicio,fecha_fin,renovacion_automatica,created_at,clientes(id,nombre,email)&order=created_at.desc&limit=5000"
      ),
    ]);

    const activeClients = clients.filter((client) => client.estado === "activo").length;
    const prospectiveClients = clients.filter((client) => client.estado === "prueba").length;
    const newRequests = requests.filter((request) => request.estado === "nueva");
    const pendingSessions = sessions.filter((session) => session.estado === "pendiente");

    const sessionsToday = sessions.filter(
      (session) => dateMadrid(session.inicio_at) === today && session.estado !== "cancelada"
    );
    const upcomingSeven = sessions.filter((session) => {
      const date = dateMadrid(session.inicio_at);
      return date >= today && date <= nextSevenEnd && session.estado !== "cancelada";
    });

    const billedThisMonth = payments
      .filter((payment) => payment.estado !== "anulado" && payment.fecha_emision >= monthStart && payment.fecha_emision <= today)
      .reduce((sum, payment) => sum + Number(payment.importe_eur || 0), 0);
    const collectedThisMonth = payments
      .filter(
        (payment) => payment.estado === "pagado" && payment.fecha_pago && payment.fecha_pago >= monthStart && payment.fecha_pago <= today
      )
      .reduce((sum, payment) => sum + Number(payment.importe_eur || 0), 0);
    const pendingAmount = payments
      .filter((payment) => ["pendiente", "vencido"].includes(payment.estado))
      .reduce((sum, payment) => sum + Number(payment.importe_eur || 0), 0);
    const overdueAmount = payments
      .filter((payment) => payment.estado === "vencido")
      .reduce((sum, payment) => sum + Number(payment.importe_eur || 0), 0);

    const activeMemberships = memberships.filter((membership) => membership.estado === "activo");
    const availableSessions = activeMemberships.reduce(
      (sum, membership) => sum + Math.max(0, Number(membership.sesiones_totales) - Number(membership.sesiones_consumidas)),
      0
    );

    const alerts: AlertItem[] = [];
    for (const request of newRequests.slice(0, 4)) {
      alerts.push({
        id: `solicitud-${request.id}`,
        tipo: "solicitud",
        nivel: "aviso",
        titulo: "Nueva solicitud de valoración",
        detalle: `${request.nombre} · ${request.fecha_preferida || "fecha por concretar"}${request.franja_horaria ? ` · ${request.franja_horaria}` : ""}`,
        href: "/sesiones",
      });
    }
    for (const session of pendingSessions.slice(0, 4)) {
      alerts.push({
        id: `agenda-${session.id}`,
        tipo: "agenda",
        nivel: "aviso",
        titulo: "Cita pendiente de confirmar",
        detalle: `${session.clientes?.nombre || "Cliente"} · ${sessionLabel(session.tipo_sesion)}`,
        href: "/sesiones",
      });
    }
    for (const membership of activeMemberships) {
      const remaining = Math.max(0, Number(membership.sesiones_totales) - Number(membership.sesiones_consumidas));
      const daysToExpiry = daysBetween(today, membership.fecha_fin);
      if (remaining <= 2) {
        alerts.push({
          id: `bono-sesiones-${membership.id}`,
          tipo: "bono",
          nivel: remaining === 0 ? "critico" : "aviso",
          titulo: remaining === 0 ? "Bono agotado" : `Bono con ${remaining} sesiones`,
          detalle: `${membership.clientes?.nombre || "Cliente"} · ${membership.nombre}`,
          href: "/pagos",
        });
      } else if (daysToExpiry >= 0 && daysToExpiry <= 7) {
        alerts.push({
          id: `bono-vencimiento-${membership.id}`,
          tipo: "bono",
          nivel: daysToExpiry <= 2 ? "critico" : "aviso",
          titulo: daysToExpiry === 0 ? "Bono vence hoy" : `Bono vence en ${daysToExpiry} días`,
          detalle: `${membership.clientes?.nombre || "Cliente"} · ${membership.nombre}`,
          href: "/pagos",
        });
      }
    }
    for (const payment of payments.filter((item) => item.estado === "vencido").slice(0, 4)) {
      alerts.push({
        id: `pago-${payment.id}`,
        tipo: "pago",
        nivel: "critico",
        titulo: `Cuota vencida · ${money(payment.importe_eur).toFixed(2)} €`,
        detalle: `${payment.clientes?.nombre || "Cliente"} · ${payment.concepto}`,
        href: "/pagos",
      });
    }

    alerts.sort((a, b) => {
      const priority = { critico: 0, aviso: 1, info: 2 };
      return priority[a.nivel] - priority[b.nivel];
    });

    const upcoming = upcomingSeven
      .filter((session) => new Date(session.inicio_at).getTime() >= Date.now())
      .sort((a, b) => a.inicio_at.localeCompare(b.inicio_at))
      .slice(0, 6)
      .map((session) => ({
        id: session.id,
        titulo: session.titulo,
        cliente: session.clientes?.nombre || "Cliente",
        inicio_at: session.inicio_at,
        duracion_minutos: session.duracion_minutos,
        estado: session.estado,
        modalidad: session.modalidad,
      }));

    const activity: ActivityItem[] = [
      ...sessions
        .filter((session) => session.estado === "realizada")
        .map((session) => ({
          id: `sesion-${session.id}`,
          tipo: "sesion" as const,
          titulo: "Sesión realizada",
          detalle: `${session.clientes?.nombre || "Cliente"} · ${sessionLabel(session.tipo_sesion)}`,
          fecha: session.inicio_at,
          href: "/sesiones",
        })),
      ...payments.map((payment) => ({
        id: `pago-${payment.id}`,
        tipo: "pago" as const,
        titulo: payment.estado === "pagado" ? "Pago registrado" : "Cuota generada",
        detalle: `${payment.clientes?.nombre || "Cliente"} · ${money(payment.importe_eur).toFixed(2)} €`,
        fecha: payment.created_at,
        href: "/pagos",
      })),
      ...requests.map((request) => ({
        id: `solicitud-${request.id}`,
        tipo: "solicitud" as const,
        titulo: "Solicitud recibida",
        detalle: request.nombre,
        fecha: request.created_at,
        href: "/sesiones",
      })),
      ...memberships.map((membership) => ({
        id: `bono-${membership.id}`,
        tipo: "bono" as const,
        titulo: membership.estado === "programado" ? "Renovación programada" : "Bono asignado",
        detalle: `${membership.clientes?.nombre || "Cliente"} · ${membership.nombre}`,
        fecha: membership.created_at,
        href: "/pagos",
      })),
    ]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, 8);

    const months = lastSixMonths(today);
    const monthMap = new Map(months.map((row) => [row.mes, row]));
    for (const payment of payments) {
      if (payment.estado !== "anulado") {
        const issuedMonth = payment.fecha_emision.slice(0, 7);
        const row = monthMap.get(issuedMonth);
        if (row) row.facturado += Number(payment.importe_eur || 0);
      }
      if (payment.estado === "pagado" && payment.fecha_pago) {
        const paidMonth = payment.fecha_pago.slice(0, 7);
        const row = monthMap.get(paidMonth);
        if (row) row.cobrado += Number(payment.importe_eur || 0);
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        fecha: today,
        resumen: {
          clientes_total: clients.length,
          clientes_activos: activeClients,
          clientes_potenciales: prospectiveClients,
          sesiones_hoy: sessionsToday.length,
          proximos_siete_dias: upcomingSeven.length,
          citas_pendientes: pendingSessions.length,
          solicitudes_nuevas: newRequests.length,
          facturado_mes: money(billedThisMonth),
          cobrado_mes: money(collectedThisMonth),
          pendiente_total: money(pendingAmount),
          vencido_total: money(overdueAmount),
          bonos_activos: activeMemberships.length,
          sesiones_disponibles: availableSessions,
          alertas_activas: alerts.length,
        },
        proximas_sesiones: upcoming,
        alertas: alerts.slice(0, 10),
        actividad: activity,
        meses: months.map((row) => ({
          ...row,
          facturado: money(row.facturado),
          cobrado: money(row.cobrado),
        })),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al obtener el dashboard";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}
