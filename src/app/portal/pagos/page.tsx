"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, CreditCard, TicketCheck, WalletCards } from "lucide-react";
import { toast } from "sonner";

type Bono = {
  id: string;
  nombre: string;
  modalidad: string;
  sesiones_totales: number;
  sesiones_consumidas: number;
  precio_eur: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  renovacion_automatica: boolean;
};
type Pago = {
  id: string;
  concepto: string;
  importe_eur: number;
  fecha_emision: string;
  fecha_vencimiento: string | null;
  fecha_pago: string | null;
  metodo_pago: string | null;
  estado: string;
  referencia: string | null;
};
type PortalData = {
  cliente: { id: string; nombre: string; email: string | null };
  bonos: Bono[];
  pagos: Pago[];
};

const membershipStateLabels: Record<string, string> = {
  programado: "Programado",
  activo: "Activo",
  agotado: "Agotado",
  vencido: "Vencido",
  cancelado: "Cancelado",
};
const membershipStateClasses: Record<string, string> = {
  programado: "bg-violet-100 text-violet-800",
  activo: "bg-emerald-100 text-emerald-800",
  agotado: "bg-blue-100 text-blue-800",
  vencido: "bg-red-100 text-red-800",
  cancelado: "bg-slate-200 text-slate-700",
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
const paymentMethods: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  bizum: "Bizum",
  domiciliacion: "Domiciliación",
  otro: "Otro",
};

export default function ClientPaymentsPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/portal/pagos");
      const result = (await response.json()) as { ok: boolean; data?: PortalData; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudieron cargar tus pagos");
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar pagos y bonos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeBonuses = useMemo(() => (data?.bonos || []).filter((item) => item.estado === "activo"), [data]);
  const availableSessions = activeBonuses.reduce(
    (sum, item) => sum + Math.max(0, item.sesiones_totales - item.sesiones_consumidas),
    0
  );
  const pendingAmount = (data?.pagos || [])
    .filter((item) => ["pendiente", "vencido"].includes(item.estado))
    .reduce((sum, item) => sum + Number(item.importe_eur || 0), 0);
  const paidAmount = (data?.pagos || [])
    .filter((item) => item.estado === "pagado")
    .reduce((sum, item) => sum + Number(item.importe_eur || 0), 0);

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#29312e]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#c9653b]">CHETESAÍ FITNESS+</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
              <WalletCards className="h-8 w-8 text-[#46624f]" /> Mis bonos y pagos
            </h1>
            <p className="mt-2 text-sm text-[#707872]">
              {data?.cliente?.nombre ? `Hola, ${data.cliente.nombre}. Aquí puedes consultar tu saldo de sesiones y tus cuotas.` : "Tu información económica privada."}
            </p>
          </div>
          <div className="w-full max-w-52 rounded-xl border border-[#e7dfd3] bg-white p-1 text-[#46624f] sm:w-52"><LogoutButton /></div>
        </header>

        {loading ? <p className="py-16 text-center text-[#707872]">Cargando tus bonos y pagos...</p> : !data ? null : <>
          <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Bonos activos" value={String(activeBonuses.length)} icon={<TicketCheck className="h-5 w-5" />} />
            <Metric label="Sesiones disponibles" value={String(availableSessions)} icon={<CheckCircle2 className="h-5 w-5" />} />
            <Metric label="Total abonado" value={formatMoney(paidAmount)} icon={<CreditCard className="h-5 w-5" />} />
            <Metric label="Pendiente" value={formatMoney(pendingAmount)} icon={<WalletCards className="h-5 w-5" />} />
          </section>

          <section className="mb-10">
            <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#46624f]">Tus planes</p><h2 className="mt-1 text-2xl font-bold">Bonos y cuotas</h2></div>
            {!data.bonos.length ? <Empty text="Todavía no tienes bonos asignados." /> : <div className="grid gap-4 lg:grid-cols-2">{data.bonos.map((bonus) => {
              const remaining = Math.max(0, bonus.sesiones_totales - bonus.sesiones_consumidas);
              const percent = Math.min(100, Math.round((bonus.sesiones_consumidas / bonus.sesiones_totales) * 100));
              return <Card key={bonus.id}><CardContent className="p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold">{bonus.nombre}</h3><Badge className={membershipStateClasses[bonus.estado]}>{membershipStateLabels[bonus.estado] || bonus.estado}</Badge></div><p className="mt-1 text-sm text-[#707872]">{bonus.modalidad} · {formatMoney(bonus.precio_eur)}</p></div><p className="text-2xl font-bold text-[#46624f]">{remaining}<span className="text-sm font-medium text-[#707872]"> / {bonus.sesiones_totales}</span></p></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-[#e8ece8]"><div className="h-full rounded-full bg-[#46624f]" style={{ width: `${percent}%` }} /></div><div className="mt-2 flex justify-between text-xs text-[#707872]"><span>{bonus.sesiones_consumidas} consumidas</span><span>{remaining} disponibles</span></div><p className="mt-4 text-sm text-[#707872]">{bonus.estado === "programado" ? "Próximo periodo" : "Vigencia"}: {formatDate(bonus.fecha_inicio)} – {formatDate(bonus.fecha_fin)}{bonus.renovacion_automatica ? " · Renovación automática" : ""}</p></CardContent></Card>;
            })}</div>}
          </section>

          <section>
            <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#707872]">Historial</p><h2 className="mt-1 text-2xl font-bold">Pagos y cuotas</h2></div>
            {!data.pagos.length ? <Empty text="Todavía no hay pagos registrados." /> : <div className="space-y-3">{data.pagos.map((payment) => <Card key={payment.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{payment.concepto}</h3><Badge className={paymentStateClasses[payment.estado]}>{paymentStateLabels[payment.estado] || payment.estado}</Badge></div><p className="mt-2 text-sm text-[#707872]">Emitido: {formatDate(payment.fecha_emision)}{payment.fecha_vencimiento ? ` · Vence: ${formatDate(payment.fecha_vencimiento)}` : ""}{payment.fecha_pago ? ` · Pagado: ${formatDate(payment.fecha_pago)}` : ""}</p><p className="mt-1 text-sm text-[#707872]">{payment.metodo_pago ? paymentMethods[payment.metodo_pago] || payment.metodo_pago : "Método pendiente"}{payment.referencia ? ` · Ref. ${payment.referencia}` : ""}</p></div><p className="text-2xl font-bold text-[#46624f]">{formatMoney(payment.importe_eur)}</p></CardContent></Card>)}</div>}
          </section>
        </>}
      </div>
    </main>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf3ed] text-[#46624f]">{icon}</div><div><p className="text-sm text-[#707872]">{label}</p><p className="mt-1 text-2xl font-bold text-[#46624f]">{value}</p></div></CardContent></Card>;
}
function Empty({ text }: { text: string }) { return <Card><CardContent className="py-12 text-center text-[#707872]">{text}</CardContent></Card>; }
function formatMoney(value: number) { return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0)); }
function formatDate(value: string | null) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("es-ES") : "—"; }
