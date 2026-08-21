"use client";

import { useMemo, useState } from "react";
import { Activity, ExternalLink, PlayCircle, Target } from "lucide-react";
import ExerciseMediaVisual from "@/components/exercises/ExerciseMediaVisual";
import type { ExerciseVisualModel } from "@/components/exercises/ProfessionalExerciseVisual";
import {
  getExerciseVisualVariants,
  isDirectVideoUrl,
  type ExerciseVisualVariantSource,
} from "@/lib/exercise-visual-variants";

type Props = {
  item: ExerciseVisualVariantSource;
  visualModel?: ExerciseVisualModel;
  compact?: boolean;
  className?: string;
};

const levelLabels: Record<string, string> = {
  principiante: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

function label(value: string) {
  const labels: Record<string, string> = {
    biceps: "Bíceps",
    triceps: "Tríceps",
    gluteos: "Glúteos",
    cuerpo_completo: "Cuerpo completo",
  };
  return labels[value.toLowerCase()] || value.replaceAll("_", " ");
}

export default function InteractiveExerciseViewer({ item, visualModel = "hombre", compact = false, className = "" }: Props) {
  const variants = useMemo(() => getExerciseVisualVariants(item), [item]);
  const [activeId, setActiveId] = useState(variants[0]?.id || "");

  const active = variants.find((variant) => variant.id === activeId) || variants[0];
  if (!active) return <ExerciseMediaVisual item={item} visualModel={visualModel} />;

  const directVideo = isDirectVideoUrl(active.video_url);
  const fallbackItem = active.imagen_url
    ? { ...item, imagen_url: active.imagen_url, gif_url: null, miniatura_url: null }
    : item;

  return (
    <section className={`overflow-hidden rounded-[24px] border border-[#dfe8dc] bg-[#f7f9f4] ${className}`}>
      <div className={`relative overflow-hidden bg-[#152019] ${compact ? "h-64" : "min-h-[340px] sm:min-h-[420px]"}`}>
        {directVideo ? (
          <video
            key={active.video_url || active.id}
            src={active.video_url || undefined}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            className="absolute inset-0 h-full w-full object-contain bg-black"
          />
        ) : (
          <div className="absolute inset-0 bg-white p-2 sm:p-4">
            <ExerciseMediaVisual item={fallbackItem} visualModel={visualModel} />
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4 text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.15em] backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#8cdb78]" /> Guía interactiva
          </span>
          <span className="rounded-full bg-[#c9653b] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide">
            {levelLabels[active.nivel] || active.nivel}
          </span>
        </div>

        {!directVideo && active.video_url ? (
          <a
            href={active.video_url}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-[#18211d] px-4 py-2 text-xs font-black text-white shadow-xl"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Abrir vídeo
          </a>
        ) : null}
      </div>

      <div className="border-t border-[#dfe8dc] bg-[#fffdf9] p-4 sm:p-5">
        {variants.length > 1 ? (
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Variantes del ejercicio">
            {variants.map((variant) => (
              <button
                key={variant.id}
                type="button"
                role="tab"
                aria-selected={variant.id === active.id}
                onClick={() => setActiveId(variant.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${variant.id === active.id ? "border-[#46624f] bg-[#46624f] text-white shadow-sm" : "border-[#dfe8dc] bg-white text-[#56605a] hover:border-[#8cdb78]"}`}
              >
                {variant.nombre}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#c9653b]">
              <Activity className="h-3.5 w-3.5" /> {active.nombre}
            </p>
            <h3 className="mt-1 text-lg font-black text-[#29312e]">{active.enfoque || "Ejecución controlada"}</h3>
            <p className="mt-2 text-sm leading-6 text-[#65706a]">{active.indicacion}</p>
          </div>
          <div className="sm:max-w-52">
            <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wide text-[#46624f]"><Target className="h-3.5 w-3.5" /> Énfasis muscular</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(active.musculos.length ? active.musculos : [item.grupo_muscular]).map((muscle) => (
                <span key={muscle} className="rounded-full bg-[#eaf5e8] px-2.5 py-1 text-[11px] font-bold text-[#397230]">{label(muscle)}</span>
              ))}
            </div>
          </div>
        </div>

        {directVideo ? (
          <p className="mt-4 flex items-center gap-2 border-t border-[#ece6dc] pt-3 text-[11px] font-semibold text-[#707872]">
            <PlayCircle className="h-4 w-4 text-[#46624f]" /> El vídeo se reproduce automáticamente, sin sonido y en bucle.
          </p>
        ) : null}
      </div>
    </section>
  );
}
