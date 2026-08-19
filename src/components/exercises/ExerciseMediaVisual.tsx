import LegCardSpriteVisual, { getFinalLegTile } from "@/components/exercises/LegCardSpriteVisual";
import ProfessionalExerciseVisual, { type ExerciseVisualModel } from "@/components/exercises/ProfessionalExerciseVisual";

type ExerciseMediaItem = {
  codigo_interno?: string | null;
  nombre: string;
  grupo_muscular: string;
  material?: string | null;
  imagen_url?: string | null;
  gif_url?: string | null;
  miniatura_url?: string | null;
};

type Props = {
  item: ExerciseMediaItem;
  visualModel?: ExerciseVisualModel;
};

export default function ExerciseMediaVisual({ item, visualModel = "hombre" }: Props) {
  const uploaded = item.imagen_url || item.gif_url || item.miniatura_url;
  const finalLegTile = item.grupo_muscular === "piernas"
    ? getFinalLegTile(item.nombre, item.codigo_interno)
    : -1;

  // En el modelo femenino usamos la ilustración generada para evitar mostrar
  // fotografías o bancos visuales masculinos que no tienen versión equivalente.
  if (uploaded && visualModel === "hombre") {
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
