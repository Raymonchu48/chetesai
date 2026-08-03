"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  BarChart3,
  CalendarRange,
  CheckCircle2,
  Download,
  Dumbbell,
  Printer,
  ReceiptText,
  RefreshCw,
  TicketCheck,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

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

type MethodRow = { metodo: string; operaciones: number; importe: number };
type PlanRow = { nombre: string; modalidad: string; unidades: number; importe: number; renovaciones: number };
type ClientRow = { cliente_id: string; nombre: string; operaciones: number; importe: number };
type MovementRow = {
  id: string;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  fecha_pago: string | null;
  cliente: string;
  email: string | null;
  concepto: string;
  estado: string;
  metodo_pago: string | null;
  importe_eur: number;
  referencia: string | null;
};

type ReportData = {
  periodo: { desde: string; hasta: string };
  resumen: {
    facturado: number;
    cobrado: number;
    pendiente: number;
    vencido: number;
    ticket_medio: number;
    tasa_cobro_pct: number;
    operaciones_cobradas: number;
    bonos_vendidos: number;
    renovaciones: number;
    sesiones_consumidas: number;
    sesiones_realizadas: number;
    no_asistencias: number;
  };
  meses: MonthRow[];
  metodos_pago: MethodRow[];
  planes: PlanRow[];
  clientes: ClientRow[];
  movimientos: MovementRow[];
};

const paymentStateLabels: Record<string, string> = {
  pagado: "Pagado",
  pendiente: "Pendiente",
  vencido: "Vencido",
  anulado: "Anulado",
};
const paymentStateClasses: Record<string, string> = {
  pagado: "bg-emerald-100 text-emerald-800",
  pendiente: "bg-amber-100 text-amber-800",
  vencido: "bg-red-100 text-red-800",
  anulado: "bg-slate-200 text-slate-700",
};
const methodLabels: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  bizum: "Bizum",
  domiciliacion: "Domiciliación",
  otro: "Otro",
  sin_especificar: "Sin especificar",
};

function localToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

const initialEnd = localToday();
const initialStart = `${initialEnd.slice(0, 4)}-01-01`;

