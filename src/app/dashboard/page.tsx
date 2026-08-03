"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Inbox,
  Plus,
  RefreshCw,
  TicketCheck,
  TrendingUp,
  UserPlus,
  Users,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

type Summary = {
  clientes_total: number;
  clientes_activos: number;
  clientes_potenciales: number;
  sesiones_hoy: number;
  proximos_siete_dias: number;
  citas_pendientes: number;
  solicitudes_nuevas: number;
  facturado_mes: number;
  cobrado_mes: number;
  pendiente_total: number;
  vencido_total: number;
  bonos_activos: number;
  sesiones_disponibles: number;
  alertas_activas: number;
};

type UpcomingSession = {
  id: string;
  titulo: string;
  cliente: string;
  inicio_at: string;
  duracion_minutos: number;
  estado: string;
  modalidad: string;
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

type MonthRow = {
  mes: string;
  etiqueta: string;
  facturado: number;
  cobrado: number;
};

type DashboardData = {
  fecha: string;
  resumen: Summary;
  proximas_sesiones: UpcomingSession[];
  alertas: AlertItem[];
  actividad: ActivityItem[];
  meses: MonthRow[];
};

const sessionStateLabels: Record<string, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  no_asistio: "No asistió",
};

const sessionStateClasses: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  confirmada: "bg-blue-100 text-blue-800",
  realizada: "bg-emerald-100 text-emerald-800",
  cancelada: "bg-red-100 text-red-800",
  no_asistio: "bg-slate-200 text-slate-700",
};

