import LegCardSpriteVisual, { getFinalLegTile } from "@/components/exercises/LegCardSpriteVisual";
import ProfessionalExerciseVisual, { type ExerciseVisualModel } from "@/components/exercises/ProfessionalExerciseVisual";

type ExerciseMediaItem = {
  codigo_interno?: string | null;
  nombre: string;
  grupo_muscular: string;
  material?: string | null;
  imagen_url?: string | null;
  imagen_mujer_url?: string | null;
  gif_url?: string | null;
  miniatura_url?: string | null;
};

type Props = {
  item: ExerciseMediaItem;
  visualModel?: ExerciseVisualModel;
};

export default function ExerciseMediaVisual({ item, visualModel = "hombre" }: Props) {
  const uploaded = visualModel === "mujer"
    ? item.imagen_mujer_url
    : item.imagen_url || item.gif_url || item.miniatura_url;
  const finalLegTile = item.grupo_muscular === "piernas"
    ? getFinalLegTile(item.nombre, item.codigo_interno)
    : -1;

  // Each model uses its own uploaded image; existing male media stays intact.
  if (uploaded) {
    return <img src={uploaded} alt={item.nombre} className="h-full w-full object-contain bg-white" />;
  }

  // Los ejercicios de Piernas conservan el banco visual final como alternativa.
  if (finalLegTile >= 0 && visualModel === "hombre") {
    return <LegCardSpriteVisual code={item.codigo_interno} name={item.nombre} />;
  }

  return (
    <ProfessionalExerciseVisual
      code={item.codigo_interno}
      name={item.nombre}
      group={item.grupo_muscular}
      material={item.material}
      visualModel={visualModel}
    />
  );
}
