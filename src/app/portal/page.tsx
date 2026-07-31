"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Dumbbell, History, PlayCircle, Square } from "lucide-react";
import { toast } from "sonner";

type Exercise = {
  id: string;
  dia: number;
  orden: number;
  series: number;
  repeticiones: string;
  peso_kg: number | null;
  descanso_segundos: number;
  tempo: string | null;
  rpe: number | null;
  instrucciones_cliente: string | null;
  tipo_serie: string;
  rol_ejercicio: string;
  ejercicios?: {
    nombre: string;
    grupo_muscular: string;
    material: string | null;
    imagen_url: string | null;
    miniatura_url: string | null;
    gif_url: string | null;
    video_url: string | null;
  };
};

type PortalData = {
  cliente: { id: string; nombre: string; email: string | null };
  asignacion: Record<string, unknown> | null;
  rutina?: { id: string; nombre: string; descripcion: string | null; objetivo: string; nivel: string; dias_semana: number; duracion_sesion_minutos: number | null };
  ejercicios: Exercise[];
};

type SetRow = {
  id: string;
  rutina_ejercicio_id: string;
  numero_serie: number;
  repeticiones_objetivo: string | null;
  peso_objetivo: number | null;
  repeticiones_realizadas: number | null;
  peso_real: number | null;
  rpe_real: number | null;
  completada: boolean;
  comentario: string | null;
};

type WorkoutSession = {
  sesion: Record<string, unknown>;
  series: SetRow[];
};