export default function FinancialReportsPage() {
  const [from, setFrom] = useState(initialStart);
  const [to, setTo] = useState(initialEnd);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    if (!from || !to) return;
    if (from > to) return toast.error("La fecha inicial no puede ser posterior a la final");
    setLoading(true);
    try {
      const response = await fetch(`/api/informes/financieros?desde=${encodeURIComponent(from)}&hasta=${encodeURIComponent(to)}`);
      const result = (await response.json()) as { ok: boolean; data?: ReportData; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudo generar el informe");
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al generar el informe");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const chartMax = useMemo(() => {
    if (!data?.meses.length) return 1;
    return Math.max(1, ...data.meses.flatMap((month) => [month.facturado, month.cobrado]));
  }, [data]);

  async function exportExcel() {
    if (!from || !to || from > to) return toast.error("Revisa el periodo del informe");
    setExporting(true);
    try {
      const response = await fetch(`/api/informes/financieros/xlsx?desde=${encodeURIComponent(from)}&hasta=${encodeURIComponent(to)}`);
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "No se pudo generar el archivo Excel");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chetesai-informe-${from}-${to}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Informe Excel generado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al exportar Excel");
    } finally {
      setExporting(false);
    }
  }

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 print:max-w-none print:p-0">
        <header className="mb-6 flex flex-col gap-5 lg:mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Control de negocio</p>
            <h1 className="mt-2 flex items-start gap-3 text-2xl font-bold tracking-tight sm:items-center sm:text-3xl">
              <BarChart3 className="mt-0.5 h-7 w-7 shrink-0 text-primary sm:mt-0 sm:h-8 sm:w-8" />
              Informes financieros
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              Ingresos, deuda, bonos y actividad del centro en un único periodo.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 print:hidden sm:flex sm:w-auto sm:flex-wrap">
            <Button variant="outline" onClick={() => window.print()} className="w-full sm:w-auto">
              <Printer className="mr-2 h-4 w-4" /> Imprimir
            </Button>
            <Button variant="outline" onClick={exportExcel} disabled={loading || exporting} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> {exporting ? "Generando..." : "Exportar Excel"}
            </Button>
            <Button onClick={load} disabled={loading} className="col-span-2 w-full sm:w-auto">
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
            </Button>
          </div>
        </header>

        <Card className="mb-6 print:hidden">
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <DateField label="Desde" value={from} onChange={setFrom} />
            <DateField label="Hasta" value={to} onChange={setTo} />
            <Button onClick={load} disabled={loading || !from || !to} className="w-full sm:col-span-2 lg:col-span-1 lg:w-auto">
              <CalendarRange className="mr-2 h-4 w-4" /> Aplicar periodo
            </Button>
          </CardContent>
        </Card>

        {loading && !data ? (
          <Card><CardContent className="py-20 text-center text-muted-foreground">Generando informe...</CardContent></Card>
        ) : !data ? null : (
          <>
            <div className="mb-5 hidden text-sm print:block">Periodo: {formatDate(data.periodo.desde)} – {formatDate(data.periodo.hasta)}</div>

            <section className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Cobrado" value={formatMoney(data.resumen.cobrado)} detail={`${data.resumen.operaciones_cobradas} operaciones`} icon={<TrendingUp className="h-5 w-5" />} />
              <Metric label="Facturado" value={formatMoney(data.resumen.facturado)} detail={`Cobro ${formatPercent(data.resumen.tasa_cobro_pct)}`} icon={<ReceiptText className="h-5 w-5" />} />
              <Metric label="Pendiente" value={formatMoney(data.resumen.pendiente)} detail={`${formatMoney(data.resumen.vencido)} vencidos`} icon={<AlertTriangle className="h-5 w-5" />} attention={data.resumen.pendiente > 0} />
              <Metric label="Ticket medio" value={formatMoney(data.resumen.ticket_medio)} detail="Por cobro realizado" icon={<WalletCards className="h-5 w-5" />} />
            </section>

            <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:mb-8 xl:grid-cols-4">
              <SmallMetric label="Bonos vendidos" value={String(data.resumen.bonos_vendidos)} detail={`${data.resumen.renovaciones} renovaciones`} icon={<TicketCheck className="h-5 w-5" />} />
              <SmallMetric label="Sesiones consumidas" value={String(data.resumen.sesiones_consumidas)} detail="Descontadas de bonos" icon={<CheckCircle2 className="h-5 w-5" />} />
              <SmallMetric label="Sesiones realizadas" value={String(data.resumen.sesiones_realizadas)} detail="Registradas en agenda" icon={<Dumbbell className="h-5 w-5" />} />
              <SmallMetric label="No asistencias" value={String(data.resumen.no_asistencias)} detail="Sesiones marcadas" icon={<Users className="h-5 w-5" />} />
            </section>

            <Card className="mb-6 break-inside-avoid xl:mb-8">
              <CardContent className="p-4 sm:p-6">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Evolución</p>
                    <h2 className="mt-1 text-xl font-bold sm:text-2xl">Facturación y cobros mensuales</h2>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-primary" /> Cobrado</span>
                    <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-sm bg-primary/25" /> Facturado</span>
                  </div>
                </div>
                {!data.meses.length ? <Empty text="No hay meses dentro del periodo seleccionado." /> : (
                  <div className="-mx-1 overflow-x-auto pb-2">
                    <div className="flex min-w-[620px] items-end gap-3 border-b px-2 pt-5 sm:min-w-[680px] sm:gap-4" style={{ height: 260 }}>
                      {data.meses.map((month) => (
                        <div key={month.mes} className="flex h-full min-w-[48px] flex-1 flex-col justify-end">
                          <div className="mb-2 text-center text-[11px] text-muted-foreground">{month.cobrado > 0 ? formatCompactMoney(month.cobrado) : ""}</div>
                          <div className="flex h-[180px] items-end justify-center gap-1.5">
                            <div className="w-4 rounded-t bg-primary/25" style={{ height: `${Math.max(month.facturado > 0 ? 4 : 0, (month.facturado / chartMax) * 180)}px` }} title={`Facturado: ${formatMoney(month.facturado)}`} />
                            <div className="w-4 rounded-t bg-primary" style={{ height: `${Math.max(month.cobrado > 0 ? 4 : 0, (month.cobrado / chartMax) * 180)}px` }} title={`Cobrado: ${formatMoney(month.cobrado)}`} />
                          </div>
                          <p className="mt-3 pb-3 text-center text-xs font-medium capitalize">{month.etiqueta}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <section className="mb-6 grid gap-4 md:grid-cols-2 xl:mb-8 xl:grid-cols-3">
              <BreakdownCard title="Formas de pago" icon={<WalletCards className="h-5 w-5" />} empty="Todavía no hay cobros en el periodo." rows={data.metodos_pago.map((item) => ({ label: methodLabels[item.metodo] || item.metodo, value: formatMoney(item.importe), detail: `${item.operaciones} operaciones`, amount: item.importe }))} />
              <BreakdownCard title="Bonos vendidos" icon={<TicketCheck className="h-5 w-5" />} empty="No se vendieron bonos en el periodo." rows={data.planes.map((item) => ({ label: item.nombre, value: String(item.unidades), detail: `${item.modalidad} · ${formatMoney(item.importe)}${item.renovaciones ? ` · ${item.renovaciones} renov.` : ""}`, amount: item.unidades }))} />
              <BreakdownCard title="Clientes por ingresos" icon={<Users className="h-5 w-5" />} empty="Todavía no hay clientes con cobros." rows={data.clientes.map((item) => ({ label: item.nombre, value: formatMoney(item.importe), detail: `${item.operaciones} operaciones`, amount: item.importe }))} />
            </section>

            <Card className="break-inside-avoid">
              <CardContent className="p-0">
                <div className="flex flex-col gap-2 border-b p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Detalle contable</p>
                    <h2 className="mt-1 text-xl font-bold sm:text-2xl">Movimientos del periodo</h2>
                  </div>
                  <p className="text-sm text-muted-foreground">{data.movimientos.length} registros</p>
                </div>
                {!data.movimientos.length ? <Empty text="No hay movimientos en el periodo seleccionado." /> : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] text-sm">
                      <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <tr><th className="px-4 py-3 sm:px-5">Fecha</th><th className="px-4 py-3 sm:px-5">Cliente</th><th className="px-4 py-3 sm:px-5">Concepto</th><th className="px-4 py-3 sm:px-5">Estado</th><th className="px-4 py-3 sm:px-5">Método</th><th className="px-4 py-3 text-right sm:px-5">Importe</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.movimientos.slice(0, 100).map((movement) => (
                          <tr key={movement.id}>
                            <td className="px-4 py-4 sm:px-5"><p className="font-medium">{formatDate(movement.fecha_pago || movement.fecha_emision)}</p><p className="mt-1 text-xs text-muted-foreground">{movement.fecha_pago ? `Emitido ${formatDate(movement.fecha_emision)}` : `Vence ${formatDate(movement.fecha_vencimiento)}`}</p></td>
                            <td className="px-4 py-4 sm:px-5"><p className="font-medium">{movement.cliente}</p><p className="mt-1 text-xs text-muted-foreground">{movement.email || "Sin correo"}</p></td>
                            <td className="px-4 py-4 sm:px-5"><p>{movement.concepto}</p>{movement.referencia ? <p className="mt-1 text-xs text-muted-foreground">Ref. {movement.referencia}</p> : null}</td>
                            <td className="px-4 py-4 sm:px-5"><Badge className={paymentStateClasses[movement.estado]}>{paymentStateLabels[movement.estado] || movement.estado}</Badge></td>
                            <td className="px-4 py-4 text-muted-foreground sm:px-5">{methodLabels[movement.metodo_pago || "sin_especificar"] || movement.metodo_pago || "—"}</td>
                            <td className="px-4 py-4 text-right text-base font-bold sm:px-5">{formatMoney(movement.importe_eur)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

function DateField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><Label>{label}</Label><Input className="mt-2" type="date" value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function Metric({ label, value, detail, icon, attention = false }: { label: string; value: string; detail: string; icon: React.ReactNode; attention?: boolean }) {
  return <Card className={attention ? "border-amber-300" : ""}><CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl sm:h-12 sm:w-12 ${attention ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>{icon}</div><div className="min-w-0"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 truncate text-xl font-bold sm:text-2xl">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>;
}

function SmallMetric({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return <Card><CardContent className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-primary sm:h-11 sm:w-11">{icon}</div><div className="min-w-0"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>;
}

type BreakdownRow = { label: string; value: string; detail: string; amount: number };
function BreakdownCard({ title, icon, rows, empty }: { title: string; icon: React.ReactNode; rows: BreakdownRow[]; empty: string }) {
  const max = Math.max(1, ...rows.map((item) => item.amount));
  return <Card className="break-inside-avoid"><CardContent className="p-5 sm:p-6"><h2 className="flex items-center gap-2 text-lg font-bold">{icon}{title}</h2>{!rows.length ? <p className="mt-8 text-sm text-muted-foreground">{empty}</p> : <div className="mt-5 space-y-5">{rows.slice(0, 6).map((item) => <div key={`${title}-${item.label}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-medium">{item.label}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div><p className="shrink-0 font-bold text-primary">{item.value}</p></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(4, (item.amount / max) * 100)}%` }} /></div></div>)}</div>}</CardContent></Card>;
}

function Empty({ text }: { text: string }) {
  return <div className="px-5 py-14 text-center text-muted-foreground">{text}</div>;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}
function formatCompactMoney(value: number) {
  return new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value || 0));
}
function formatPercent(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "percent", maximumFractionDigits: 1 }).format(Number(value || 0) / 100);
}
function formatDate(value: string | null) {
  return value ? new Date(`${value.slice(0, 10)}T12:00:00`).toLocaleDateString("es-ES") : "—";
}
