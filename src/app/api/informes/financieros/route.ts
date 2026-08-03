import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Cliente = {
  id: string;
  nombre: string;
  email: string | null;
};

type Pago = {
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
  referencia: string | null;
  notas: string | null;
  created_at: string;
  clientes: Cliente | null;
};

type Bono = {
  id: string;
  cliente_id: string;
  nombre: string;
  modalidad: string;
  sesiones_totales: number;
  sesiones_consumidas: number;
  precio_eur: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  renovacion_automatica: boolean;
  renovado_desde_id: string | null;
  created_at: string;
  clientes: Cliente | null;
};

type Consumo = {
  id: string;
  bono_cliente_id: string;
  sesion_id: string | null;
  cantidad: number;
  concepto: string;
  fecha: string;
  created_at: string;
};

type Sesion = {
  id: string;
  cliente_id: string;
  tipo_sesion: string;
  estado: string;
  inicio_at: string;
  duracion_minutos: number;
};

type MonthRow = {
  mes: string;
  etiqueta: string;
  facturado: number;
  cobrado: number;
  pendiente: number;
  bonos: number;
  sesiones_consumidas: number;
  sesiones_realizadas: number;
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

function validDate(value: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00Z`).getTime()));
}

function resolveRange(request: NextRequest) {
  const today = todayMadrid();
  const defaultStart = `${today.slice(0, 4)}-01-01`;
  const requestedStart = request.nextUrl.searchParams.get("desde");
  const requestedEnd = request.nextUrl.searchParams.get("hasta");
  const desde = validDate(requestedStart) ? String(requestedStart) : defaultStart;
  const hasta = validDate(requestedEnd) ? String(requestedEnd) : today;
  if (desde > hasta) throw new Error("El inicio del periodo no puede ser posterior al final");

  const startTime = new Date(`${desde}T12:00:00Z`).getTime();
  const endTime = new Date(`${hasta}T12:00:00Z`).getTime();
  if ((endTime - startTime) / 86400000 > 1096) {
    throw new Error("El periodo máximo del informe es de tres años");
  }
  return { desde, hasta };
}

function inRange(value: string | null | undefined, desde: string, hasta: string) {
  if (!value) return false;
  const date = value.length > 10 ? dateMadrid(value) : value.slice(0, 10);
  return date >= desde && date <= hasta;
}

function monthKey(value: string) {
  return value.slice(0, 7);
}

function monthLabel(key: string) {
  return new Intl.DateTimeFormat("es-ES", { month: "short", year: "2-digit", timeZone: "UTC" })
    .format(new Date(`${key}-15T12:00:00Z`))
    .replace(".", "");
}

function monthSequence(desde: string, hasta: string) {
  const rows: MonthRow[] = [];
  const cursor = new Date(`${desde.slice(0, 7)}-01T12:00:00Z`);
  const end = new Date(`${hasta.slice(0, 7)}-01T12:00:00Z`);
  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 7);
    rows.push({
      mes: key,
      etiqueta: monthLabel(key),
      facturado: 0,
      cobrado: 0,
      pendiente: 0,
      bonos: 0,
      sesiones_consumidas: 0,
      sesiones_realizadas: 0,
    });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return rows;
}

function roundMoney(value: number) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

function formatMoneyPlain(value: number) {
  return roundMoney(value).toFixed(2).replace(".", ",");
}

function statusFor(message: string) {
  if (message === "No autenticado") return 401;
  if (message === "No autorizado") return 403;
  if (message.includes("periodo")) return 400;
  return 500;
}

export async function GET(request: NextRequest) {
  try {
    await assertProfessional();
    const { desde, hasta } = resolveRange(request);
    const today = todayMadrid();

    await serviceRequest(
      `pagos_cliente?estado=eq.pendiente&fecha_vencimiento=lt.${today}`,
      { method: "PATCH", body: JSON.stringify({ estado: "vencido" }) }
    );

    const [payments, memberships, consumptions, sessions] = await Promise.all([
      serviceRequest<Pago[]>(
        "pagos_cliente?select=*,clientes(id,nombre,email)&order=fecha_emision.desc,created_at.desc&limit=5000"
      ),
      serviceRequest<Bono[]>(
        "bonos_cliente?select=*,clientes(id,nombre,email)&order=created_at.desc&limit=5000"
      ),
      serviceRequest<Consumo[]>(
        "consumos_bono?select=id,bono_cliente_id,sesion_id,cantidad,concepto,fecha,created_at&order=fecha.desc,created_at.desc&limit=5000"
      ),
      serviceRequest<Sesion[]>(
        "sesiones_agenda?select=id,cliente_id,tipo_sesion,estado,inicio_at,duracion_minutos&order=inicio_at.desc&limit=5000"
      ),
    ]);

    const months = monthSequence(desde, hasta);
    const monthMap = new Map(months.map((row) => [row.mes, row]));
    const membershipMap = new Map(memberships.map((membership) => [membership.id, membership]));

    const issuedInPeriod = payments.filter(
      (payment) => payment.estado !== "anulado" && inRange(payment.fecha_emision, desde, hasta)
    );
    const paidInPeriod = payments.filter(
      (payment) => payment.estado === "pagado" && inRange(payment.fecha_pago, desde, hasta)
    );
    const pendingInPeriod = issuedInPeriod.filter((payment) => ["pendiente", "vencido"].includes(payment.estado));
    const overdueInPeriod = issuedInPeriod.filter((payment) => payment.estado === "vencido");
    const membershipsInPeriod = memberships.filter((membership) => inRange(membership.created_at, desde, hasta));
    const consumptionsInPeriod = consumptions.filter((consumption) => inRange(consumption.fecha, desde, hasta));
    const realizedSessionsInPeriod = sessions.filter(
      (session) => session.estado === "realizada" && inRange(session.inicio_at, desde, hasta)
    );
    const noShowsInPeriod = sessions.filter(
      (session) => session.estado === "no_asistio" && inRange(session.inicio_at, desde, hasta)
    );

    for (const payment of issuedInPeriod) {
      const row = monthMap.get(monthKey(payment.fecha_emision));
      if (!row) continue;
      row.facturado += Number(payment.importe_eur || 0);
      if (["pendiente", "vencido"].includes(payment.estado)) row.pendiente += Number(payment.importe_eur || 0);
    }
    for (const payment of paidInPeriod) {
      if (!payment.fecha_pago) continue;
      const row = monthMap.get(monthKey(payment.fecha_pago));
      if (row) row.cobrado += Number(payment.importe_eur || 0);
    }
    for (const membership of membershipsInPeriod) {
      const key = dateMadrid(membership.created_at).slice(0, 7);
      const row = monthMap.get(key);
      if (row) row.bonos += 1;
    }
    for (const consumption of consumptionsInPeriod) {
      const row = monthMap.get(monthKey(consumption.fecha));
      if (row) row.sesiones_consumidas += Number(consumption.cantidad || 0);
    }
    for (const session of realizedSessionsInPeriod) {
      const row = monthMap.get(dateMadrid(session.inicio_at).slice(0, 7));
      if (row) row.sesiones_realizadas += 1;
    }

    const totalBilled = issuedInPeriod.reduce((sum, payment) => sum + Number(payment.importe_eur || 0), 0);
    const totalCollected = paidInPeriod.reduce((sum, payment) => sum + Number(payment.importe_eur || 0), 0);
    const totalPending = pendingInPeriod.reduce((sum, payment) => sum + Number(payment.importe_eur || 0), 0);
    const totalOverdue = overdueInPeriod.reduce((sum, payment) => sum + Number(payment.importe_eur || 0), 0);
    const issuedCollected = issuedInPeriod
      .filter((payment) => payment.estado === "pagado")
      .reduce((sum, payment) => sum + Number(payment.importe_eur || 0), 0);
    const sessionsConsumed = consumptionsInPeriod.reduce(
      (sum, consumption) => sum + Number(consumption.cantidad || 0),
      0
    );

    const methodMap = new Map<string, { metodo: string; operaciones: number; importe: number }>();
    for (const payment of paidInPeriod) {
      const method = payment.metodo_pago || "sin_especificar";
      const current = methodMap.get(method) || { metodo: method, operaciones: 0, importe: 0 };
      current.operaciones += 1;
      current.importe += Number(payment.importe_eur || 0);
      methodMap.set(method, current);
    }

    const planMap = new Map<string, { nombre: string; modalidad: string; unidades: number; importe: number; renovaciones: number }>();
    for (const membership of membershipsInPeriod) {
      const key = `${membership.nombre}|${membership.modalidad}`;
      const current = planMap.get(key) || {
        nombre: membership.nombre,
        modalidad: membership.modalidad,
        unidades: 0,
        importe: 0,
        renovaciones: 0,
      };
      current.unidades += 1;
      current.importe += Number(membership.precio_eur || 0);
      if (membership.renovado_desde_id) current.renovaciones += 1;
      planMap.set(key, current);
    }

    const clientMap = new Map<string, { cliente_id: string; nombre: string; operaciones: number; importe: number }>();
    for (const payment of paidInPeriod) {
      const key = payment.cliente_id;
      const current = clientMap.get(key) || {
        cliente_id: key,
        nombre: payment.clientes?.nombre || "Cliente",
        operaciones: 0,
        importe: 0,
      };
      current.operaciones += 1;
      current.importe += Number(payment.importe_eur || 0);
      clientMap.set(key, current);
    }

    const movements = payments
      .filter(
        (payment) =>
          inRange(payment.fecha_emision, desde, hasta) ||
          inRange(payment.fecha_pago, desde, hasta)
      )
      .sort((a, b) => {
        const dateA = a.fecha_pago || a.fecha_emision;
        const dateB = b.fecha_pago || b.fecha_emision;
        return dateB.localeCompare(dateA);
      })
      .map((payment) => ({
        id: payment.id,
        fecha_emision: payment.fecha_emision,
        fecha_vencimiento: payment.fecha_vencimiento,
        fecha_pago: payment.fecha_pago,
        cliente: payment.clientes?.nombre || "Cliente",
        email: payment.clientes?.email || null,
        concepto: payment.concepto,
        estado: payment.estado,
        metodo_pago: payment.metodo_pago,
        importe_eur: roundMoney(Number(payment.importe_eur || 0)),
        referencia: payment.referencia,
      }));

    const data = {
      periodo: { desde, hasta },
      resumen: {
        facturado: roundMoney(totalBilled),
        cobrado: roundMoney(totalCollected),
        pendiente: roundMoney(totalPending),
        vencido: roundMoney(totalOverdue),
        ticket_medio: roundMoney(paidInPeriod.length ? totalCollected / paidInPeriod.length : 0),
        tasa_cobro_pct: roundMoney(totalBilled ? (issuedCollected / totalBilled) * 100 : 0),
        operaciones_cobradas: paidInPeriod.length,
        bonos_vendidos: membershipsInPeriod.length,
        renovaciones: membershipsInPeriod.filter((membership) => membership.renovado_desde_id).length,
        sesiones_consumidas: sessionsConsumed,
        sesiones_realizadas: realizedSessionsInPeriod.length,
        no_asistencias: noShowsInPeriod.length,
      },
      meses: months.map((row) => ({
        ...row,
        facturado: roundMoney(row.facturado),
        cobrado: roundMoney(row.cobrado),
        pendiente: roundMoney(row.pendiente),
      })),
      metodos_pago: Array.from(methodMap.values())
        .map((row) => ({ ...row, importe: roundMoney(row.importe) }))
        .sort((a, b) => b.importe - a.importe),
      planes: Array.from(planMap.values())
        .map((row) => ({ ...row, importe: roundMoney(row.importe) }))
        .sort((a, b) => b.unidades - a.unidades),
      clientes: Array.from(clientMap.values())
        .map((row) => ({ ...row, importe: roundMoney(row.importe) }))
        .sort((a, b) => b.importe - a.importe)
        .slice(0, 10),
      movimientos: movements,
      actividad: {
        consumos: consumptionsInPeriod.map((consumption) => {
          const membership = membershipMap.get(consumption.bono_cliente_id);
          return {
            id: consumption.id,
            fecha: consumption.fecha,
            cantidad: consumption.cantidad,
            concepto: consumption.concepto,
            bono: membership?.nombre || "Bono",
            cliente: membership?.clientes?.nombre || "Cliente",
          };
        }),
      },
    };

    if (request.nextUrl.searchParams.get("formato") === "csv") {
      const headerRows = [
        ["Informe financiero Chetesaí Fitness+"],
        ["Periodo", desde, hasta],
        ["Facturado", formatMoneyPlain(data.resumen.facturado)],
        ["Cobrado", formatMoneyPlain(data.resumen.cobrado)],
        ["Pendiente", formatMoneyPlain(data.resumen.pendiente)],
        ["Vencido", formatMoneyPlain(data.resumen.vencido)],
        ["Bonos vendidos", String(data.resumen.bonos_vendidos)],
        ["Sesiones consumidas", String(data.resumen.sesiones_consumidas)],
        [],
        [
          "Fecha emisión",
          "Fecha vencimiento",
          "Fecha pago",
          "Cliente",
          "Email",
          "Concepto",
          "Estado",
          "Método",
          "Importe EUR",
          "Referencia",
        ],
      ];
      const detailRows = movements.map((movement) => [
        movement.fecha_emision,
        movement.fecha_vencimiento || "",
        movement.fecha_pago || "",
        movement.cliente,
        movement.email || "",
        movement.concepto,
        movement.estado,
        movement.metodo_pago || "",
        formatMoneyPlain(movement.importe_eur),
        movement.referencia || "",
      ]);
      const csv = "\uFEFFsep=;\n" + [...headerRows, ...detailRows]
        .map((row) => row.map(csvCell).join(";"))
        .join("\n");
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="chetesai-informe-${desde}-${hasta}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al generar el informe financiero";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}
