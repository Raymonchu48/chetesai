import LegCardSpriteVisual from "@/components/exercises/LegCardSpriteVisual";
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
  // Piernas usa siempre el banco visual aprobado de Chetesaí para que
  // la biblioteca general y la vista específica muestren el mismo recurso.
  if (item.grupo_muscular === "piernas") {
    return <LegCardSpriteVisual code={item.codigo_interno} name={item.nombre} />;
  }

  const uploaded = item.gif_url || item.imagen_url || item.miniatura_url;

  // En el resto del catálogo, el contenido multimedia propio sigue teniendo prioridad.
  if (uploaded) {
    return <img src={uploaded} alt={item.nombre} className="h-full w-full object-contain bg-white" />;
  }

  // Cobertura visual automática para el resto del catálogo maestro.
  return (
    <ProfessionalExerciseVisual
      code={item.codigo_interno}
      name={item.nombre}
      group={item.grupo_muscular}
      material={item.material}
    />
  );
}
