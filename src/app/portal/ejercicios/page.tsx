"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BookOpen, Dumbbell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
};

type AssignedExercise = {
  id: string;
  dia: number;
  orden: number;
  series: number;
  repeticiones: string;
  ejercicios?: ExerciseInfo;
};

type PortalData = {
  cliente: { id: string; nombre: string; email: string | null };
  rutina?: { id: string; nombre: string; dias_semana: number };
  ejercicios: AssignedExercise[];
};

type GalleryItem = {
  exercise: ExerciseInfo;
  assignments: AssignedExercise[];
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
};

export default function ClientExerciseGuidesPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("todos");

  useEffect(() => {
    fetch("/api/portal/rutina")
      .then(async (response) => {
        const result = (await response.json()) as { ok: boolean; data?: PortalData | null; error?: string };
        if (!response.ok || !result.ok) throw new Error(result.error || "No se pudieron cargar las guías");
        setData(result.data || null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Error al cargar las guías"))
      .finally(() => setLoading(false));
  }, []);

  const gallery = useMemo<GalleryItem[]>(() => {
    const map = new Map<string, GalleryItem>();
    for (const assignment of data?.ejercicios || []) {
      const exercise = assignment.ejercicios;
      if (!exercise?.id) continue;
      const current = map.get(exercise.id);
      if (current) current.assignments.push(assignment);
      else map.set(exercise.id, { exercise, assignments: [assignment] });
    }
    return Array.from(map.values()).sort((a, b) => a.exercise.nombre.localeCompare(b.exercise.nombre, "es"));
  }, [data]);

  const groups = useMemo(() => {
    return Array.from(new Set(gallery.map((item) => item.exercise.grupo_muscular).filter(Boolean))).sort();
  }, [gallery]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return gallery.filter(({ exercise }) => {
      const matchGroup = group === "todos" || exercise.grupo_muscular === group;
      const searchable = [exercise.nombre, exercise.grupo_muscular, exercise.grupo_secundario, exercise.material, exercise.categoria]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchGroup && (!term || searchable.includes(term));
    });
  }, [gallery, group, search]);

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#29312e]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#c9653b]">CHETESAÍ FITNESS+ · TÉCNICA</p>
              <h1 className="mt-2 flex items-center gap-3 text-3xl font-black tracking-tight md:text-4xl">
                <BookOpen className="h-8 w-8 text-[#46624f]" /> Guía de ejercicios
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#707872]">
                Consulta la ejecución de los ejercicios de tu planificación activa antes o durante el entrenamiento.
              </p>
            </div>
            <div className="rounded-2xl bg-[#eef5ef] px-4 py-3 text-sm text-[#46624f]">
              <p className="text-xs font-bold uppercase tracking-wide">Tu biblioteca</p>
              <p className="mt-1 text-lg font-black">{gallery.length} ejercicios asignados</p>
            </div>
          </div>
        </header>

        <section className="mb-7 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-5 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-[#8b938e]" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar ejercicio, grupo muscular o material"
              className="h-12 rounded-2xl border-[#e7dfd3] bg-white pl-12"
            />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setGroup("todos")}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${group === "todos" ? "bg-[#46624f] text-white" : "bg-[#f0ede7] text-[#56605a]"}`}
            >
              Todos
            </button>
            {groups.map((item) => (
              <button
                type="button"
                key={item}
                onClick={() => setGroup(item)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${group === item ? "bg-[#46624f] text-white" : "bg-[#f0ede7] text-[#56605a]"}`}
              >
                {labels[item] || item}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <p className="py-16 text-center text-[#707872]">Cargando tus guías...</p>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-red-700">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-12 text-center shadow-sm">
            <Dumbbell className="mx-auto h-10 w-10 text-[#8b938e]" />
            <h2 className="mt-4 text-xl font-bold">No hay ejercicios con ese filtro</h2>
            <p className="mt-2 text-sm text-[#707872]">Prueba con otro grupo muscular o término de búsqueda.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(({ exercise, assignments }) => {
              const media = exercise.miniatura_url || exercise.imagen_url || exercise.gif_url;
              const days = Array.from(new Set(assignments.map((item) => item.dia))).sort((a, b) => a - b);
              const totalSets = assignments.reduce((sum, item) => sum + Number(item.series || 0), 0);
              return (
                <Link
                  key={exercise.id}
                  href={`/portal/ejercicios/${exercise.id}`}
                  className="group overflow-hidden rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="relative h-52 overflow-hidden bg-[#ece9e2]">
                    {media ? (
                      <img src={media} alt={exercise.nombre} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="grid h-full place-items-center"><Dumbbell className="h-12 w-12 text-[#8b938e]" /></div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full bg-[#18211d]/90 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                      {labels[exercise.grupo_muscular] || exercise.grupo_muscular}
                    </span>
                  </div>
                  <div className="p-5">
                    <h2 className="text-xl font-black leading-tight">{exercise.nombre}</h2>
                    <p className="mt-2 text-sm text-[#707872]">{exercise.material || "Sin material"} · {exercise.dificultad || "Nivel adaptado"}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-[#eef5ef] px-3 py-1 font-semibold text-[#46624f]">Día {days.join(", ")}</span>
                      <span className="rounded-full bg-[#f0ede7] px-3 py-1 font-semibold">{totalSets} series planificadas</span>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-[#ece6dc] pt-4 text-sm font-black text-[#46624f]">
                      Ver guía de ejecución <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
