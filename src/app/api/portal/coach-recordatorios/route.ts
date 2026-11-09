import { NextResponse } from "next/server";
import { getClientFromSession, serviceRequest } from "@/lib/events-server";

export const runtime = "nodejs";
type Bono = { id: string; nombre: string; sesiones_totales: number; sesiones_consumidas: number; fecha_fin: string | null; estado: string; renovacion_automatica: boolean | null };
type Evento = { id: string; titulo: string; fecha_inicio: string; fecha_limite_inscripcion: string | null; estado: string };
type Inscripcion = { evento_id: string; estado: string };
type Aviso = { id: string; tipo: "bono" | "evento"; texto: string; href: string };

function todayMadrid() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const val = (type: string) => parts.find(p => p.type === type)?.value || "";
  return `${val("year")}-${val("month")}-${val("day")}`;
}
function daysUntilDate(iso: string, today: string) {
  return Math.round((Date.parse(iso.slice(0, 10) + "T00:00:00Z") - Date.parse(today + "T00:00:00Z")) / 86400000);
}
function validText(value: string) { return value.replace(/[<>]/g, "").slice(0, 110); }

export async function GET() {
  try {
    const client = await getClientFromSession();
    const now = new Date();
    const today = todayMadrid();
    const [bonos, eventos, inscripciones] = await Promise.all([
      serviceRequest<Bono[]>(`bonos_cliente?cliente_id=eq.${encodeURIComponent(client.id)}&estado=eq.activo&select=id,nombre,sesiones_totales,sesiones_consumidas,fecha_fin,estado,renovacion_automatica&order=fecha_fin.asc.nullslast&limit=20`),
      serviceRequest<Evento[]>("eventos?estado=eq.publicado&select=id,titulo,fecha_inicio,fecha_limite_inscripcion,estado&order=fecha_inicio.asc&limit=30"),
      serviceRequest<Inscripcion[]>(`inscripciones_eventos?cliente_id=eq.${encodeURIComponent(client.id)}&select=evento_id,estado&limit=100`),
    ]);
    const avisos: Aviso[] = [];
    for (const bono of bonos) {
      const restantes = Math.max(0, Number(bono.sesiones_totales) - Number(bono.sesiones_consumidas));
      const dias = bono.fecha_fin ? daysUntilDate(bono.fecha_fin, today) : null;
      const agotamiento = restantes <= 2;
      const vencimiento = dias !== null && dias >= 0 && dias <= 7;
      if (!agotamiento && !vencimiento) continue;
      const nombre = validText(bono.nombre);
      const partes: string[] = [];
      if (agotamiento) partes.push(restantes === 0 ? "no te quedan sesiones" : `te ${restantes === 1 ? "queda 1 sesión" : "quedan " + restantes + " sesiones"}`);
      if (vencimiento) partes.push(dias === 0 ? "vence hoy" : `vence en ${dias} ${dias === 1 ? "día" : "días"}`);
      avisos.push({
        id: "bono:" + bono.id, tipo: "bono",
        texto: `Tu bono «${nombre}»: ${partes.join(" y ")}. ${bono.renovacion_automatica ? "Tiene renovación automática configurada; revisa sus condiciones." : "Consulta su renovación en tu área de cliente o contacta con tu profesional."}`,
        href: "/portal",
      });
    }
    const registration = new Map(inscripciones.map(i => [i.evento_id, i.estado]));
    for (const evento of eventos) {
      const start = new Date(evento.fecha_inicio);
      const days = daysUntilDate(evento.fecha_inicio, today);
      if (!(start.getTime() > now.getTime()) || days > 14 || days < 0) continue;
      const estado = registration.get(evento.id);
      if (["cancelada", "rechazada"].includes(estado || "")) continue;
      const fecha = new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit" }).format(start);
      const title = validText(evento.titulo);
      if (estado === "confirmada") {
        avisos.push({ id: "evento:" + evento.id, tipo: "evento", texto: `Recuerda: tienes confirmada tu inscripción a «${title}» el ${fecha}.`, href: "/portal/eventos" });
      } else if (estado === "lista_espera") {
        avisos.push({ id: "evento:" + evento.id, tipo: "evento", texto: `El evento «${title}» será el ${fecha}. Tu inscripción sigue en lista de espera.`, href: "/portal/eventos" });
      } else if (!estado && (!evento.fecha_limite_inscripcion || new Date(evento.fecha_limite_inscripcion).getTime() > now.getTime())) {
        avisos.push({ id: "evento:" + evento.id, tipo: "evento", texto: `Próximo evento especial: «${title}», el ${fecha}. Puedes consultar los detalles e inscribirte desde Eventos.`, href: "/portal/eventos" });
      }
    }
    return NextResponse.json({ ok: true, avisos: avisos.slice(0, 5) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar los recordatorios";
    return NextResponse.json({ ok: false, error: message }, { status: /No autenticado|Sesión no válida/.test(message) ? 401 : 500 });
  }
}
