"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Mail,
  MapPin,
  Plus,
  Send,
  TicketCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type EventRecord = {
  id: string;
  titulo: string;
  categoria: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  modalidad: string;
  ubicacion: string | null;
  enlace_online: string | null;
  imagen_url: string | null;
  aforo: number;
  precio: number | string;
  fecha_limite_inscripcion: string | null;
  estado: string;
  invitacion_enviada_at: string | null;
  ultimo_recordatorio_at: string | null;
};

type Registration = {
  id: string;
  evento_id: string;
  cliente_id: string;
  estado: string;
  fecha_inscripcion: string;
  clientes?: { id: string; nombre: string; email: string | null; telefono?: string | null } | null;
};

type EventsData = {
  eventos: EventRecord[];
  inscripciones: Registration[];
  comunicaciones: Array<{ evento_id: string; tipo: string; estado: string; enviado_at: string }>;
};

type FormState = {
  titulo: string;
  categoria: string;
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  modalidad: string;
  ubicacion: string;
  enlace_online: string;
  imagen_url: string;
  aforo: string;
  precio: string;
  fecha_limite_inscripcion: string;
};

const emptyForm: FormState = {
  titulo: "",
  categoria: "pilates",
  descripcion: "",
  fecha_inicio: "",
  fecha_fin: "",
  modalidad: "presencial",
  ubicacion: "",
  enlace_online: "",
  imagen_url: "",
  aforo: "20",
  precio: "0",
  fecha_limite_inscripcion: "",
};

const categoryLabels: Record<string, string> = {
  pilates: "Pilates",
  running: "Running",
  nutricion: "Nutrición",
  senderismo: "Senderismo",
  movilidad: "Movilidad",
  taller: "Taller",
  otro: "Otro",
};

const stateLabels: Record<string, string> = {
  borrador: "Borrador",
  publicado: "Publicado",
  completo: "Completo",
  finalizado: "Finalizado",
  cancelado: "Cancelado",
};

