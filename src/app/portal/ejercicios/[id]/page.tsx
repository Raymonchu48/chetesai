"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  CircleAlert,
  Clock3,
  Dumbbell,
  Gauge,
  Layers3,
  Lightbulb,
  PlayCircle,
  Repeat2,
  Target,
} from "lucide-react";

type ExerciseInfo = {
  id: string;
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
  etiquetas: string[];
};

type AssignedExercise = {
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
  ejercicios?: ExerciseInfo;
};

type PortalData = {
  rutina?: { id: string; nombre: string; nivel: string };
  ejercicios: AssignedExercise[];
};

const labels: Record<string, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  piernas: "Piernas",
  gluteos: "Glúteos",
  core: "Core",
  cardio: "Cardio",
  cuerpo_completo: "Cuerpo completo",
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

export default function ExerciseGuideDetailPage() {
  const params = useParams<{ id: string }>();
  const exerciseId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/portal/rutina")
      .then(async (response) => {
        const result = (await response.json()) as { ok: boolean; data?: PortalData | null; error?: string };
        if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo cargar la guía");
        setData(result.data || null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar la guía"))
      .finally(() => setLoading(false));
  }, []);

  const assignments = useMemo(
    () => (data?.ejercicios || []).filter((item) => item.ejercicios?.id === exerciseId),
    [data, exerciseId]
  );
  const exercise = assignments[0]?.ejercicios;
  const primaryMedia = exercise?.gif_url || exercise?.imagen_url || exercise?.miniatura_url;

  if (loading) {
    return <main className="min-h-screen bg-[#f7f4ee] px-5 py-16 text-center text-[#707872]">Cargando guía...</main>;
  }

  if (error || !exercise) {
    return (
      <main className="min-h-screen bg-[#f7f4ee] px-5 py-12 text-[#29312e]">
        <div className="mx-auto max-w-3xl rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-10 text-center shadow-sm">
          <Dumbbell className="mx-auto h-10 w-10 text-[#8b938e]" />
          <h1 className="mt-4 text-2xl font-black">Guía no disponible</h1>
          <p className="mt-2 text-sm text-[#707872]">{error || "Este ejercicio no forma parte de tu planificación activa."}</p>
          <Link href="/portal/ejercicios" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#46624f] px-5 py-3 text-sm font-bold text-white">
            <ArrowLeft className="h-4 w-4" /> Volver a mis guías
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-8 text-[#29312e] md:py-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/portal/ejercicios" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#46624f] hover:underline">
          <ArrowLeft className="h-4 w-4" /> Volver a la guía de ejercicios
        </Link>

        <section className="overflow-hidden rounded-[32px] border border-[#e7dfd3] bg-[#fffdf9] shadow-sm">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-72 bg-[#18211d] lg:min-h-[520px]">
              {primaryMedia ? (
                <img src={primaryMedia} alt={`Ejecución de ${exercise.nombre}`} className="absolute inset-0 h-full w-full object-contain p-3 md:p-6" />
              ) : (
                <div className="absolute inset-0 grid place-items-center"><Dumbbell className="h-20 w-20 text-white/25" /></div>
              )}
              <div className="absolute left-5 top-5 rounded-full bg-black/60 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white backdrop-blur">
                {labels[exercise.grupo_muscular] || exercise.grupo_muscular}
              </div>
            </div>

            <div className="p-6 md:p-9">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#c9653b]">GUÍA CHETESAÍ</p>
              <h1 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{exercise.nombre}</h1>
              <p className="mt-4 leading-7 text-[#65706a]">
                {exercise.descripcion || "Consulta la técnica y los parámetros indicados por tu entrenador antes de comenzar."}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                <Info label="Músculo principal" value={labels[exercise.grupo_muscular] || exercise.grupo_muscular} icon={Target} />
                <Info label="Músculo secundario" value={exercise.grupo_secundario || "—"} icon={Layers3} />
                <Info label="Material" value={exercise.material || "Sin material"} icon={Dumbbell} />
                <Info label="Nivel" value={labels[exercise.dificultad] || exercise.dificultad || "Adaptado"} icon={Gauge} />
              </div>

              {exercise.video_url ? (
                <a href={exercise.video_url} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c9653b] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#b65a35]">
                  <PlayCircle className="h-5 w-5" /> Ver vídeo de ejecución
                </a>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-[#d8e4da] bg-[#eef5ef] p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-3">
            <BadgeCheck className="h-7 w-7 text-[#46624f]" />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#46624f]">Tu prescripción</p>
              <h2 className="text-2xl font-black">Así aparece en tu planificación</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assignments.map((item) => (
              <article key={item.id} className="rounded-3xl border border-white/80 bg-white/75 p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#c9653b]">Día {item.dia}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Metric icon={Repeat2} label="Series" value={String(item.series)} />
                  <Metric icon={Target} label="Repeticiones" value={item.repeticiones || "—"} />
                  <Metric icon={Dumbbell} label="Peso" value={item.peso_kg !== null ? `${item.peso_kg} kg` : "Según indicación"} />
                  <Metric icon={Clock3} label="Descanso" value={`${item.descanso_segundos || 0}s`} />
                </div>
                {item.tempo || item.rpe !== null ? (
                  <p className="mt-4 text-xs text-[#65706a]">{item.tempo ? `Tempo ${item.tempo}` : ""}{item.tempo && item.rpe !== null ? " · " : ""}{item.rpe !== null ? `RPE ${item.rpe}` : ""}</p>
                ) : null}
                {item.instrucciones_cliente ? (
                  <p className="mt-4 rounded-2xl bg-[#f7f4ee] p-4 text-sm font-medium leading-6 text-[#56605a]">{item.instrucciones_cliente}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <GuideSection
            icon={BookOpen}
            eyebrow="TÉCNICA"
            title="Cómo realizar el ejercicio"
            text={exercise.tecnica || "Tu entrenador completará aquí las indicaciones técnicas específicas de este ejercicio."}
          />
          <GuideSection
            icon={CircleAlert}
            eyebrow="A EVITAR"
            title="Errores frecuentes"
            text={exercise.errores_frecuentes || "No hay errores frecuentes registrados para este ejercicio."}
          />
          <GuideSection
            icon={Lightbulb}
            eyebrow="CONSEJO DEL ENTRENADOR"
            title="Claves para hacerlo mejor"
            text={exercise.consejos || "Sigue la carga, el ritmo y las indicaciones definidos en tu planificación."}
          />
          <section className="rounded-[30px] border border-[#e7dfd3] bg-[#18211d] p-7 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8cdb78]">MOVIMIENTO</p>
            <h2 className="mt-2 text-2xl font-black">Ficha técnica</h2>
            <div className="mt-5 space-y-3 text-sm text-white/70">
              <Row label="Categoría" value={exercise.categoria || "—"} />
              <Row label="Tipo de movimiento" value={exercise.tipo_movimiento || "—"} />
              <Row label="Lateralidad" value={exercise.lateralidad || "—"} />
              <Row label="Plano" value={exercise.plano_movimiento || "—"} />
              <Row label="Articulación principal" value={exercise.articulacion_principal || "—"} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Info({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Dumbbell }) {
  return (
    <div className="rounded-2xl bg-[#f7f4ee] p-4">
      <Icon className="h-5 w-5 text-[#46624f]" />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[#8b938e]">{label}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Dumbbell }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[#46624f]"><Icon className="h-4 w-4" /><span className="text-[10px] font-bold uppercase tracking-wide">{label}</span></div>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

function GuideSection({ icon: Icon, eyebrow, title, text }: { icon: typeof Dumbbell; eyebrow: string; title: string; text: string }) {
  return (
    <section className="rounded-[30px] border border-[#e7dfd3] bg-[#fffdf9] p-7 shadow-sm">
      <Icon className="h-7 w-7 text-[#c9653b]" />
      <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#c9653b]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black">{title}</h2>
      <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#65706a]">{text}</p>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3"><span>{label}</span><strong className="text-right text-white">{value}</strong></div>;
}
