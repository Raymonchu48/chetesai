"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, CheckCircle2, Clock3, MapPin, XCircle } from "lucide-react";
import { toast } from "sonner";

type Session = {
  id: string;
  titulo: string;
  inicio_at: string;
  duracion_minutos: number;
  tipo_sesion: string;
  estado: string;
  modalidad: string;
  ubicacion: string | null;
  mensaje_cliente: string | null;
  motivo_cancelacion: string | null;
};
type AppointmentData = {
  cliente: { id: string; nombre: string; email: string | null };
  sesiones: Session[];
};

const typeLabels: Record<string, string> = {
  valoracion_inicial: "Valoración inicial",
  entrenamiento_personal: "Entrenamiento personal",
  grupo_reducido: "Grupo reducido",
  revision_progreso: "Revisión de progreso",
  nutricion: "Nutrición",
  online: "Sesión online",
  otro: "Otra sesión",
};
const stateLabels: Record<string, string> = {
  pendiente: "Pendiente de confirmar",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  no_asistio: "No asististe",
};
const stateClasses: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  confirmada: "bg-blue-100 text-blue-800",
  realizada: "bg-emerald-100 text-emerald-800",
  cancelada: "bg-red-100 text-red-800",
  no_asistio: "bg-slate-200 text-slate-700",
};