const stateClasses: Record<string, string> = {
  borrador: "bg-slate-100 text-slate-700",
  publicado: "bg-emerald-100 text-emerald-800",
  completo: "bg-amber-100 text-amber-800",
  finalizado: "bg-blue-100 text-blue-800",
  cancelado: "bg-red-100 text-red-800",
};

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function EventsManagementPage() {
  const [data, setData] = useState<EventsData>({ eventos: [], inscripciones: [], comunicaciones: [] });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/eventos");
      const result = (await response.json()) as { ok: boolean; data?: EventsData; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudieron cargar los eventos");
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar eventos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const upcoming = useMemo(
    () => data.eventos.filter((event) => new Date(event.fecha_inicio).getTime() >= Date.now() && !["cancelado", "finalizado"].includes(event.estado)),
    [data.eventos]
  );
  const drafts = data.eventos.filter((event) => event.estado === "borrador").length;
  const confirmedTotal = data.inscripciones.filter((item) => item.estado === "confirmada").length;

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(event: EventRecord) {
    setEditingId(event.id);
    setForm({
      titulo: event.titulo,
      categoria: event.categoria,
      descripcion: event.descripcion || "",
      fecha_inicio: localDateTime(event.fecha_inicio),
      fecha_fin: localDateTime(event.fecha_fin),
      modalidad: event.modalidad,
      ubicacion: event.ubicacion || "",
      enlace_online: event.enlace_online || "",
      imagen_url: event.imagen_url || "",
      aforo: String(event.aforo),
      precio: String(event.precio || 0),
      fecha_limite_inscripcion: localDateTime(event.fecha_limite_inscripcion),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        aforo: Number(form.aforo),
        precio: Number(form.precio),
        fecha_fin: form.fecha_fin || null,
        fecha_limite_inscripcion: form.fecha_limite_inscripcion || null,
      };
      const response = await fetch(editingId ? `/api/eventos/${editingId}` : "/api/eventos", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo guardar el evento");
      toast.success(editingId ? "Evento actualizado" : "Evento creado como borrador");
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function runAction(id: string, action: "publicar" | "recordatorio" | "cancelar") {
    setWorkingId(id);
    try {
      const response = action === "cancelar"
        ? await fetch(`/api/eventos/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: "cancelado" }),
          })
        : await fetch(`/api/eventos/${id}/${action}`, { method: "POST" });
      const result = (await response.json()) as { ok: boolean; error?: string; warning?: string; enviados?: number };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo completar la acción");
      if (result.warning) toast.warning(result.warning);
      else if (action === "publicar") toast.success(`Evento publicado · ${result.enviados || 0} invitaciones enviadas`);
      else if (action === "recordatorio") toast.success(`Recordatorio enviado a ${result.enviados || 0} clientes`);
      else toast.success("Evento cancelado y clientes avisados");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error en la acción");
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-8 text-[#29312e] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#c9653b]">COMUNIDAD CHETESAÍ</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
              <CalendarDays className="h-9 w-9 text-[#46624f]" /> Eventos y comunidad
            </h1>
            <p className="mt-2 text-[#707872]">Organiza experiencias mensuales, controla plazas y mantén informados a tus clientes.</p>
          </div>
          <Button className="bg-[#2f9e24] hover:bg-[#27891e]" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Nuevo evento</Button>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <Metric icon={CalendarDays} label="Próximos eventos" value={String(upcoming.length)} />
          <Metric icon={Edit3} label="Borradores" value={String(drafts)} />
          <Metric icon={TicketCheck} label="Inscripciones confirmadas" value={String(confirmedTotal)} />
        </section>

        {showForm ? (
          <form onSubmit={saveEvent} className="mb-8 rounded-3xl border border-[#d8dfd9] bg-[#fffdf9] p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#46624f]">{editingId ? "Editar evento" : "Nuevo evento"}</p><h2 className="mt-1 text-2xl font-bold">{editingId ? form.titulo || "Evento" : "Prepara la próxima experiencia"}</h2></div><button type="button" onClick={() => setShowForm(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#eef2ee]" aria-label="Cerrar"><X className="h-5 w-5" /></button></div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Título" className="xl:col-span-2"><input required value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="input" placeholder="Jornada de Pilates y movilidad" /></Field>
              <Field label="Categoría"><select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className="input">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label="Modalidad"><select value={form.modalidad} onChange={(e) => setForm({ ...form, modalidad: e.target.value })} className="input"><option value="presencial">Presencial</option><option value="online">Online</option><option value="mixta">Mixta</option></select></Field>
              <Field label="Fecha y hora"><input required type="datetime-local" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} className="input" /></Field>
              <Field label="Fecha de finalización"><input type="datetime-local" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} className="input" /></Field>
              <Field label="Cierre de inscripciones"><input type="datetime-local" value={form.fecha_limite_inscripcion} onChange={(e) => setForm({ ...form, fecha_limite_inscripcion: e.target.value })} className="input" /></Field>
              <Field label="Aforo"><input required min="1" max="500" type="number" value={form.aforo} onChange={(e) => setForm({ ...form, aforo: e.target.value })} className="input" /></Field>
              <Field label="Ubicación"><input value={form.ubicacion} onChange={(e) => setForm({ ...form, ubicacion: e.target.value })} className="input" placeholder="Porto Cristo, Mallorca" /></Field>
              <Field label="Enlace online"><input type="url" value={form.enlace_online} onChange={(e) => setForm({ ...form, enlace_online: e.target.value })} className="input" placeholder="https://..." /></Field>
              <Field label="Precio (€)"><input min="0" step="0.01" type="number" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} className="input" /></Field>
              <Field label="Imagen de portada"><input type="url" value={form.imagen_url} onChange={(e) => setForm({ ...form, imagen_url: e.target.value })} className="input" placeholder="https://..." /></Field>
              <Field label="Descripción" className="md:col-span-2 xl:col-span-4"><textarea required rows={4} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="input resize-y" placeholder="Explica qué se hará, para quién está pensado y qué debe llevar cada participante." /></Field>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-3"><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button type="submit" disabled={saving} className="bg-[#46624f] hover:bg-[#3b5543]">{saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear borrador"}</Button></div>
          </form>
        ) : null}

        {loading ? <p className="py-20 text-center text-[#707872]">Cargando eventos...</p> : !data.eventos.length ? (
          <Card><CardContent className="py-20 text-center"><CalendarDays className="mx-auto h-12 w-12 text-[#8b948f]" /><h2 className="mt-4 text-2xl font-bold">Todavía no hay eventos</h2><p className="mt-2 text-[#707872]">Crea la primera jornada especial para tu comunidad.</p><Button className="mt-6 bg-[#2f9e24] hover:bg-[#27891e]" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Crear evento</Button></CardContent></Card>
        ) : (
          <div className="space-y-5">
            {data.eventos.map((event) => {
              const registrations = data.inscripciones.filter((item) => item.evento_id === event.id);
              const confirmed = registrations.filter((item) => ["confirmada", "asistio"].includes(item.estado));
              const waiting = registrations.filter((item) => item.estado === "lista_espera");
              const progress = Math.min(100, Math.round((confirmed.length / Math.max(event.aforo, 1)) * 100));
              const expanded = expandedId === event.id;
              const actionBusy = workingId === event.id;
              return (
                <article key={event.id} className="overflow-hidden rounded-3xl border border-[#d8dfd9] bg-[#fffdf9] shadow-sm">
                  <div className="grid lg:grid-cols-[260px_1fr]">
                    <div className="min-h-48 bg-[#17211c] bg-cover bg-center" style={event.imagen_url ? { backgroundImage: `linear-gradient(rgba(23,33,28,.25),rgba(23,33,28,.75)),url(${event.imagen_url})` } : undefined}><div className="flex h-full min-h-48 flex-col justify-between p-5 text-white"><Badge className={stateClasses[event.estado]}>{stateLabels[event.estado] || event.estado}</Badge><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d6b45f]">{categoryLabels[event.categoria] || event.categoria}</p><p className="mt-2 text-2xl font-bold">{new Date(event.fecha_inicio).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}</p></div></div></div>
                    <div className="p-5 sm:p-7">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                        <div className="max-w-3xl"><h2 className="text-2xl font-bold">{event.titulo}</h2><p className="mt-2 text-[#707872]">{event.descripcion || "Sin descripción"}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#65706a]"><span className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#46624f]" />{formatDate(event.fecha_inicio)}</span><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#46624f]" />{event.ubicacion || event.enlace_online || event.modalidad}</span><span className="flex items-center gap-2"><Users className="h-4 w-4 text-[#46624f]" />{confirmed.length}/{event.aforo} plazas</span></div></div>
                        <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => openEdit(event)}><Edit3 className="mr-2 h-4 w-4" />Editar</Button>{!["cancelado", "finalizado"].includes(event.estado) ? <Button size="sm" disabled={actionBusy} className="bg-[#2f9e24] hover:bg-[#27891e]" onClick={() => runAction(event.id, "publicar")}><Send className="mr-2 h-4 w-4" />{event.invitacion_enviada_at ? "Reenviar invitación" : "Publicar e invitar"}</Button> : null}{["publicado", "completo"].includes(event.estado) ? <Button variant="outline" size="sm" disabled={actionBusy || !confirmed.length} onClick={() => runAction(event.id, "recordatorio")}><BellRing className="mr-2 h-4 w-4" />Recordatorio</Button> : null}{!["cancelado", "finalizado"].includes(event.estado) ? <Button variant="ghost" size="sm" disabled={actionBusy} className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => runAction(event.id, "cancelar")}><XCircle className="mr-2 h-4 w-4" />Cancelar evento</Button> : null}</div>
                      </div>
                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#ece9e1]"><div className="h-full rounded-full bg-[#2f9e24] transition-all" style={{ width: `${progress}%` }} /></div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm"><p><strong>{confirmed.length}</strong> confirmados · <strong>{waiting.length}</strong> en espera · <strong>{Math.max(event.aforo - confirmed.length, 0)}</strong> plazas libres</p><button type="button" className="font-semibold text-[#46624f] hover:underline" onClick={() => setExpandedId(expanded ? null : event.id)}>{expanded ? "Ocultar participantes" : "Ver participantes"}</button></div>
                    </div>
                  </div>
                  {expanded ? <div className="border-t border-[#e5e1d9] bg-white px-5 py-5 sm:px-7"><h3 className="mb-4 flex items-center gap-2 font-bold"><TicketCheck className="h-5 w-5 text-[#46624f]" />Participantes</h3>{!registrations.length ? <p className="text-sm text-[#707872]">Todavía no hay inscripciones.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b text-xs uppercase tracking-wide text-[#707872]"><th className="pb-3">Cliente</th><th className="pb-3">Contacto</th><th className="pb-3">Estado</th><th className="pb-3">Inscripción</th></tr></thead><tbody>{registrations.map((registration) => <tr key={registration.id} className="border-b last:border-0"><td className="py-3 font-semibold">{registration.clientes?.nombre || "Cliente"}</td><td className="py-3 text-[#65706a]">{registration.clientes?.email || registration.clientes?.telefono || "Sin contacto"}</td><td className="py-3"><Badge className={registration.estado === "confirmada" ? "bg-emerald-100 text-emerald-800" : registration.estado === "lista_espera" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}>{registration.estado.replace("_", " ")}</Badge></td><td className="py-3 text-[#65706a]">{formatDate(registration.fecha_inscripcion)}</td></tr>)}</tbody></table></div>}</div> : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
      <style jsx global>{`.input{width:100%;border:1px solid #d8dfd9;border-radius:12px;background:white;padding:11px 13px;font-weight:400;outline:none}.input:focus{border-color:#46624f;box-shadow:0 0 0 3px rgba(70,98,79,.12)}`}</style>
    </main>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`space-y-2 text-sm font-semibold ${className}`}>{label}{children}</label>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e9f3ea]"><Icon className="h-6 w-6 text-[#46624f]" /></div><div><p className="text-sm text-[#707872]">{label}</p><p className="mt-1 text-3xl font-bold">{value}</p></div></CardContent></Card>;
}
