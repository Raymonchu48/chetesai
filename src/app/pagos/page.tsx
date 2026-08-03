"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Minus,
  Plus,
  RefreshCw,
  TicketCheck,
  Trash2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

type Cliente = { _id: string; nombre: string; email?: string | null; estado?: string };
type Plan = {
  id: string;
  nombre: string;
  modalidad: string;
  sesiones_incluidas: number;
  precio_eur: number;
  vigencia_dias: number;
  activo: boolean;
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
  notas: string | null;
  clientes?: { id: string; nombre: string; email?: string | null } | null;
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
  clientes?: { id: string; nombre: string; email?: string | null } | null;
  bonos_cliente?: { id: string; nombre: string } | null;
};

type AssignForm = {
  cliente_id: string;
  catalogo_bono_id: string;
  fecha_inicio: string;
  estado_pago: string;
  metodo_pago: string;
  renovacion_automatica: boolean;
  notas: string;
};
type PaymentForm = {
  cliente_id: string;
  concepto: string;
  importe_eur: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  fecha_pago: string;
  metodo_pago: string;
  estado: string;
  referencia: string;
  notas: string;
};

const today = new Date().toISOString().slice(0, 10);
const emptyAssignForm: AssignForm = {
  cliente_id: "",
  catalogo_bono_id: "",
  fecha_inicio: today,
  estado_pago: "pagado",
  metodo_pago: "bizum",
  renovacion_automatica: false,
  notas: "",
};
const emptyPaymentForm: PaymentForm = {
  cliente_id: "",
  concepto: "",
  importe_eur: "",
  fecha_emision: today,
  fecha_vencimiento: today,
  fecha_pago: today,
  metodo_pago: "bizum",
  estado: "pagado",
  referencia: "",
  notas: "",
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
const membershipStateLabels: Record<string, string> = {
  activo: "Activo",
  agotado: "Agotado",
  vencido: "Vencido",
  cancelado: "Cancelado",
};
const membershipStateClasses: Record<string, string> = {
  activo: "bg-emerald-100 text-emerald-800",
  agotado: "bg-blue-100 text-blue-800",
  vencido: "bg-red-100 text-red-800",
  cancelado: "bg-slate-200 text-slate-700",
};
const paymentMethods: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  bizum: "Bizum",
  domiciliacion: "Domiciliación",
  otro: "Otro",
};