const activityIcons = {
  sesion: CheckCircle2,
  pago: CreditCard,
  solicitud: Inbox,
  bono: TicketCheck,
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" });
      const result = (await response.json()) as { ok: boolean; data?: DashboardData; error?: string };
      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error || "No se pudo cargar el dashboard");
      }
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar el dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const chartMax = useMemo(() => {
    if (!data?.meses.length) return 1;
    return Math.max(1, ...data.meses.flatMap((month) => [month.facturado, month.cobrado]));
  }, [data]);

  const collectionRate = data?.resumen.facturado_mes
    ? Math.min(100, Math.round((data.resumen.cobrado_mes / data.resumen.facturado_mes) * 100))
    : 0;

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <header className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Centro de control</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Dashboard ejecutivo</h1>
            <p className="mt-1 text-muted-foreground">
              {data ? formatLongDate(data.fecha) : "Agenda, clientes, ingresos y prioridades en una sola vista."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/clientes"><UserPlus className="mr-2 h-4 w-4" />Nuevo cliente</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/pagos"><CircleDollarSign className="mr-2 h-4 w-4" />Registrar pago</Link>
            </Button>
            <Button asChild>
              <Link href="/sesiones"><Plus className="mr-2 h-4 w-4" />Nueva sesión</Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={load} disabled={loading} aria-label="Actualizar dashboard">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>

        {loading && !data ? (
          <DashboardSkeleton />
        ) : !data ? (
          <Card><CardContent className="py-20 text-center text-muted-foreground">No se pudo cargar el panel ejecutivo.</CardContent></Card>
        ) : (
          <>
            <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <ExecutiveMetric
                label="Agenda de hoy"
                value={String(data.resumen.sesiones_hoy)}
                detail={`${data.resumen.proximos_siete_dias} en los próximos 7 días`}
                icon={<CalendarDays className="h-5 w-5" />}
                href="/sesiones"
              />
              <ExecutiveMetric
                label="Cobrado este mes"
                value={formatMoney(data.resumen.cobrado_mes)}
                detail={`${formatMoney(data.resumen.facturado_mes)} facturados · ${collectionRate}% cobrado`}
                icon={<TrendingUp className="h-5 w-5" />}
                href="/informes"
              />
              <ExecutiveMetric
                label="Clientes activos"
                value={String(data.resumen.clientes_activos)}
                detail={`${data.resumen.clientes_total} registrados · ${data.resumen.clientes_potenciales} potenciales`}
                icon={<Users className="h-5 w-5" />}
                href="/clientes"
              />
              <ExecutiveMetric
                label="Pendiente de cobro"
                value={formatMoney(data.resumen.pendiente_total)}
                detail={`${formatMoney(data.resumen.vencido_total)} vencidos`}
                icon={<WalletCards className="h-5 w-5" />}
                href="/pagos"
                attention={data.resumen.pendiente_total > 0}
              />
            </section>

            <section className="mb-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <SectionHeader
                    eyebrow="Atención requerida"
                    title="Prioridades"
                    detail={`${data.resumen.alertas_activas} asuntos activos`}
                    href="/pagos"
                  />
                  {!data.alertas.length ? (
                    <EmptyState
                      icon={<CheckCircle2 className="h-8 w-8" />}
                      title="Todo bajo control"
                      text="No hay solicitudes, citas, bonos o cuotas que necesiten atención inmediata. Sospechosamente civilizado."
                    />
                  ) : (
                    <div className="divide-y">
                      {data.alertas.slice(0, 6).map((alert) => (
                        <Link
                          key={alert.id}
                          href={alert.href}
                          className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
                        >
                          <div className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                            alert.nivel === "critico"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}>
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold">{alert.titulo}</p>
                              {alert.nivel === "critico" ? <Badge className="bg-red-100 text-red-700">Prioridad</Badge> : null}
                            </div>
                            <p className="mt-1 truncate text-sm text-muted-foreground">{alert.detalle}</p>
                          </div>
                          <ArrowRight className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <SectionHeader
                    eyebrow="Agenda"
                    title="Próximas sesiones"
                    detail={`${data.resumen.citas_pendientes} pendientes de confirmar`}
                    href="/sesiones"
                  />
                  {!data.proximas_sesiones.length ? (
                    <EmptyState
                      icon={<CalendarClock className="h-8 w-8" />}
                      title="No hay sesiones próximas"
                      text="La agenda de los próximos siete días está despejada."
                    />
                  ) : (
                    <div className="divide-y">
                      {data.proximas_sesiones.map((session) => (
                        <Link
                          key={session.id}
                          href="/sesiones"
                          className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
                        >
                          <div className="min-w-[62px] rounded-xl bg-primary/10 px-2 py-2 text-center text-primary">
                            <p className="text-[11px] font-bold uppercase">{formatDay(session.inicio_at)}</p>
                            <p className="text-lg font-bold leading-tight">{formatTime(session.inicio_at)}</p>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{session.cliente}</p>
                            <p className="mt-1 truncate text-sm text-muted-foreground">
                              {session.titulo} · {session.duracion_minutos} min · {session.modalidad}
                            </p>
                          </div>
                          <Badge className={sessionStateClasses[session.estado] || "bg-slate-100 text-slate-700"}>
                            {sessionStateLabels[session.estado] || session.estado}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            <section className="mb-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Evolución financiera</p>
                      <h2 className="mt-1 text-2xl font-bold">Facturación y cobros</h2>
                    </div>
                    <Link href="/informes" className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                      Ver informes <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex min-w-[620px] items-end gap-4 border-b px-2" style={{ height: 245 }}>
                      {data.meses.map((month) => (
                        <div key={month.mes} className="flex h-full min-w-[56px] flex-1 flex-col justify-end">
                          <div className="mb-2 text-center text-[11px] text-muted-foreground">
                            {month.cobrado > 0 ? formatCompactMoney(month.cobrado) : ""}
                          </div>
                          <div className="flex h-[170px] items-end justify-center gap-1.5">
                            <div
                              className="w-5 rounded-t bg-primary/20"
                              style={{ height: `${Math.max(month.facturado ? 4 : 0, (month.facturado / chartMax) * 170)}px` }}
                              title={`Facturado: ${formatMoney(month.facturado)}`}
                            />
                            <div
                              className="w-5 rounded-t bg-primary"
                              style={{ height: `${Math.max(month.cobrado ? 4 : 0, (month.cobrado / chartMax) * 170)}px` }}
                              title={`Cobrado: ${formatMoney(month.cobrado)}`}
                            />
                          </div>
                          <p className="mt-3 pb-3 text-center text-xs font-medium capitalize">{month.etiqueta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-primary" />Cobrado</span>
                    <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-primary/20" />Facturado</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Estado operativo</p>
                  <h2 className="mt-1 text-2xl font-bold">Centro hoy</h2>
                  <div className="mt-6 space-y-4">
                    <OperationalRow
                      icon={<CalendarClock className="h-5 w-5" />}
                      label="Solicitudes nuevas"
                      value={String(data.resumen.solicitudes_nuevas)}
                      href="/sesiones"
                      attention={data.resumen.solicitudes_nuevas > 0}
                    />
                    <OperationalRow
                      icon={<Clock3 className="h-5 w-5" />}
                      label="Citas pendientes"
                      value={String(data.resumen.citas_pendientes)}
                      href="/sesiones"
                      attention={data.resumen.citas_pendientes > 0}
                    />
                    <OperationalRow
                      icon={<TicketCheck className="h-5 w-5" />}
                      label="Bonos activos"
                      value={String(data.resumen.bonos_activos)}
                      href="/pagos"
                    />
                    <OperationalRow
                      icon={<Activity className="h-5 w-5" />}
                      label="Sesiones disponibles"
                      value={String(data.resumen.sesiones_disponibles)}
                      href="/pagos"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            <Card>
              <CardContent className="p-0">
                <SectionHeader
                  eyebrow="Registro reciente"
                  title="Actividad del centro"
                  detail="Últimos movimientos operativos y económicos"
                  href="/informes"
                />
                {!data.actividad.length ? (
                  <EmptyState
                    icon={<Activity className="h-8 w-8" />}
                    title="Todavía no hay actividad"
                    text="Los movimientos más recientes aparecerán aquí."
                  />
                ) : (
                  <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
                    {data.actividad.slice(0, 8).map((item, index) => {
                      const Icon = activityIcons[item.tipo];
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`flex items-start gap-4 p-5 transition-colors hover:bg-muted/40 ${index >= 2 ? "border-t" : ""}`}
                        >
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold">{item.titulo}</p>
                            <p className="mt-1 truncate text-sm text-muted-foreground">{item.detalle}</p>
                            <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.fecha)}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppSidebar>
  );
}

function ExecutiveMetric({
  label,
  value,
  detail,
  icon,
  href,
  attention = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  href: string;
  attention?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className={`h-full transition-all hover:-translate-y-0.5 hover:shadow-md ${attention ? "border-amber-300" : ""}`}>
        <CardContent className="flex h-full items-start gap-4 p-5">
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${attention ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SectionHeader({
  eyebrow,
  title,
  detail,
  href,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  href: string;
}) {
  return (
    <div className="flex flex-col gap-3 border-b px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h2 className="mt-1 text-2xl font-bold">{title}</h2>
      </div>
      <Link href={href} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
        {detail} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function OperationalRow({
  icon,
  label,
  value,
  href,
  attention = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href: string;
  attention?: boolean;
}) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/40">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${attention ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>
        {icon}
      </div>
      <p className="flex-1 text-sm font-medium">{label}</p>
      <span className="text-xl font-bold">{value}</span>
    </Link>
  );
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 animate-pulse rounded-xl border bg-muted/50" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-xl border bg-muted/50" />
        <div className="h-96 animate-pulse rounded-xl border bg-muted/50" />
      </div>
    </div>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}

function formatCompactMoney(value: number) {
  return new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
}

function formatLongDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit" })
    .format(new Date(value))
    .replace(".", "");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
