export type ExerciseVariantLevel = "principiante" | "intermedio" | "avanzado";

export type ExerciseVisualVariant = {
  id: string;
  nombre: string;
  enfoque: string;
  musculos: string[];
  indicacion: string;
  nivel: ExerciseVariantLevel;
  video_url: string | null;
  imagen_url: string | null;
};

export type ExerciseVisualVariantSource = {
  codigo_interno?: string | null;
  nombre: string;
  grupo_muscular: string;
  grupo_secundario?: string | null;
  dificultad?: string | null;
  descripcion?: string | null;
  tecnica?: string | null;
  video_url?: string | null;
  imagen_url?: string | null;
  gif_url?: string | null;
  miniatura_url?: string | null;
  variante_facil?: string | null;
  variante_avanzada?: string | null;
  regresion?: string | null;
  progresion?: string | null;
  objetivos?: string[] | null;
  contexto_ia?: unknown;
};

const levelValues = new Set<ExerciseVariantLevel>(["principiante", "intermedio", "avanzado"]);

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function level(value: unknown, fallback: ExerciseVariantLevel = "principiante") {
  const normalized = text(value).toLowerCase() as ExerciseVariantLevel;
  return levelValues.has(normalized) ? normalized : fallback;
}

function stringList(value: unknown) {
  if (Array.isArray(value)) return value.map(text).filter(Boolean).slice(0, 8);
  return text(value).split(/,|;|\n/).map((item) => item.trim()).filter(Boolean).slice(0, 8);
}

function variantId(value: unknown, index: number) {
  const normalized = text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
  return normalized || `variante-${index + 1}`;
}

export function parseExerciseVisualVariants(context: unknown): ExerciseVisualVariant[] {
  if (!context || typeof context !== "object" || Array.isArray(context)) return [];
  const raw = (context as Record<string, unknown>).variantes_visuales;
  if (!Array.isArray(raw)) return [];

  return raw.slice(0, 8).flatMap((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const value = entry as Record<string, unknown>;
    const nombre = text(value.nombre);
    if (!nombre) return [];
    return [{
      id: variantId(value.id || nombre, index),
      nombre,
      enfoque: text(value.enfoque),
      musculos: stringList(value.musculos),
      indicacion: text(value.indicacion),
      nivel: level(value.nivel),
      video_url: text(value.video_url) || null,
      imagen_url: text(value.imagen_url) || null,
    }];
  });
}

export function withExerciseVisualVariants(context: unknown, variants: ExerciseVisualVariant[]) {
  const current = context && typeof context === "object" && !Array.isArray(context)
    ? { ...(context as Record<string, unknown>) }
    : {};

  return {
    ...current,
    variantes_visuales: variants.map((variant, index) => ({
      id: variantId(variant.id || variant.nombre, index),
      nombre: text(variant.nombre),
      enfoque: text(variant.enfoque),
      musculos: stringList(variant.musculos),
      indicacion: text(variant.indicacion),
      nivel: level(variant.nivel),
      video_url: text(variant.video_url) || null,
      imagen_url: text(variant.imagen_url) || null,
    })).filter((variant) => variant.nombre),
  };
}

const legPressVariants: ExerciseVisualVariant[] = [
  {
    id: "posicion-neutra",
    nombre: "Posición neutra",
    enfoque: "Trabajo equilibrado de la pierna",
    musculos: ["Cuádriceps", "Isquiotibiales"],
    indicacion: "Coloca los pies a la anchura de las caderas y mantén rodillas y puntas alineadas.",
    nivel: "principiante",
    video_url: null,
    imagen_url: null,
  },
  {
    id: "pies-altos",
    nombre: "Pies altos",
    enfoque: "Mayor énfasis en la cadena posterior",
    musculos: ["Glúteos", "Isquiotibiales"],
    indicacion: "Mantén toda la planta apoyada y evita que la zona lumbar se despegue del respaldo.",
    nivel: "intermedio",
    video_url: null,
    imagen_url: null,
  },
  {
    id: "pies-bajos",
    nombre: "Pies bajos",
    enfoque: "Mayor énfasis en cuádriceps",
    musculos: ["Cuádriceps"],
    indicacion: "Controla el recorrido y conserva los talones apoyados durante toda la repetición.",
    nivel: "intermedio",
    video_url: null,
    imagen_url: null,
  },
  {
    id: "pies-abiertos",
    nombre: "Pies abiertos",
    enfoque: "Mayor participación de la cara interna",
    musculos: ["Aductores", "Glúteos"],
    indicacion: "Abre ligeramente las puntas y acompaña esa dirección con las rodillas, sin colapsarlas hacia dentro.",
    nivel: "intermedio",
    video_url: null,
    imagen_url: null,
  },
];

export function defaultEditableExerciseVisualVariants(item: ExerciseVisualVariantSource) {
  const explicit = parseExerciseVisualVariants(item.contexto_ia);
  if (explicit.length) return explicit;
  const normalizedName = item.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (item.codigo_interno === "CHE-PIE-010" || normalizedName.includes("prensa de piernas")) {
    return legPressVariants.map((variant) => ({ ...variant, musculos: [...variant.musculos] }));
  }
  return [];
}

export function getExerciseVisualVariants(item: ExerciseVisualVariantSource) {
  const editable = defaultEditableExerciseVisualVariants(item);
  if (editable.length) return editable;

  const fallbackLevel = level(item.dificultad);
  const mainMuscles = [item.grupo_muscular, item.grupo_secundario, ...(item.objetivos || [])].map(text).filter(Boolean).slice(0, 5);
  const variants: ExerciseVisualVariant[] = [{
    id: "ejecucion-principal",
    nombre: "Ejecución principal",
    enfoque: "Técnica recomendada",
    musculos: mainMuscles,
    indicacion: text(item.tecnica) || text(item.descripcion) || "Sigue las indicaciones de tu entrenador.",
    nivel: fallbackLevel,
    video_url: text(item.video_url) || null,
    imagen_url: text(item.imagen_url) || text(item.gif_url) || text(item.miniatura_url) || null,
  }];

  const easier = text(item.regresion) || text(item.variante_facil);
  if (easier) variants.push({
    id: "regresion",
    nombre: "Versión adaptada",
    enfoque: "Menor complejidad",
    musculos: mainMuscles,
    indicacion: easier,
    nivel: "principiante",
    video_url: null,
    imagen_url: null,
  });

  const harder = text(item.progresion) || text(item.variante_avanzada);
  if (harder) variants.push({
    id: "progresion",
    nombre: "Progresión",
    enfoque: "Mayor estímulo o dificultad",
    musculos: mainMuscles,
    indicacion: harder,
    nivel: "avanzado",
    video_url: null,
    imagen_url: null,
  });

  return variants;
}

export function isDirectVideoUrl(value?: string | null) {
  if (!value) return false;
  try {
    const pathname = new URL(value, "https://chetesaifitness.com").pathname.toLowerCase();
    return [".mp4", ".webm", ".mov"].some((extension) => pathname.endsWith(extension));
  } catch {
    return false;
  }
}