export default function PaymentsPage() {
  const [clients, setClients] = useState<Cliente[]>([]);
  const [catalog, setCatalog] = useState<Plan[]>([]);
  const [memberships, setMemberships] = useState<Bono[]>([]);
  const [payments, setPayments] = useState<Pago[]>([]);
  const [activeTab, setActiveTab] = useState<"bonos" | "pagos">("bonos");
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [assignForm, setAssignForm] = useState<AssignForm>(emptyAssignForm);
  const [paymentForm, setPaymentForm] = useState<PaymentForm>(emptyPaymentForm);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [clientFilter, setClientFilter] = useState("todos");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bonusResponse, paymentResponse, clientResponse] = await Promise.all([
        fetch("/api/bonos"),
        fetch("/api/pagos"),
        fetch("/api/clientes"),
      ]);
      const bonusResult = (await bonusResponse.json()) as {
        ok: boolean;
        data?: { catalogo: Plan[]; bonos: Bono[] };
        error?: string;
      };
      const paymentResult = (await paymentResponse.json()) as { ok: boolean; data?: Pago[]; error?: string };
      const clientResult = (await clientResponse.json()) as { ok: boolean; data?: Cliente[]; error?: string };

      if (!bonusResponse.ok || !bonusResult.ok || !bonusResult.data) {
        throw new Error(bonusResult.error || "No se pudieron cargar los bonos");
      }
      if (!paymentResponse.ok || !paymentResult.ok) {
        throw new Error(paymentResult.error || "No se pudieron cargar los pagos");
      }
      setCatalog(bonusResult.data.catalogo || []);
      setMemberships(bonusResult.data.bonos || []);
      setPayments(paymentResult.data || []);
      if (clientResponse.ok && clientResult.ok) setClients(clientResult.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar pagos y bonos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredMemberships = useMemo(
    () => memberships.filter((item) => clientFilter === "todos" || item.cliente_id === clientFilter),
    [memberships, clientFilter]
  );
  const filteredPayments = useMemo(
    () => payments.filter((item) => clientFilter === "todos" || item.cliente_id === clientFilter),
    [payments, clientFilter]
  );

  const totalCollected = payments
    .filter((item) => item.estado === "pagado")
    .reduce((sum, item) => sum + Number(item.importe_eur || 0), 0);
  const totalPending = payments
    .filter((item) => ["pendiente", "vencido"].includes(item.estado))
    .reduce((sum, item) => sum + Number(item.importe_eur || 0), 0);
  const activeMemberships = memberships.filter((item) => item.estado === "activo").length;
  const remainingSessions = memberships
    .filter((item) => item.estado === "activo")
    .reduce((sum, item) => sum + Math.max(0, item.sesiones_totales - item.sesiones_consumidas), 0);

  async function assignMembership() {
    if (!assignForm.cliente_id || !assignForm.catalogo_bono_id) {
      return toast.error("Selecciona cliente y bono");
    }
    setSaving(true);
    try {
      const response = await fetch("/api/bonos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignForm),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo asignar el bono");
      toast.success("Bono asignado y pago registrado");
      setAssignOpen(false);
      setAssignForm(emptyAssignForm);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al asignar el bono");
    } finally {
      setSaving(false);
    }
  }

  async function registerPayment() {
    if (!paymentForm.cliente_id || !paymentForm.concepto || !paymentForm.importe_eur) {
      return toast.error("Completa cliente, concepto e importe");
    }
    setSaving(true);
    try {
      const response = await fetch("/api/pagos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentForm,
          importe_eur: Number(paymentForm.importe_eur),
          fecha_pago: paymentForm.estado === "pagado" ? paymentForm.fecha_pago : null,
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo registrar el pago");
      toast.success("Pago registrado");
      setPaymentOpen(false);
      setPaymentForm(emptyPaymentForm);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrar el pago");
    } finally {
      setSaving(false);
    }
  }

  async function updateMembership(id: string, action: "consumir" | "restaurar" | "cancelar") {
    setWorkingId(id);
    try {
      const response = await fetch(`/api/bonos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "cancelar" ? { action: "actualizar", estado: "cancelado" } : { action }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo actualizar el bono");
      toast.success(action === "consumir" ? "Sesión descontada" : action === "restaurar" ? "Sesión restaurada" : "Bono cancelado");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el bono");
    } finally {
      setWorkingId(null);
    }
  }

  async function deletePayment(id: string) {
    if (!window.confirm("¿Eliminar definitivamente este pago?")) return;
    setWorkingId(id);
    try {
      const response = await fetch(`/api/pagos/${id}`, { method: "DELETE" });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo eliminar el pago");
      toast.success("Pago eliminado");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
              <WalletCards className="h-8 w-8 text-primary" /> Pagos, bonos y cuotas
            </h1>
            <p className="mt-1 text-muted-foreground">Control económico y sesiones disponibles por cliente.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setPaymentOpen(true)}><Banknote className="mr-2 h-4 w-4" />Registrar pago</Button>
            <Button onClick={() => setAssignOpen(true)}><Plus className="mr-2 h-4 w-4" />Asignar bono</Button>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Summary label="Total cobrado" value={formatMoney(totalCollected)} icon={<CreditCard className="h-5 w-5" />} />
          <Summary label="Pendiente de cobro" value={formatMoney(totalPending)} icon={<CalendarClock className="h-5 w-5" />} />
          <Summary label="Bonos activos" value={String(activeMemberships)} icon={<TicketCheck className="h-5 w-5" />} />
          <Summary label="Sesiones disponibles" value={String(remainingSessions)} icon={<CheckCircle2 className="h-5 w-5" />} />
        </section>

        <Card className="mb-6">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button variant={activeTab === "bonos" ? "default" : "outline"} onClick={() => setActiveTab("bonos")}><TicketCheck className="mr-2 h-4 w-4" />Bonos y cuotas</Button>
              <Button variant={activeTab === "pagos" ? "default" : "outline"} onClick={() => setActiveTab("pagos")}><CreditCard className="mr-2 h-4 w-4" />Pagos</Button>
            </div>
            <div className="w-full sm:max-w-xs"><Label>Filtrar por cliente</Label><Select value={clientFilter} onValueChange={setClientFilter}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos los clientes</SelectItem>{clients.map((client) => <SelectItem key={client._id} value={client._id}>{client.nombre}</SelectItem>)}</SelectContent></Select></div>
          </CardContent>
        </Card>

        {loading ? <p className="py-16 text-center text-muted-foreground">Cargando pagos y bonos...</p> : activeTab === "bonos" ? (
          !filteredMemberships.length ? <Empty title="Todavía no hay bonos asignados" text="Asigna un bono mensual para controlar pagos y sesiones disponibles." /> : <div className="grid gap-4 xl:grid-cols-2">{filteredMemberships.map((membership) => {
            const remaining = Math.max(0, membership.sesiones_totales - membership.sesiones_consumidas);
            const percent = Math.min(100, Math.round((membership.sesiones_consumidas / membership.sesiones_totales) * 100));
            return <Card key={membership.id}><CardContent className="p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-bold">{membership.nombre}</h2><Badge className={membershipStateClasses[membership.estado]}>{membershipStateLabels[membership.estado] || membership.estado}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{membership.clientes?.nombre || "Cliente"} · {membership.modalidad}</p><p className="mt-3 text-sm text-muted-foreground">Vigencia: {formatDate(membership.fecha_inicio)} – {formatDate(membership.fecha_fin)}</p></div><p className="text-2xl font-bold text-primary">{remaining}<span className="text-sm font-medium text-muted-foreground"> / {membership.sesiones_totales} sesiones</span></p></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} /></div><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{membership.sesiones_consumidas} consumidas</span><span>{percent}% utilizado</span></div><div className="mt-5 flex flex-wrap gap-2"><Button size="sm" onClick={() => updateMembership(membership.id, "consumir")} disabled={workingId === membership.id || membership.estado !== "activo" || remaining <= 0}><Minus className="mr-2 h-4 w-4" />Consumir sesión</Button><Button size="sm" variant="outline" onClick={() => updateMembership(membership.id, "restaurar")} disabled={workingId === membership.id || membership.sesiones_consumidas <= 0}><RefreshCw className="mr-2 h-4 w-4" />Restaurar</Button><Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateMembership(membership.id, "cancelar")} disabled={workingId === membership.id || membership.estado === "cancelado"}>Cancelar bono</Button></div></CardContent></Card>;
          })}</div>
        ) : (
          !filteredPayments.length ? <Empty title="No hay pagos registrados" text="Registra un cobro o genera uno al asignar un bono." /> : <div className="space-y-3">{filteredPayments.map((payment) => <Card key={payment.id}><CardContent className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-bold">{payment.concepto}</h2><Badge className={paymentStateClasses[payment.estado]}>{paymentStateLabels[payment.estado] || payment.estado}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{payment.clientes?.nombre || "Cliente"}{payment.metodo_pago ? ` · ${paymentMethods[payment.metodo_pago] || payment.metodo_pago}` : ""}</p><p className="mt-2 text-xs text-muted-foreground">Emitido: {formatDate(payment.fecha_emision)}{payment.fecha_vencimiento ? ` · Vence: ${formatDate(payment.fecha_vencimiento)}` : ""}{payment.fecha_pago ? ` · Pagado: ${formatDate(payment.fecha_pago)}` : ""}</p></div><div className="flex items-center gap-4"><p className="text-2xl font-bold">{formatMoney(payment.importe_eur)}</p><Button variant="ghost" size="icon" className="text-destructive" disabled={workingId === payment.id} onClick={() => deletePayment(payment.id)}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>)}</div>
        )}
      </div>

      <Dialog open={assignOpen} onOpenChange={(open) => { setAssignOpen(open); if (!open) setAssignForm(emptyAssignForm); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Asignar bono o cuota</DialogTitle></DialogHeader>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Cliente</Label><Select value={assignForm.cliente_id} onValueChange={(value) => setAssignForm({ ...assignForm, cliente_id: value })}><SelectTrigger className="mt-2"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client._id} value={client._id}>{client.nombre}{client.estado === "prueba" ? " · potencial" : ""}</SelectItem>)}</SelectContent></Select></div>
            <div className="sm:col-span-2"><Label>Bono</Label><Select value={assignForm.catalogo_bono_id} onValueChange={(value) => setAssignForm({ ...assignForm, catalogo_bono_id: value })}><SelectTrigger className="mt-2"><SelectValue placeholder="Seleccionar bono" /></SelectTrigger><SelectContent>{catalog.filter((plan) => plan.activo).map((plan) => <SelectItem key={plan.id} value={plan.id}>{plan.nombre} · {plan.sesiones_incluidas} sesiones · {formatMoney(plan.precio_eur)}</SelectItem>)}</SelectContent></Select></div>
            <Field label="Fecha de inicio" type="date" value={assignForm.fecha_inicio} onChange={(value) => setAssignForm({ ...assignForm, fecha_inicio: value })} />
            <SelectField label="Estado del pago" value={assignForm.estado_pago} onChange={(value) => setAssignForm({ ...assignForm, estado_pago: value })} options={{ pagado: "Pagado", pendiente: "Pendiente" }} />
            <SelectField label="Método de pago" value={assignForm.metodo_pago} onChange={(value) => setAssignForm({ ...assignForm, metodo_pago: value })} options={paymentMethods} />
            <label className="flex items-center gap-3 self-end rounded-xl border p-3 text-sm"><input type="checkbox" checked={assignForm.renovacion_automatica} onChange={(event) => setAssignForm({ ...assignForm, renovacion_automatica: event.target.checked })} />Renovación automática</label>
            <div className="sm:col-span-2"><Label>Notas</Label><Textarea className="mt-2" rows={3} value={assignForm.notas} onChange={(event) => setAssignForm({ ...assignForm, notas: event.target.value })} /></div>
          </div>
          <Button className="mt-5 w-full" disabled={saving} onClick={assignMembership}>{saving ? "Asignando..." : "Asignar bono y registrar pago"}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={(open) => { setPaymentOpen(open); if (!open) setPaymentForm(emptyPaymentForm); }}>
        <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar pago</DialogTitle></DialogHeader>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label>Cliente</Label><Select value={paymentForm.cliente_id} onValueChange={(value) => setPaymentForm({ ...paymentForm, cliente_id: value })}><SelectTrigger className="mt-2"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client._id} value={client._id}>{client.nombre}</SelectItem>)}</SelectContent></Select></div>
            <Field label="Concepto" value={paymentForm.concepto} onChange={(value) => setPaymentForm({ ...paymentForm, concepto: value })} className="sm:col-span-2" />
            <Field label="Importe (€)" type="number" value={paymentForm.importe_eur} onChange={(value) => setPaymentForm({ ...paymentForm, importe_eur: value })} />
            <SelectField label="Estado" value={paymentForm.estado} onChange={(value) => setPaymentForm({ ...paymentForm, estado: value })} options={paymentStateLabels} />
            <Field label="Fecha de emisión" type="date" value={paymentForm.fecha_emision} onChange={(value) => setPaymentForm({ ...paymentForm, fecha_emision: value })} />
            <Field label="Fecha de vencimiento" type="date" value={paymentForm.fecha_vencimiento} onChange={(value) => setPaymentForm({ ...paymentForm, fecha_vencimiento: value })} />
            {paymentForm.estado === "pagado" ? <Field label="Fecha de pago" type="date" value={paymentForm.fecha_pago} onChange={(value) => setPaymentForm({ ...paymentForm, fecha_pago: value })} /> : null}
            <SelectField label="Método" value={paymentForm.metodo_pago} onChange={(value) => setPaymentForm({ ...paymentForm, metodo_pago: value })} options={paymentMethods} />
            <Field label="Referencia" value={paymentForm.referencia} onChange={(value) => setPaymentForm({ ...paymentForm, referencia: value })} className="sm:col-span-2" />
            <div className="sm:col-span-2"><Label>Notas</Label><Textarea className="mt-2" rows={3} value={paymentForm.notas} onChange={(event) => setPaymentForm({ ...paymentForm, notas: event.target.value })} /></div>
          </div>
          <Button className="mt-5 w-full" disabled={saving} onClick={registerPayment}>{saving ? "Guardando..." : "Registrar pago"}</Button>
        </DialogContent>
      </Dialog>
    </AppSidebar>
  );
}

function Field({ label, value, onChange, type = "text", className = "" }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string }) {
  return <div className={className}><Label>{label}</Label><Input className="mt-2" type={type} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Record<string, string> }) {
  return <div><Label>{label}</Label><Select value={value} onValueChange={onChange}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(options).map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent></Select></div>;
}
function Summary({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</div><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div></CardContent></Card>;
}
function Empty({ title, text }: { title: string; text: string }) {
  return <Card><CardContent className="py-16 text-center"><WalletCards className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mt-2 text-muted-foreground">{text}</p></CardContent></Card>;
}
function formatMoney(value: number) { return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0)); }
function formatDate(value: string | null) { return value ? new Date(`${value}T00:00:00`).toLocaleDateString("es-ES") : "—"; }
