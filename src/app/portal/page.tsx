"use client";

import { useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, PlayCircle } from "lucide-react";

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
  rir: number | null;
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
    descripcion: string | null;
    tecnica: string | null;
    consejos: string | null;
  };
};

type PortalData = {
  cliente: { id: string; nombre: string; email: string | null };
  asignacion: Record<string, unknown> | null;
  rutina?: { id: string; nombre: string; descripcion: string | null; objetivo: string; nivel: string; dias_semana: number; duracion_semanas: number | null; duracion_sesion_minutos: number | null };
  ejercicios: Exercise[];
};

const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export default function PortalPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);

  useEffect(() => {
    fetch("/api/portal/rutina")
      .then(async (response) => {
        const result = (await response.json()) as { ok: boolean; data?: PortalData | null; error?: string };
        if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo cargar tu entrenamiento");
        setData(result.data || null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, []);

  const dayExercises = useMemo(() => (data?.ejercicios || []).filter((item) => item.dia === selectedDay).sort((a, b) => a.orden - b.orden), [data, selectedDay]);
  const routineDays = data?.rutina?.dias_semana || 1;

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#29312e]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#c9653b]">CHETESAÍ FITNESS+</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Mi entrenamiento</h1>
            <p className="mt-2 text-sm text-[#707872]">{data?.cliente?.nombre ? `Hola, ${data.cliente.nombre}. Aquí tienes tu planificación activa.` : "Tu espacio privado de entrenamiento."}</p>
          </div>
          <div className="w-full max-w-52 rounded-xl border border-[#e7dfd3] bg-white p-1 text-[#46624f] sm:w-52"><LogoutButton /></div>
        </header>

        {loading ? <p className="py-16 text-center text-[#707872]">Cargando tu entrenamiento...</p> : error ? <Card><CardContent className="py-12 text-center text-red-600">{error}</CardContent></Card> : !data?.asignacion || !data.rutina ? (
          <Card><CardContent className="py-16 text-center"><Dumbbell className="mx-auto mb-4 h-10 w-10 text-[#707872]" /><h2 className="text-xl font-bold">Todavía no tienes una rutina asignada</h2><p className="mt-2 text-sm text-[#707872]">Tu entrenador la publicará aquí cuando esté preparada.</p></CardContent></Card>
        ) : (
          <>
            <section className="mb-6 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#46624f]">Plan activo</p><h2 className="mt-2 text-2xl font-bold">{data.rutina.nombre}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-[#707872]">{data.rutina.descripcion || "Plan personalizado por tu entrenador."}</p></div><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-[#e9f2ea] px-3 py-1 text-[#46624f]">{data.rutina.dias_semana} días/semana</span><span className="rounded-full bg-[#f0ede7] px-3 py-1">{data.rutina.nivel}</span>{data.rutina.duracion_sesion_minutos ? <span className="rounded-full bg-[#f0ede7] px-3 py-1">{data.rutina.duracion_sesion_minutos} min</span> : null}</div></div>
            </section>

            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{Array.from({ length: routineDays }, (_, index) => index + 1).map((day) => <Button key={day} onClick={() => setSelectedDay(day)} className={selectedDay === day ? "bg-[#46624f] text-white hover:bg-[#3c5544]" : "border border-[#e7dfd3] bg-[#fffdf9] text-[#29312e] hover:bg-[#f0ede7]"}>Día {day} · {days[day - 1]}</Button>)}</div>

            {dayExercises.length === 0 ? <Card><CardContent className="py-14 text-center text-[#707872]">No hay ejercicios visibles para este día.</CardContent></Card> : <div className="space-y-4">{dayExercises.map((item, index) => {
              const exercise = item.ejercicios;
              const media = exercise?.miniatura_url || exercise?.imagen_url || exercise?.gif_url;
              return <article key={item.id} className="rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-5 shadow-sm"><div className="flex flex-col gap-5 md:flex-row md:items-center"><div className="h-28 w-full overflow-hidden rounded-2xl bg-[#f0ede7] md:w-36">{media ? <img src={media} alt={exercise?.nombre || "Ejercicio"} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center"><Dumbbell className="h-8 w-8 text-[#707872]" /></div>}</div><div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase tracking-[0.15em] text-[#c9653b]">Ejercicio {index + 1} · {item.tipo_serie.replace("_", " ")}</p><h3 className="mt-1 text-xl font-bold">{exercise?.nombre || "Ejercicio"}</h3><p className="mt-1 text-sm text-[#707872]">{exercise?.grupo_muscular}{exercise?.material ? ` · ${exercise.material}` : ""}</p><div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5"><Metric label="Series" value={String(item.series)} /><Metric label="Reps" value={item.repeticiones} /><Metric label="Descanso" value={`${item.descanso_segundos}s`} /><Metric label="Tempo" value={item.tempo || "—"} /><Metric label="RPE" value={item.rpe?.toString() || "—"} /></div>{item.instrucciones_cliente ? <p className="mt-4 rounded-2xl bg-[#f7f4ee] p-4 text-sm leading-6 text-[#56605a]">{item.instrucciones_cliente}</p> : null}{exercise?.video_url ? <a href={exercise.video_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#46624f]"><PlayCircle className="h-4 w-4" />Ver vídeo</a> : null}</div></div></article>;
            })}</div>}
          </>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-[#f7f4ee] px-3 py-2 text-center"><p className="text-[10px] uppercase tracking-wide text-[#707872]">{label}</p><p className="font-bold">{value}</p></div>;
}