type HistoryRow = {
  id: string;
  dia: number;
  iniciada_at: string;
  finalizada_at: string | null;
  duracion_segundos: number | null;
  series_completadas: number;
  ejercicios_completados: number;
  volumen_total: number;
  rpe_sesion: number | null;
  comentario_cliente: string | null;
};

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function PortalPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [sessionRpe, setSessionRpe] = useState("");
  const [sessionComment, setSessionComment] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/portal/historial");
      const result = (await response.json()) as { ok: boolean; data?: HistoryRow[] };
      if (response.ok && result.ok) setHistory(result.data || []);
    } catch {
      // El historial es complementario y no debe bloquear el entrenamiento.
    }
  }, []);

  useEffect(() => {
    fetch("/api/portal/rutina")
      .then(async (response) => {
        const result = (await response.json()) as { ok: boolean; data?: PortalData | null; error?: string };
        if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo cargar tu entrenamiento");
        setData(result.data || null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    setSession(null);
    fetch(`/api/portal/entrenamiento?dia=${selectedDay}`)
      .then((response) => response.json())
      .then((result: { ok: boolean; data?: WorkoutSession | null }) => {
        if (result.ok) setSession(result.data || null);
      })
      .catch(() => undefined);
  }, [selectedDay]);

  const dayExercises = useMemo(() => (data?.ejercicios || []).filter((item) => item.dia === selectedDay).sort((a, b) => a.orden - b.orden), [data, selectedDay]);
  const routineDays = data?.rutina?.dias_semana || 1;
  const completedSets = session?.series.filter((row) => row.completada).length || 0;
  const totalSets = session?.series.length || 0;
  const progress = totalSets ? Math.round((completedSets / totalSets) * 100) : 0;
  const sessionState = String(session?.sesion?.estado || "");

  async function startWorkout() {
    setStarting(true);
    try {
      const response = await fetch("/api/portal/entrenamiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dia: selectedDay }),
      });
      const result = (await response.json()) as { ok: boolean; data?: WorkoutSession; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudo iniciar el entrenamiento");
      setSession(result.data);
      toast.success("Entrenamiento iniciado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar");
    } finally {
      setStarting(false);
    }
  }

  function patchLocalSet(id: string, patch: Partial<SetRow>) {
    setSession((current) => current ? { ...current, series: current.series.map((row) => row.id === id ? { ...row, ...patch } : row) } : current);
  }

  async function saveSet(row: SetRow, completed: boolean) {
    const next = { ...row, completada: completed };
    patchLocalSet(row.id, { completada: completed });
    try {
      const response = await fetch("/api/portal/entrenamiento", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_set",
          serie_id: row.id,
          repeticiones_realizadas: next.repeticiones_realizadas ?? "",
          peso_real: next.peso_real ?? "",
          rpe_real: next.rpe_real ?? "",
          comentario: next.comentario || "",
          completada: completed,
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo guardar la serie");
    } catch (err) {
      patchLocalSet(row.id, { completada: row.completada });
      toast.error(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  async function finishWorkout() {
    if (!session?.sesion?.id) return;
    setFinishing(true);
    try {
      const response = await fetch("/api/portal/entrenamiento", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finish_session",
          session_id: session.sesion.id,
          rpe_sesion: sessionRpe,
          comentario_cliente: sessionComment,
        }),
      });
      const result = (await response.json()) as { ok: boolean; data?: WorkoutSession; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo finalizar");
      setSession(result.data || session);
      await loadHistory();
      toast.success("Entrenamiento completado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al finalizar");
    } finally {
      setFinishing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#29312e]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold tracking-[0.22em] text-[#c9653b]">CHETESAÍ FITNESS+</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Mi entrenamiento</h1><p className="mt-2 text-sm text-[#707872]">{data?.cliente?.nombre ? `Hola, ${data.cliente.nombre}. Aquí tienes tu planificación activa.` : "Tu espacio privado de entrenamiento."}</p></div>
          <div className="w-full max-w-52 rounded-xl border border-[#e7dfd3] bg-white p-1 text-[#46624f] sm:w-52"><LogoutButton /></div>
        </header>

        {loading ? <p className="py-16 text-center text-[#707872]">Cargando tu entrenamiento...</p> : error ? <Card><CardContent className="py-12 text-center text-red-600">{error}</CardContent></Card> : !data?.asignacion || !data.rutina ? (
          <Card><CardContent className="py-16 text-center"><Dumbbell className="mx-auto mb-4 h-10 w-10 text-[#707872]" /><h2 className="text-xl font-bold">Todavía no tienes una rutina asignada</h2></CardContent></Card>
        ) : (
          <>
            <section className="mb-6 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#46624f]">Plan activo</p><h2 className="mt-2 text-2xl font-bold">{data.rutina.nombre}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#707872]">{data.rutina.descripcion}</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-[#e9f2ea] px-3 py-1 text-[#46624f]">{data.rutina.dias_semana} días/semana</span><span className="rounded-full bg-[#f0ede7] px-3 py-1">{data.rutina.nivel}</span></div></div></section>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{Array.from({ length: routineDays }, (_, index) => index + 1).map((day) => <Button key={day} onClick={() => setSelectedDay(day)} className={selectedDay === day ? "bg-[#46624f] text-white hover:bg-[#3c5544]" : "border border-[#e7dfd3] bg-[#fffdf9] text-[#29312e] hover:bg-[#f0ede7]"}>Día {day} · {days[day - 1]}</Button>)}</div>

            {dayExercises.length > 0 && !session ? <Button className="mb-6 w-full bg-[#c9653b] py-6 text-base hover:bg-[#b65a35]" onClick={startWorkout} disabled={starting}><PlayCircle className="mr-2 h-5 w-5" />{starting ? "Iniciando..." : "Comenzar entrenamiento"}</Button> : null}

            {session && sessionState === "en_curso" ? <section className="mb-6 rounded-3xl border border-[#d8e4da] bg-[#eef5ef] p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#46624f]">Sesión en curso</p><p className="mt-1 font-bold">{completedSets} de {totalSets} series completadas</p></div><span className="text-2xl font-bold text-[#46624f]">{progress}%</span></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-white"><div className="h-full bg-[#46624f] transition-all" style={{ width: `${progress}%` }} /></div></section> : null}

            <div className="space-y-4">{dayExercises.map((item, index) => {
              const exercise = item.ejercicios;
              const media = exercise?.miniatura_url || exercise?.imagen_url || exercise?.gif_url;
              const rows = session?.series.filter((row) => row.rutina_ejercicio_id === item.id) || [];
              return <article key={item.id} className="rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-5 shadow-sm"><div className="flex flex-col gap-5 md:flex-row"><div className="h-28 w-full overflow-hidden rounded-2xl bg-[#f0ede7] md:w-36">{media ? <img src={media} alt={exercise?.nombre || "Ejercicio"} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Dumbbell className="h-8 w-8 text-[#707872]" /></div>}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#c9653b]">Ejercicio {index + 1} · {item.tipo_serie.replace("_", " ")}</p><h3 className="mt-1 text-xl font-bold">{exercise?.nombre || "Ejercicio"}</h3><p className="mt-1 text-sm text-[#707872]">{exercise?.grupo_muscular}{exercise?.material ? ` · ${exercise.material}` : ""}</p>{item.instrucciones_cliente ? <p className="mt-4 rounded-2xl bg-[#f7f4ee] p-4 text-sm leading-6 text-[#56605a]">{item.instrucciones_cliente}</p> : null}{rows.length ? <div className="mt-5 space-y-3">{rows.map((row) => <div key={row.id} className={`grid gap-2 rounded-2xl border p-3 sm:grid-cols-[70px_1fr_1fr_1fr_48px] ${row.completada ? "border-[#bcd3c0] bg-[#eef5ef]" : "border-[#e7dfd3]"}`}><div className="flex items-center font-bold">Serie {row.numero_serie}</div><Input type="number" min={0} placeholder={`Reps ${row.repeticiones_objetivo || ""}`} value={row.repeticiones_realizadas ?? ""} onChange={(e) => patchLocalSet(row.id, { repeticiones_realizadas: e.target.value ? Number(e.target.value) : null })} /><Input type="number" min={0} step="0.5" placeholder={`Kg ${row.peso_objetivo ?? ""}`} value={row.peso_real ?? ""} onChange={(e) => patchLocalSet(row.id, { peso_real: e.target.value ? Number(e.target.value) : null })} /><Input type="number" min={1} max={10} step="0.5" placeholder="RPE" value={row.rpe_real ?? ""} onChange={(e) => patchLocalSet(row.id, { rpe_real: e.target.value ? Number(e.target.value) : null })} /><Button size="icon" variant={row.completada ? "default" : "outline"} onClick={() => saveSet(row, !row.completada)}>{row.completada ? <CheckCircle2 className="h-5 w-5" /> : <Square className="h-5 w-5" />}</Button></div>)}</div> : null}{exercise?.video_url ? <a href={exercise.video_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#46624f]"><PlayCircle className="h-4 w-4" />Ver vídeo</a> : null}</div></div></article>;
            })}</div>

            {session && sessionState === "en_curso" ? <section className="mt-6 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6"><h3 className="text-xl font-bold">Finalizar entrenamiento</h3><div className="mt-4 grid gap-4 md:grid-cols-3"><Input type="number" min={1} max={10} step="0.5" placeholder="RPE global" value={sessionRpe} onChange={(e) => setSessionRpe(e.target.value)} /><Textarea className="md:col-span-2" placeholder="¿Cómo te fue hoy?" value={sessionComment} onChange={(e) => setSessionComment(e.target.value)} /></div><Button className="mt-4 w-full bg-[#46624f] py-6" onClick={finishWorkout} disabled={finishing}>{finishing ? "Finalizando..." : `Finalizar sesión (${progress}%)`}</Button></section> : null}

            {session && sessionState === "completada" ? <section className="mt-6 rounded-3xl border border-[#bcd3c0] bg-[#eef5ef] p-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-[#46624f]" /><h3 className="mt-3 text-2xl font-bold">Entrenamiento completado</h3><p className="mt-2 text-[#56605a]">Volumen total: {Number(session.sesion.volumen_total || 0).toLocaleString("es-ES")} kg · Series: {String(session.sesion.series_completadas || 0)}</p></section> : null}

            {history.length ? <section className="mt-8"><div className="mb-4 flex items-center gap-3"><History className="h-6 w-6 text-[#46624f]" /><div><h3 className="text-xl font-bold">Historial reciente</h3><p className="text-sm text-[#707872]">Tus últimos entrenamientos completados.</p></div></div><div className="grid gap-3 md:grid-cols-2">{history.map((item) => <article key={item.id} className="rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#46624f]">Día {item.dia} · {days[item.dia - 1]}</p><h4 className="mt-1 font-bold">{new Date(item.finalizada_at || item.iniciada_at).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</h4></div>{item.rpe_sesion !== null ? <span className="rounded-full bg-[#f0ede7] px-3 py-1 text-xs font-semibold">RPE {item.rpe_sesion}</span> : null}</div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><HistoryMetric label="Duración" value={formatDuration(item.duracion_segundos)} /><HistoryMetric label="Series" value={String(item.series_completadas || 0)} /><HistoryMetric label="Volumen" value={`${Number(item.volumen_total || 0).toLocaleString("es-ES")} kg`} /></div>{item.comentario_cliente ? <p className="mt-4 rounded-2xl bg-[#f7f4ee] p-3 text-sm text-[#56605a]">{item.comentario_cliente}</p> : null}</article>)}</div></section> : null}
          </>
        )}
      </div>
    </main>
  );
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "0 min";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining ? `${minutes}m ${remaining}s` : `${minutes} min`;
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#f7f4ee] px-2 py-3"><p className="text-[10px] uppercase tracking-wide text-[#707872]">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}
