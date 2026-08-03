"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  TicketCheck,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import LogoutButton from "@/components/LogoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
};

type Registration = {
  id: string;
  evento_id: string;
  estado: string;
  fecha_inscripcion: string;
};

type PortalData = {
  cliente: { id: string; nombre: string; email: string | null };
  eventos: EventRecord[];
  inscripciones: Registration[];
  preferencias: { eventos_email: boolean; recordatorios_email: boolean };
};

const categoryLabels: Record<string, string> = {
  pilates: "Pilates",
  running: "Running",
  nutricion: "Nutrición",
  senderismo: "Senderismo",
  movilidad: "Movilidad",
  taller: "Taller",
  otro: "Evento especial",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ClientEventsPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [savingPreferences, setSavingPreferences] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/portal/eventos");
      const result = (await response.json()) as { ok: boolean; data?: PortalData; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudieron cargar los eventos");
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar eventos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const registrationMap = useMemo(() => {
    const map = new Map<string, Registration>();
    for (const registration of data?.inscripciones || []) map.set(registration.evento_id, registration);
    return map;
  }, [data?.inscripciones]);

  const upcoming = useMemo(
    () => (data?.eventos || []).filter((event) => new Date(event.fecha_inicio).getTime() >= Date.now() && !["finalizado", "cancelado"].includes(event.estado)),
    [data?.eventos]
  );
  const history = useMemo(
    () => (data?.eventos || []).filter((event) => new Date(event.fecha_inicio).getTime() < Date.now() || event.estado === "finalizado"),
    [data?.eventos]
  );
  const myConfirmed = (data?.inscripciones || []).filter((item) => item.estado === "confirmada").length;
  const myWaiting = (data?.inscripciones || []).filter((item) => item.estado === "lista_espera").length;

  async function register(eventId: string) {
    setWorkingId(eventId);
    try {
      const response = await fetch("/api/portal/eventos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evento_id: eventId }),
      });
      const result = (await response.json()) as { ok: boolean; data?: { estado?: string }; error?: string; warning?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo reservar la plaza");
      if (result.warning) toast.warning(result.warning);
      toast.success(result.data?.estado === "lista_espera" ? "Te hemos añadido a la lista de espera" : "Tu plaza está confirmada");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al reservar");
    } finally {
      setWorkingId(null);
    }
  }

  async function cancel(eventId: string) {
    setWorkingId(eventId);
    try {
      const response = await fetch("/api/portal/eventos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evento_id: eventId }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string; warning?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo cancelar la inscripción");
      if (result.warning) toast.warning(result.warning);
      else toast.success("Inscripción cancelada");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cancelar");
    } finally {
      setWorkingId(null);
    }
  }

  async function updatePreferences(field: "eventos_email" | "recordatorios_email", checked: boolean) {
    if (!data) return;
    const next = { ...data.preferencias, [field]: checked };
    setData({ ...data, preferencias: next });
    setSavingPreferences(true);
    try {
      const response = await fetch("/api/portal/eventos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudieron guardar tus preferencias");
      toast.success("Preferencias actualizadas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
      await load();
    } finally {
      setSavingPreferences(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#29312e]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#c9653b]">COMUNIDAD CHETESAÍ</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight"><CalendarDays className="h-8 w-8 text-[#46624f]" />Eventos especiales</h1>
            <p className="mt-2 text-sm text-[#707872]">{data?.cliente?.nombre ? `Hola, ${data.cliente.nombre}. Reserva tu plaza en las próximas experiencias.` : "Actividades para entrenar, aprender y compartir."}</p>
          </div>
          <div className="w-full max-w-52 rounded-xl border border-[#e7dfd3] bg-white p-1 text-[#46624f] sm:w-52"><LogoutButton /></div>
        </header>

        {loading ? <p className="py-16 text-center text-[#707872]">Cargando eventos...</p> : !data ? null : <>
          <section className="mb-7 grid gap-4 sm:grid-cols-3">
            <Metric label="Eventos disponibles" value={String(upcoming.length)} />
            <Metric label="Mis plazas" value={String(myConfirmed)} />
            <Metric label="Lista de espera" value={String(myWaiting)} />
          </section>

          <section className="mb-10 rounded-3xl border border-[#d8dfd9] bg-[#fffdf9] p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#46624f]">Comunicaciones</p><h2 className="mt-1 text-xl font-bold">Cómo quieres recibir los avisos</h2></div>
              {savingPreferences ? <span className="text-sm text-[#707872]">Guardando...</span> : null}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Preference checked={data.preferencias.eventos_email} onChange={(checked) => updatePreferences("eventos_email", checked)} icon={CalendarDays} title="Nuevos eventos" description="Recibir invitaciones cuando se publique una actividad." />
              <Preference checked={data.preferencias.recordatorios_email} onChange={(checked) => updatePreferences("recordatorios_email", checked)} icon={BellRing} title="Recordatorios" description="Recibir un aviso antes de los eventos en los que tengas plaza." />
            </div>
          </section>

          <section className="mb-12">
            <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#46624f]">Próximamente</p><h2 className="mt-1 text-2xl font-bold">Experiencias disponibles</h2></div>
            {!upcoming.length ? <Card><CardContent className="py-16 text-center"><CalendarDays className="mx-auto h-11 w-11 text-[#87908b]" /><h3 className="mt-4 text-xl font-bold">No hay eventos publicados</h3><p className="mt-2 text-[#707872]">La próxima experiencia aparecerá aquí cuando esté disponible.</p></CardContent></Card> : <div className="grid gap-5 md:grid-cols-2">{upcoming.map((event) => <EventCard key={event.id} event={event} registration={registrationMap.get(event.id)} working={workingId === event.id} onRegister={() => register(event.id)} onCancel={() => cancel(event.id)} />)}</div>}
          </section>

          {history.length ? <section><div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#707872]">Historial</p><h2 className="mt-1 text-2xl font-bold">Eventos anteriores</h2></div><div className="grid gap-4 md:grid-cols-2">{history.map((event) => <EventCard key={event.id} event={event} registration={registrationMap.get(event.id)} history />)}</div></section> : null}
        </>}
      </div>
    </main>
  );
}

function EventCard({ event, registration, working = false, history = false, onRegister, onCancel }: { event: EventRecord; registration?: Registration; working?: boolean; history?: boolean; onRegister?: () => void; onCancel?: () => void }) {
  const price = Number(event.precio || 0);
  const registered = registration && ["confirmada", "lista_espera"].includes(registration.estado);
  const closed = event.estado === "completo" && !registered;
  return <Card className="overflow-hidden"><div className="h-44 bg-[#17211c] bg-cover bg-center" style={event.imagen_url ? { backgroundImage: `linear-gradient(rgba(23,33,28,.18),rgba(23,33,28,.76)),url(${event.imagen_url})` } : undefined}><div className="flex h-full flex-col justify-between p-5 text-white"><span className="w-fit rounded-full bg-[#d6b45f] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#17211c]">{categoryLabels[event.categoria] || event.categoria}</span><div><p className="text-2xl font-bold">{event.titulo}</p><p className="mt-1 text-sm text-white/75">{formatDate(event.fecha_inicio)}</p></div></div></div><CardContent className="p-5"><p className="line-clamp-3 text-sm leading-6 text-[#707872]">{event.descripcion}</p><div className="mt-4 space-y-2 text-sm text-[#65706a]"><p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#46624f]" />{event.ubicacion || event.enlace_online || event.modalidad}</p><p className="flex items-center gap-2"><Users className="h-4 w-4 text-[#46624f]" />Aforo: {event.aforo} personas</p><p className="flex items-center gap-2"><TicketCheck className="h-4 w-4 text-[#46624f]" />{price > 0 ? `${price.toFixed(2).replace(".", ",")} €` : "Actividad gratuita"}</p></div>{registration ? <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${registration.estado === "confirmada" ? "bg-emerald-50 text-emerald-800" : registration.estado === "lista_espera" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-700"}`}>{registration.estado === "confirmada" ? <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Tienes plaza confirmada</span> : registration.estado === "lista_espera" ? <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" />Estás en lista de espera</span> : "Inscripción cancelada"}</div> : null}{!history ? <div className="mt-5 flex gap-2">{registered ? <Button variant="outline" disabled={working} className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={onCancel}><XCircle className="mr-2 h-4 w-4" />Cancelar inscripción</Button> : <Button disabled={working} className="w-full bg-[#2f9e24] hover:bg-[#27891e]" onClick={onRegister}><TicketCheck className="mr-2 h-4 w-4" />{working ? "Procesando..." : closed ? "Entrar en lista de espera" : "Reservar plaza"}</Button>}</div> : null}</CardContent></Card>;
}

function Metric({ label, value }: { label: string; value: string }) { return <Card><CardContent className="p-5"><p className="text-sm text-[#707872]">{label}</p><p className="mt-2 text-3xl font-bold text-[#46624f]">{value}</p></CardContent></Card>; }

function Preference({ checked, onChange, icon: Icon, title, description }: { checked: boolean; onChange: (checked: boolean) => void; icon: typeof CalendarDays; title: string; description: string }) {
  return <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#d8dfd9] bg-white p-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#e9f3ea]"><Icon className="h-5 w-5 text-[#46624f]" /></div><div className="flex-1"><p className="font-bold">{title}</p><p className="mt-1 text-sm text-[#707872]">{description}</p></div><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-5 w-5 accent-[#2f9e24]" /></label>;
}
