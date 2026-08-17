import LegCardSpriteVisual, { getFinalLegTile } from "@/components/exercises/LegCardSpriteVisual";
import ProfessionalExerciseVisual from "@/components/exercises/ProfessionalExerciseVisual";

type ExerciseMediaItem = {
  codigo_interno?: string | null;
  nombre: string;
  grupo_muscular: string;
  material?: string | null;
  imagen_url?: string | null;
  gif_url?: string | null;
  miniatura_url?: string | null;
};

export default function ExerciseMediaVisual({ item }: { item: ExerciseMediaItem }) {
  const uploaded = item.imagen_url || item.gif_url || item.miniatura_url;
  const finalLegTile = item.grupo_muscular === "piernas"
    ? getFinalLegTile(item.nombre, item.codigo_interno)
    : -1;

  // Una imagen subida por el profesional siempre tiene prioridad en la galería.
  if (uploaded) {
    return <img src={uploaded} alt={item.nombre} className="h-full w-full object-contain bg-white" />;
  }

  // Los ejercicios de Piernas conservan el banco visual final como alternativa.
  if (finalLegTile >= 0) {
    return <LegCardSpriteVisual code={item.codigo_interno} name={item.nombre} />;
  }

  return (
    <ProfessionalExerciseVisual
      code={item.codigo_interno}
      name={item.nombre}
      group={item.grupo_muscular}
      material={item.material}
    />
  );
}
