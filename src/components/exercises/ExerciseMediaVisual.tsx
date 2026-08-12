import ArmExerciseVisual from "@/components/exercises/ArmExerciseVisual";
import BackExerciseVisual from "@/components/exercises/BackExerciseVisual";
import ChestExerciseVisual from "@/components/exercises/ChestExerciseVisual";
import LegExerciseVisual from "@/components/exercises/LegExerciseVisual";
import ShoulderExerciseVisual from "@/components/exercises/ShoulderExerciseVisual";
import { Dumbbell } from "lucide-react";

type ExerciseMediaItem = {
  codigo_interno?: string | null;
  nombre: string;
  grupo_muscular: string;
  imagen_url?: string | null;
  gif_url?: string | null;
  miniatura_url?: string | null;
};

export default function ExerciseMediaVisual({ item }: { item: ExerciseMediaItem }) {
  const code = item.codigo_interno || "";

  if (code.startsWith("CHE-PEC-")) return <ChestExerciseVisual code={code} name={item.nombre} />;
  if (code.startsWith("CHE-ESP-")) return <BackExerciseVisual code={code} name={item.nombre} />;
  if (code.startsWith("CHE-HOM-")) return <ShoulderExerciseVisual code={code} name={item.nombre} />;
  if (code.startsWith("CHE-BRA-")) return <ArmExerciseVisual code={code} name={item.nombre} group={item.grupo_muscular} />;
  if (code.startsWith("CHE-PIE-")) return <LegExerciseVisual code={code} name={item.nombre} />;

  const uploaded = item.gif_url || item.imagen_url || item.miniatura_url;
  if (uploaded) {
    return <img src={uploaded} alt={item.nombre} className="h-full w-full object-cover" />;
  }

  return (
    <div className="flex h-full min-h-52 flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 px-6 text-center text-white">
      <Dumbbell className="mb-4 h-12 w-12" />
      <p className="text-xs font-semibold uppercase tracking-[.24em] text-emerald-200">Chetesaí Fitness+</p>
      <p className="mt-2 text-xl font-bold">{item.nombre}</p>
      <p className="mt-2 text-sm text-white/70">Visual específico en preparación</p>
    </div>
  );
}
