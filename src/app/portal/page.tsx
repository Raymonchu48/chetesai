"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import ExerciseMediaVisual from "@/components/exercises/ExerciseMediaVisual";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Activity, CheckCircle2, CircleCheck, CircleX, Clock3, Dumbbell, History, Lightbulb, PlayCircle, RotateCcw, SkipForward, Square, Target, TrendingUp, TriangleAlert } from "lucide-react";
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
    id: string;
    codigo_interno: string | null;
    nombre: string;
    grupo_muscular: string;
    grupo_secundario: string | null;
    categoria: string;
    dificultad: string;
    material: string | null;
    descripcion: string | null;
    tecnica: string | null;
    errores_frecuentes: string | null;
    consejos: string | null;
    imagen_url: string | null;
    miniatura_url: string | null;
    gif_url: string | null;
    video_url: string | null;
    tipo_movimiento: string | null;
    lateralidad: string | null;
    plano_movimiento: string | null;
    articulacion_principal: string | null;
    progresion: string | null;
    regresion: string | null;
    variante_facil: string | null;
    variante_avanzada: string | null;
    etiquetas: string[];
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
const rpeValues = [6, 7, 8, 9, 10];

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
  const [restSeconds, setRestSeconds] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<NonNullable<Exercise["ejercicios"]> | null>(null);

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
    setRestSeconds(0);
    fetch(`/api/portal/entrenamiento?dia=${selectedDay}`)
      .then((response) => response.json())
      .then((result: { ok: boolean; data?: WorkoutSession | null }) => {
        if (result.ok) setSession(result.data || null);
      })
      .catch(() => undefined);
  }, [selectedDay]);

  useEffect(() => {
    if (restSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRestSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [restSeconds]);

  const dayExercises = useMemo(() => (data?.ejercicios || []).filter((item) => item.dia === selectedDay).sort((a, b) => a.orden - b.orden), [data, selectedDay]);
  const routineDays = data?.rutina?.dias_semana || 1;
  const plannedSets = dayExercises.reduce((sum, item) => sum + Number(item.series || 0), 0);
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

  async function saveSet(row: SetRow, completed: boolean, rest = 60) {
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
      if (completed) setRestSeconds(rest);
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
      setRestSeconds(0);
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

            <section className="mb-6 grid gap-3 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-5 shadow-sm sm:grid-cols-4">
              <SummaryMetric label="Día" value={`${selectedDay} · ${days[selectedDay - 1]}`} />
              <SummaryMetric label="Ejercicios" value={String(dayExercises.length)} />
              <SummaryMetric label="Series" value={String(plannedSets)} />
              <SummaryMetric label="Tiempo estimado" value={`${data.rutina.duracion_sesion_minutos || 60} min`} />
            </section>

            {dayExercises.length > 0 && !session ? <Button className="mb-6 w-full bg-[#c9653b] py-6 text-base hover:bg-[#b65a35]" onClick={startWorkout} disabled={starting}><PlayCircle className="mr-2 h-5 w-5" />{starting ? "Iniciando..." : "Comenzar entrenamiento"}</Button> : null}

            {session && sessionState === "en_curso" ? <section className="sticky top-3 z-20 mb-6 rounded-3xl border border-[#d8e4da] bg-[#eef5ef]/95 p-5 shadow-lg backdrop-blur"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#46624f]">Sesión en curso</p><p className="mt-1 font-bold">{completedSets} de {totalSets} series completadas</p></div><span className="text-2xl font-bold text-[#46624f]">{progress}%</span></div><div className="mt-4 h-3 overflow-hidden rounded-full bg-white"><div className="h-full bg-[#46624f] transition-all" style={{ width: `${progress}%` }} /></div></section> : null}

            {restSeconds > 0 ? <section className="mb-6 flex flex-col items-center justify-between gap-4 rounded-3xl border border-[#f0d3c4] bg-[#fff4ee] p-5 text-center sm:flex-row sm:text-left"><div className="flex items-center gap-3"><Clock3 className="h-7 w-7 text-[#c9653b]" /><div><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#c9653b]">Descanso</p><p className="text-3xl font-bold">{restSeconds}s</p></div></div><Button variant="outline" onClick={() => setRestSeconds(0)}><SkipForward className="mr-2 h-4 w-4" />Saltar descanso</Button></section> : null}

            <div className="space-y-4">{dayExercises.map((item, index) => {
              const exercise = item.ejercicios;
              const rows = session?.series.filter((row) => row.rutina_ejercicio_id === item.id) || [];
              return <article key={item.id} role="button" tabIndex={0} onClick={() => exercise && setSelectedExercise(exercise)} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && exercise) setSelectedExercise(exercise); }} className="cursor-pointer rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#a9bea9] hover:shadow-lg"><div className="flex flex-col gap-5 md:flex-row"><div className="h-28 w-full overflow-hidden rounded-2xl bg-white md:w-36">{exercise ? <ExerciseMediaVisual item={exercise} /> : <div className="grid h-full place-items-center"><Dumbbell className="h-8 w-8 text-[#707872]" /></div>}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#c9653b]">Ejercicio {index + 1} · {item.tipo_serie.replace("_", " ")}</p><h3 className="mt-1 text-xl font-bold">{exercise?.nombre || "Ejercicio"}</h3><p className="mt-1 text-sm text-[#707872]">{exercise?.grupo_muscular}{exercise?.material ? ` · ${exercise.material}` : ""}</p><span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#46624f]"><Target className="h-3.5 w-3.5" />Pulsa para ver la técnica completa</span>{item.instrucciones_cliente ? <p className="mt-4 rounded-2xl bg-[#f7f4ee] p-4 text-sm leading-6 text-[#56605a]">{item.instrucciones_cliente}</p> : null}{rows.length ? <div className="mt-5 space-y-3" onClick={(event) => event.stopPropagation()}>{rows.map((row) => <div key={row.id} className={`rounded-2xl border p-3 ${row.completada ? "border-[#bcd3c0] bg-[#eef5ef]" : "border-[#e7dfd3]"}`}><div className="mb-3 flex items-center justify-between"><span className="font-bold">Serie {row.numero_serie}</span><span className="text-xs text-[#707872]">Objetivo: {row.repeticiones_objetivo || "—"} reps · {row.peso_objetivo ?? "—"} kg</span></div><div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto_48px]"><Input type="number" min={0} placeholder="Repeticiones reales" value={row.repeticiones_realizadas ?? ""} onChange={(e) => patchLocalSet(row.id, { repeticiones_realizadas: e.target.value ? Number(e.target.value) : null })} /><Input type="number" min={0} step="0.5" placeholder="Peso real (kg)" value={row.peso_real ?? ""} onChange={(e) => patchLocalSet(row.id, { peso_real: e.target.value ? Number(e.target.value) : null })} /><div className="flex gap-1">{rpeValues.map((value) => <button key={value} type="button" onClick={() => patchLocalSet(row.id, { rpe_real: value })} className={`h-10 min-w-10 rounded-xl border px-2 text-sm font-bold ${row.rpe_real === value ? "border-[#46624f] bg-[#46624f] text-white" : "border-[#e7dfd3] bg-white"}`}>{value}</button>)}</div><Button size="icon" variant={row.completada ? "default" : "outline"} onClick={() => saveSet(row, !row.completada, item.descanso_segundos)}>{row.completada ? <CheckCircle2 className="h-5 w-5" /> : <Square className="h-5 w-5" />}</Button></div></div>)}</div> : null}{exercise?.video_url ? <a href={exercise.video_url} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#46624f]"><PlayCircle className="h-4 w-4" />Ver vídeo</a> : null}</div></div></article>;
            })}</div>

            {session && sessionState === "en_curso" ? <section className="mt-6 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6"><h3 className="text-xl font-bold">Finalizar entrenamiento</h3><div className="mt-4 grid gap-4 md:grid-cols-3"><Input type="number" min={1} max={10} step="0.5" placeholder="RPE global" value={sessionRpe} onChange={(e) => setSessionRpe(e.target.value)} /><Textarea className="md:col-span-2" placeholder="¿Cómo te fue hoy?" value={sessionComment} onChange={(e) => setSessionComment(e.target.value)} /></div><Button className="mt-4 w-full bg-[#46624f] py-6" onClick={finishWorkout} disabled={finishing}>{finishing ? "Finalizando..." : `Finalizar sesión (${progress}%)`}</Button></section> : null}

            {session && sessionState === "completada" ? <section className="mt-6 rounded-3xl border border-[#bcd3c0] bg-[#eef5ef] p-8 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-[#46624f]" /><h3 className="mt-3 text-2xl font-bold">Entrenamiento completado</h3><p className="mt-2 text-[#56605a]">Volumen total: {Number(session.sesion.volumen_total || 0).toLocaleString("es-ES")} kg · Series: {String(session.sesion.series_completadas || 0)}</p></section> : null}

            {history.length ? <section className="mt-8"><div className="mb-4 flex items-center gap-3"><History className="h-6 w-6 text-[#46624f]" /><div><h3 className="text-xl font-bold">Historial reciente</h3><p className="text-sm text-[#707872]">Tus últimos entrenamientos completados.</p></div></div><div className="grid gap-3 md:grid-cols-2">{history.map((item) => <article key={item.id} className="rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#46624f]">Día {item.dia} · {days[item.dia - 1]}</p><h4 className="mt-1 font-bold">{new Date(item.finalizada_at || item.iniciada_at).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</h4></div>{item.rpe_sesion !== null ? <span className="rounded-full bg-[#f0ede7] px-3 py-1 text-xs font-semibold">RPE {item.rpe_sesion}</span> : null}</div><div className="mt-4 grid grid-cols-3 gap-2 text-center"><HistoryMetric label="Duración" value={formatDuration(item.duracion_segundos)} /><HistoryMetric label="Series" value={String(item.series_completadas || 0)} /><HistoryMetric label="Volumen" value={`${Number(item.volumen_total || 0).toLocaleString("es-ES")} kg`} /></div>{item.comentario_cliente ? <p className="mt-4 rounded-2xl bg-[#f7f4ee] p-3 text-sm text-[#56605a]">{item.comentario_cliente}</p> : null}</article>)}</div></section> : null}
          </>
        )}
      </div>

      <Dialog open={Boolean(selectedExercise)} onOpenChange={(open) => !open && setSelectedExercise(null)}>
        <DialogContent className="max-h-[94vh] max-w-2xl overflow-y-auto p-0">
          {selectedExercise ? <ClientExerciseDetail exercise={selectedExercise} /> : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function ClientExerciseDetail({ exercise }: { exercise: NonNullable<Exercise["ejercicios"]> }) {
  const technique = listFromText(exercise.tecnica);
  const errors = listFromText(exercise.errores_frecuentes);
  const tips = listFromText(exercise.consejos);

  return (
    <div className="bg-[#fffdf9] text-[#29312e]">
      <div className="border-b border-[#e7dfd3] p-5 pr-12">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#c9653b]">{exercise.codigo_interno || "GUÍA CHETESAÍ"}</p>
        <h2 className="mt-1 text-2xl font-black">{exercise.nombre}</h2>
        <p className="mt-1 text-xs font-bold uppercase text-[#62a900]">{labels[exercise.dificultad] || exercise.dificultad || "Nivel adaptado"}</p>
      </div>

      <div className="h-72 overflow-hidden border-b border-[#e7dfd3] bg-white p-3 sm:h-80">
        <ExerciseMediaVisual item={exercise} />
      </div>

      <div className="grid grid-cols-3 border-b border-[#e7dfd3] bg-white py-4">
        <ClientMeta icon={<Activity className="h-4 w-4" />} label="Grupo muscular" value={labels[exercise.grupo_muscular] || exercise.grupo_muscular} />
        <ClientMeta icon={<Dumbbell className="h-4 w-4" />} label="Material" value={exercise.material || "Sin material"} />
        <ClientMeta icon={<TrendingUp className="h-4 w-4" />} label="Nivel" value={labels[exercise.dificultad] || exercise.dificultad || "Adaptado"} />
      </div>

      <div className="px-5">
        <ClientGuideSection icon={<Target className="h-4 w-4 text-[#62a900]" />} title="Claves técnicas">
          <ClientBulletList items={technique.length ? technique : [exercise.descripcion || "Sigue las indicaciones de tu entrenador."]} positive />
        </ClientGuideSection>
        <ClientGuideSection icon={<TriangleAlert className="h-4 w-4 text-red-500" />} title="Errores frecuentes">
          <ClientBulletList items={errors.length ? errors : ["No hay errores frecuentes registrados."]} />
        </ClientGuideSection>
        <ClientGuideSection icon={<Lightbulb className="h-4 w-4 text-[#62a900]" />} title="Consejos del entrenador">
          <ClientBulletList items={tips.length ? tips : ["Prioriza la calidad de ejecución antes que la intensidad."]} dot />
        </ClientGuideSection>
        <ClientGuideSection icon={<TrendingUp className="h-4 w-4 text-[#62a900]" />} title="Progresión">
          <p className="text-sm leading-6 text-[#65706a]">{exercise.progresion || exercise.variante_avanzada || "Aumentar gradualmente carga, rango, repeticiones o control."}</p>
        </ClientGuideSection>
        <ClientGuideSection icon={<RotateCcw className="h-4 w-4 text-red-500" />} title="Regresión">
          <p className="text-sm leading-6 text-[#65706a]">{exercise.regresion || exercise.variante_facil || "Reducir carga, rango o complejidad."}</p>
        </ClientGuideSection>
      </div>

      {exercise.video_url ? (
        <div className="border-t border-[#e7dfd3] p-5">
          <a href={exercise.video_url} target="_blank" rel="noreferrer" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#46624f] px-5 py-3 text-sm font-black text-white">
            <PlayCircle className="h-4 w-4" /> Ver vídeo de ejecución
          </a>
        </div>
      ) : null}
    </div>
  );
}

function listFromText(value?: string | null) {
  return String(value || "").split(/;|\\n/).map((item) => item.trim()).filter(Boolean);
}

function ClientMeta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex min-w-0 flex-col items-center gap-1 border-r border-[#e7dfd3] px-2 text-center last:border-r-0"><span className="text-[#62a900]">{icon}</span><span className="text-[9px] text-[#8b938e]">{label}</span><strong className="max-w-full truncate text-xs">{value}</strong></div>;
}

function ClientGuideSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <section className="border-b border-[#e7dfd3] py-5 last:border-b-0"><div className="mb-3 flex items-center gap-2 text-sm font-black uppercase">{icon}<h3>{title}</h3></div>{children}</section>;
}

function ClientBulletList({ items, positive = false, dot = false }: { items: string[]; positive?: boolean; dot?: boolean }) {
  return <ul className="space-y-2">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-6 text-[#65706a]">{dot ? <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[#70b700]" /> : positive ? <CircleCheck className="mt-1 h-3.5 w-3.5 shrink-0 text-[#70b700]" /> : <CircleX className="mt-1 h-3.5 w-3.5 shrink-0 text-red-400" />}<span>{item}</span></li>)}</ul>;
}

function formatDuration(seconds: number | null) {
  if (!seconds) return "0 min";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return remaining ? `${minutes}m ${remaining}s` : `${minutes} min`;
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#f7f4ee] px-4 py-3"><p className="text-[10px] uppercase tracking-wide text-[#707872]">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}

function HistoryMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#f7f4ee] px-2 py-3"><p className="text-[10px] uppercase tracking-wide text-[#707872]">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}