export default function ClientAppointmentsPage() {
  const [data, setData] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/portal/citas");
      const result = (await response.json()) as { ok: boolean; data?: AppointmentData; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudieron cargar tus citas");
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const now = Date.now();
  const upcoming = useMemo(() => (data?.sesiones || [])
    .filter((item) => new Date(item.inicio_at).getTime() >= now && !["realizada", "no_asistio"].includes(item.estado))
    .sort((a, b) => new Date(a.inicio_at).getTime() - new Date(b.inicio_at).getTime()), [data, now]);
  const history = useMemo(() => (data?.sesiones || [])
    .filter((item) => new Date(item.inicio_at).getTime() < now || ["realizada", "no_asistio"].includes(item.estado))
    .sort((a, b) => new Date(b.inicio_at).getTime() - new Date(a.inicio_at).getTime()), [data, now]);
  const confirmed = upcoming.filter((item) => item.estado === "confirmada").length;
  const pending = upcoming.filter((item) => item.estado === "pendiente").length;

  async function updateAppointment(id: string, action: "confirmar" | "cancelar", reason = "") {
    setUpdatingId(id);
    try {
      const response = await fetch("/api/portal/citas", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, motivo_cancelacion: reason }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo actualizar la cita");
      toast.success(action === "confirmar" ? "Cita confirmada" : "Cita cancelada");
      setCancelId(null);
      setCancelReason("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#29312e]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#c9653b]">CHETESAÍ FITNESS+</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight"><CalendarDays className="h-8 w-8 text-[#46624f]" />Mis citas</h1>
            <p className="mt-2 text-sm text-[#707872]">{data?.cliente?.nombre ? `Hola, ${data.cliente.nombre}. Aquí tienes tus próximas sesiones.` : "Tu agenda privada."}</p>
          </div>
          <div className="w-full max-w-52 rounded-xl border border-[#e7dfd3] bg-white p-1 text-[#46624f] sm:w-52"><LogoutButton /></div>
        </header>

        {loading ? <p className="py-16 text-center text-[#707872]">Cargando tus citas...</p> : !data ? null : <>
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <Metric label="Próximas citas" value={String(upcoming.length)} />
            <Metric label="Confirmadas" value={String(confirmed)} />
            <Metric label="Pendientes" value={String(pending)} />
          </section>

          <section className="mb-10">
            <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#46624f]">Próximamente</p><h2 className="mt-1 text-2xl font-bold">Tus siguientes sesiones</h2></div>
            {!upcoming.length ? <Card><CardContent className="py-14 text-center"><CalendarDays className="mx-auto h-10 w-10 text-[#707872]" /><h3 className="mt-4 text-xl font-bold">No tienes citas próximas</h3><p className="mt-2 text-[#707872]">Cuando se programe una sesión aparecerá aquí.</p></CardContent></Card> : <div className="space-y-4">{upcoming.map((session) => <AppointmentCard key={session.id} session={session} updating={updatingId === session.id} onConfirm={() => updateAppointment(session.id, "confirmar")} onCancel={() => setCancelId(session.id)} />)}</div>}
          </section>

          <section>
            <div className="mb-4"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#707872]">Historial</p><h2 className="mt-1 text-2xl font-bold">Sesiones anteriores</h2></div>
            {!history.length ? <p className="rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-8 text-center text-[#707872]">Todavía no hay sesiones anteriores.</p> : <div className="space-y-3">{history.map((session) => <AppointmentCard key={session.id} session={session} history />)}</div>}
          </section>
        </>}
      </div>

      <Dialog open={Boolean(cancelId)} onOpenChange={(open) => { if (!open) { setCancelId(null); setCancelReason(""); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cancelar cita</DialogTitle></DialogHeader>
          <div className="mt-3"><Label>Motivo de cancelación</Label><Textarea className="mt-2" rows={4} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Indica brevemente el motivo..." /></div>
          <div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={() => setCancelId(null)}>Volver</Button><Button variant="destructive" disabled={!cancelId || updatingId === cancelId} onClick={() => cancelId && updateAppointment(cancelId, "cancelar", cancelReason)}>{updatingId === cancelId ? "Cancelando..." : "Confirmar cancelación"}</Button></div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function AppointmentCard({ session, updating = false, history = false, onConfirm, onCancel }: { session: Session; updating?: boolean; history?: boolean; onConfirm?: () => void; onCancel?: () => void }) {
  const date = new Date(session.inicio_at);
  return <Card><CardContent className="p-5"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div className="flex gap-4"><div className="min-w-20 rounded-2xl bg-[#eef5ef] px-3 py-3 text-center text-[#46624f]"><p className="text-2xl font-bold">{date.toLocaleDateString("es-ES", { day: "2-digit" })}</p><p className="text-xs uppercase">{date.toLocaleDateString("es-ES", { month: "short" })}</p></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{session.titulo}</h3><Badge className={stateClasses[session.estado]}>{stateLabels[session.estado] || session.estado}</Badge></div><p className="mt-2 flex items-center gap-2 text-sm text-[#707872]"><Clock3 className="h-4 w-4" />{date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} · {session.duracion_minutos} minutos · {typeLabels[session.tipo_sesion] || session.tipo_sesion}</p>{session.ubicacion ? <p className="mt-1 flex items-center gap-2 text-sm text-[#707872]"><MapPin className="h-4 w-4" />{session.ubicacion}</p> : null}{session.mensaje_cliente ? <p className="mt-2 text-sm text-[#707872]">{session.mensaje_cliente}</p> : null}{session.motivo_cancelacion ? <p className="mt-2 text-sm text-red-600">{session.motivo_cancelacion}</p> : null}</div></div>{!history && !["cancelada", "realizada", "no_asistio"].includes(session.estado) ? <div className="flex gap-2"><Button className="bg-[#46624f] hover:bg-[#3b5543]" disabled={updating || session.estado === "confirmada"} onClick={onConfirm}><CheckCircle2 className="mr-2 h-4 w-4" />{session.estado === "confirmada" ? "Confirmada" : "Confirmar"}</Button><Button variant="outline" disabled={updating} onClick={onCancel}><XCircle className="mr-2 h-4 w-4" />Cancelar</Button></div> : null}</div></CardContent></Card>;
}
function Metric({ label, value }: { label: string; value: string }) { return <Card><CardContent className="p-5"><p className="text-sm text-[#707872]">{label}</p><p className="mt-2 text-3xl font-bold text-[#46624f]">{value}</p></CardContent></Card>; }
