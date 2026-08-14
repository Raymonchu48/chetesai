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

const LEG_CARD_PATTERNS = [
  "sentadilla",
  "squat",
  "zancada",
  "prensa",
  "peso muerto rumano",
  "extension de piernas",
  "extension de cuadriceps",
  "hip thrust",
  "curl femoral",
  "step up",
  "step-up",
  "elevacion de talones",
  "gemelos"
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function hasApprovedLegCard(name: string) {
  const n = normalize(name);
  return LEG_CARD_PATTERNS.some((pattern) => n.includes(pattern));
}

export default function ExerciseMediaVisual({ item }: { item: ExerciseMediaItem }) {
  const uploaded = item.gif_url || item.imagen_url || item.miniatura_url;

  // El contenido multimedia real incorporado por el entrenador siempre tiene
  // prioridad. De esta forma una tarjeta final subida nunca queda oculta por
  // un recurso automático o por un sprite histórico.
  if (uploaded) {
    return <img src={uploaded} alt={item.nombre} className="h-full w-full object-contain bg-white" />;
  }

  // El banco LEG se utiliza únicamente como fallback para ejercicios de Piernas
  // que tienen una correspondencia real con una tarjeta aprobada.
  if (item.grupo_muscular === "piernas" && hasApprovedLegCard(item.nombre)) {
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
