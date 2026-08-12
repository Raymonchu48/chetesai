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
  const uploaded = item.gif_url || item.imagen_url || item.miniatura_url;

  // Si el entrenador ha incorporado contenido multimedia propio, siempre tiene prioridad.
  if (uploaded) {
    return <img src={uploaded} alt={item.nombre} className="h-full w-full object-contain bg-white" />;
  }

  // Cobertura visual automática para todo el catálogo maestro, incluidos
  // fuerza, core, cardio, movilidad, calentamiento y estiramientos.
  return (
    <ProfessionalExerciseVisual
      code={item.codigo_interno}
      name={item.nombre}
      group={item.grupo_muscular}
      material={item.material}
    />
  );
}
