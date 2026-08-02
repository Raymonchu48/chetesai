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
  DialogTrigger,
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
  CalendarDays,
  CheckCircle2,
  Clock3,
  Inbox,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

type Cliente = { _id: string; nombre: string; email: string; telefono?: string };
type Sesion = {
  id: string;
  cliente_id: string;
  solicitud_id: string | null;
  titulo: string;
  inicio_at: string;
  duracion_minutos: number;
  tipo_sesion: string;
  estado: string;
  modalidad: string;
  ubicacion: string | null;
  notas_profesional: string | null;
  motivo_cancelacion: string | null;
  clientes?: { id: string; nombre: string; email: string; telefono?: string } | null;
};
type Solicitud = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  modalidad: string;
  objetivo: string | null;
  mensaje: string | null;
  fecha_preferida: string | null;
  franja_horaria: string | null;
  estado: string;
  cliente_id: string | null;
  created_at: string;
};

type SessionForm = {
  cliente_id: string;
  solicitud_id: string;
  titulo: string;
  inicio_at: string;
  duracion_minutos: string;
  tipo_sesion: string;
  estado: string;
  modalidad: string;
  ubicacion: string;
  notas_profesional: string;
  motivo_cancelacion: string;
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
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
  no_asistio: "No asistió",
};
const stateClasses: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  confirmada: "bg-blue-100 text-blue-800",
  realizada: "bg-emerald-100 text-emerald-800",
  cancelada: "bg-red-100 text-red-800",
  no_asistio: "bg-slate-200 text-slate-700",
};
const requestStateClasses: Record<string, string> = {
  nueva: "bg-orange-100 text-orange-800",
  contactada: "bg-blue-100 text-blue-800",
  convertida: "bg-emerald-100 text-emerald-800",
  descartada: "bg-slate-200 text-slate-700",
};

function defaultLocalDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset() + 60);
  return date.toISOString().slice(0, 16);
}
const emptyForm: SessionForm = {
  cliente_id: "",
  solicitud_id: "",
  titulo: "Entrenamiento personal",
  inicio_at: defaultLocalDate(),
  duracion_minutos: "60",
  tipo_sesion: "entrenamiento_personal",
  estado: "pendiente",
  modalidad: "presencial",
  ubicacion: "",
  notas_profesional: "",
  motivo_cancelacion: "",
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Sesion[]>([]);
  const [requests, setRequests] = useState<Solicitud[]>([]);
  const [clients, setClients] = useState<Cliente[]>([]);
  const [activeTab, setActiveTab] = useState<"agenda" | "solicitudes">("agenda");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SessionForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stateFilter, setStateFilter] = useState("todos");
  const [clientFilter, setClientFilter] = useState("todos");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionResponse, requestResponse, clientResponse] = await Promise.all([
        fetch("/api/sesiones"),
        fetch("/api/reservas"),
        fetch("/api/clientes"),
      ]);
      const sessionResult = (await sessionResponse.json()) as { ok: boolean; data?: Sesion[]; error?: string };
      const requestResult = (await requestResponse.json()) as { ok: boolean; data?: Solicitud[]; error?: string };
      const clientResult = (await clientResponse.json()) as { ok: boolean; data?: Cliente[]; error?: string };
      if (!sessionResponse.ok || !sessionResult.ok) throw new Error(sessionResult.error || "No se pudo cargar la agenda");
      setSessions(sessionResult.data || []);
      if (requestResponse.ok && requestResult.ok) setRequests(requestResult.data || []);
      if (clientResponse.ok && clientResult.ok) setClients(clientResult.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar la agenda");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredSessions = useMemo(() => sessions.filter((session) => {
    const stateMatch = stateFilter === "todos" || session.estado === stateFilter;
    const clientMatch = clientFilter === "todos" || session.cliente_id === clientFilter;
    return stateMatch && clientMatch;
  }), [sessions, stateFilter, clientFilter]);

  const groupedSessions = useMemo(() => {
    const groups = new Map<string, Sesion[]>();
    for (const session of filteredSessions) {
      const key = new Date(session.inicio_at).toLocaleDateString("es-ES", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      });
      const current = groups.get(key) || [];
      current.push(session);
      groups.set(key, current);
    }
    return [...groups.entries()];
  }, [filteredSessions]);

  const now = Date.now();
  const endWeek = now + 7 * 24 * 60 * 60 * 1000;
  const todayKey = new Date().toDateString();
  const todayCount = sessions.filter((item) => new Date(item.inicio_at).toDateString() === todayKey && !["cancelada"].includes(item.estado)).length;
  const nextSeven = sessions.filter((item) => {
    const time = new Date(item.inicio_at).getTime();
    return time >= now && time <= endWeek && !["cancelada"].includes(item.estado);
  }).length;
  const pendingCount = sessions.filter((item) => item.estado === "pendiente").length;
  const newRequests = requests.filter((item) => item.estado === "nueva").length;

  function openNew() {
    setEditingId(null);
    setForm({ ...emptyForm, inicio_at: defaultLocalDate() });
    setDialogOpen(true);
  }

  function openEdit(session: Sesion) {
    const date = new Date(session.inicio_at);
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditingId(session.id);
    setForm({
      cliente_id: session.cliente_id,
      solicitud_id: session.solicitud_id || "",
      titulo: session.titulo,
      inicio_at: local,
      duracion_minutos: String(session.duracion_minutos),
      tipo_sesion: session.tipo_sesion,
      estado: session.estado,
      modalidad: session.modalidad,
      ubicacion: session.ubicacion || "",
      notas_profesional: session.notas_profesional || "",
      motivo_cancelacion: session.motivo_cancelacion || "",
    });
    setDialogOpen(true);
  }

  function prepareFromRequest(request: Solicitud) {
    const client = clients.find((item) => item.email?.toLowerCase() === request.email.toLowerCase());
    if (!client) {
      toast.error("Primero registra al cliente con el mismo correo electrónico");
      return;
    }
    setEditingId(null);
    setForm({
      ...emptyForm,
      cliente_id: client._id,
      solicitud_id: request.id,
      titulo: "Valoración inicial",
      tipo_sesion: "valoracion_inicial",
      modalidad: request.modalidad === "grupo_reducido" ? "presencial" : "presencial",
      inicio_at: request.fecha_preferida ? `${request.fecha_preferida}T10:00` : defaultLocalDate(),
      notas_profesional: [request.objetivo, request.mensaje, request.franja_horaria].filter(Boolean).join(" · "),
    });
    setDialogOpen(true);
  }

  async function saveSession() {
    if (!form.cliente_id || !form.titulo || !form.inicio_at) return toast.error("Completa cliente, título y fecha");
    setSaving(true);
    try {
      const url = editingId ? `/api/sesiones/${editingId}` : "/api/sesiones";
      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          inicio_at: new Date(form.inicio_at).toISOString(),
          duracion_minutos: Number(form.duracion_minutos),
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo guardar la sesión");
      if (!editingId && form.solicitud_id) {
        await fetch("/api/reservas", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: form.solicitud_id, estado: "convertida", cliente_id: form.cliente_id }),
        });
      }
      toast.success(editingId ? "Sesión actualizada" : "Sesión creada");
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function deleteSession(id: string) {
    if (!window.confirm("¿Eliminar definitivamente esta sesión?")) return;
    const response = await fetch(`/api/sesiones/${id}`, { method: "DELETE" });
    const result = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !result.ok) return toast.error(result.error || "No se pudo eliminar");
    toast.success("Sesión eliminada");
    await load();
  }

  async function updateRequest(id: string, estado: string) {
    const response = await fetch("/api/reservas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, estado }),
    });
    const result = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !result.ok) return toast.error(result.error || "No se pudo actualizar");
    toast.success("Solicitud actualizada");
    await load();
  }

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><CalendarDays className="h-8 w-8 text-primary" />Agenda y reservas</h1>
            <p className="mt-1 text-muted-foreground">Sesiones programadas y solicitudes recibidas desde la portada.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild><Button onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nueva sesión</Button></DialogTrigger>
            <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
              <DialogHeader><DialogTitle>{editingId ? "Editar sesión" : "Nueva sesión"}</DialogTitle></DialogHeader>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><Label>Cliente</Label><Select value={form.cliente_id} onValueChange={(value) => setForm({ ...form, cliente_id: value })}><SelectTrigger className="mt-2"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client._id} value={client._id}>{client.nombre} · {client.email}</SelectItem>)}</SelectContent></Select></div>
                <Field label="Título" value={form.titulo} onChange={(value) => setForm({ ...form, titulo: value })} className="sm:col-span-2" />
                <Field label="Fecha y hora" type="datetime-local" value={form.inicio_at} onChange={(value) => setForm({ ...form, inicio_at: value })} />
                <Field label="Duración (minutos)" type="number" value={form.duracion_minutos} onChange={(value) => setForm({ ...form, duracion_minutos: value })} />
                <SelectField label="Tipo" value={form.tipo_sesion} onChange={(value) => setForm({ ...form, tipo_sesion: value })} options={typeLabels} />
                <SelectField label="Estado" value={form.estado} onChange={(value) => setForm({ ...form, estado: value })} options={stateLabels} />
                <SelectField label="Modalidad" value={form.modalidad} onChange={(value) => setForm({ ...form, modalidad: value })} options={{ presencial: "Presencial", online: "Online", exterior: "Exterior" }} />
                <Field label="Ubicación o enlace" value={form.ubicacion} onChange={(value) => setForm({ ...form, ubicacion: value })} />
                <div className="sm:col-span-2"><Label>Notas profesionales</Label><Textarea className="mt-2" rows={4} value={form.notas_profesional} onChange={(event) => setForm({ ...form, notas_profesional: event.target.value })} /></div>
                {form.estado === "cancelada" ? <Field label="Motivo de cancelación" value={form.motivo_cancelacion} onChange={(value) => setForm({ ...form, motivo_cancelacion: value })} className="sm:col-span-2" /> : null}
              </div>
              <Button className="mt-5 w-full" onClick={saveSession} disabled={saving}>{saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear sesión"}</Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Summary label="Sesiones de hoy" value={String(todayCount)} icon={<CalendarDays className="h-5 w-5" />} />
          <Summary label="Próximos 7 días" value={String(nextSeven)} icon={<Clock3 className="h-5 w-5" />} />
          <Summary label="Pendientes de confirmar" value={String(pendingCount)} icon={<CheckCircle2 className="h-5 w-5" />} />
          <Summary label="Solicitudes nuevas" value={String(newRequests)} icon={<Inbox className="h-5 w-5" />} />
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button variant={activeTab === "agenda" ? "default" : "outline"} onClick={() => setActiveTab("agenda")}><CalendarDays className="mr-2 h-4 w-4" />Agenda</Button>
          <Button variant={activeTab === "solicitudes" ? "default" : "outline"} onClick={() => setActiveTab("solicitudes")}><Inbox className="mr-2 h-4 w-4" />Solicitudes {newRequests ? `(${newRequests})` : ""}</Button>
        </div>

        {loading ? <p className="py-16 text-center text-muted-foreground">Cargando agenda...</p> : activeTab === "agenda" ? <>
          <Card className="mb-6"><CardContent className="grid gap-4 p-5 sm:grid-cols-2">
            <SelectField label="Filtrar por estado" value={stateFilter} onChange={setStateFilter} options={{ todos: "Todos", ...stateLabels }} />
            <div><Label>Filtrar por cliente</Label><Select value={clientFilter} onValueChange={setClientFilter}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos</SelectItem>{clients.map((client) => <SelectItem key={client._id} value={client._id}>{client.nombre}</SelectItem>)}</SelectContent></Select></div>
          </CardContent></Card>

          {!groupedSessions.length ? <Card><CardContent className="py-16 text-center"><CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-bold">No hay sesiones en este filtro</h2></CardContent></Card> : <div className="space-y-7">{groupedSessions.map(([date, daySessions]) => <section key={date}><h2 className="mb-3 capitalize text-lg font-bold">{date}</h2><div className="space-y-3">{daySessions.map((session) => <Card key={session.id}><CardContent className="p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex gap-4"><div className="min-w-20 rounded-2xl bg-primary/10 px-3 py-3 text-center text-primary"><p className="text-xl font-bold">{formatTime(session.inicio_at)}</p><p className="text-xs">{session.duracion_minutos} min</p></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{session.titulo}</h3><Badge className={stateClasses[session.estado]}>{stateLabels[session.estado] || session.estado}</Badge></div><p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><UserRound className="h-4 w-4" />{session.clientes?.nombre || "Cliente"} · {typeLabels[session.tipo_sesion] || session.tipo_sesion}</p>{session.ubicacion ? <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-4 w-4" />{session.ubicacion}</p> : null}{session.motivo_cancelacion ? <p className="mt-2 text-sm text-red-600">{session.motivo_cancelacion}</p> : null}</div></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(session)}><Pencil className="mr-2 h-4 w-4" />Editar</Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteSession(session.id)}><Trash2 className="h-4 w-4" /></Button></div></div></CardContent></Card>)}</div></section>)}</div>}
        </> : <>
          {!requests.length ? <Card><CardContent className="py-16 text-center"><Inbox className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-bold">Todavía no hay solicitudes</h2></CardContent></Card> : <div className="space-y-4">{requests.map((request) => <Card key={request.id}><CardContent className="p-5"><div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex flex-wrap items-center gap-2"><h3 className="text-lg font-bold">{request.nombre}</h3><Badge className={requestStateClasses[request.estado]}>{request.estado}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{request.email}{request.telefono ? ` · ${request.telefono}` : ""}</p><p className="mt-3 text-sm"><strong>Modalidad:</strong> {request.modalidad.replaceAll("_", " ")}</p>{request.objetivo ? <p className="mt-1 text-sm"><strong>Objetivo:</strong> {request.objetivo}</p> : null}{request.mensaje ? <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{request.mensaje}</p> : null}<p className="mt-3 text-xs text-muted-foreground">Recibida el {formatDateTime(request.created_at)}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => prepareFromRequest(request)} disabled={request.estado === "convertida"}><Plus className="mr-2 h-4 w-4" />Preparar cita</Button>{request.estado === "nueva" ? <Button variant="outline" size="sm" onClick={() => updateRequest(request.id, "contactada")}><CheckCircle2 className="mr-2 h-4 w-4" />Contactada</Button> : null}{request.estado !== "descartada" && request.estado !== "convertida" ? <Button variant="ghost" size="sm" className="text-destructive" onClick={() => updateRequest(request.id, "descartada")}><XCircle className="mr-2 h-4 w-4" />Descartar</Button> : null}</div></div></CardContent></Card>)}</div>}
        </>}
      </div>
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
function formatTime(value: string) { return new Date(value).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }); }
function formatDateTime(value: string) { return new Date(value).toLocaleString("es-ES", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
