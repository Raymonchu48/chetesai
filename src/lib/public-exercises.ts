import { supabaseRest } from "../../lib/supabase-rest";

export type PublicExercise = {
  id: string;
  codigo_interno: string;
  nombre: string;
  nombre_alternativo: string | null;
  grupo_muscular: string;
  grupo_secundario: string | null;
  categoria: string;
  subcategoria: string | null;
  dificultad: string;
  material: string | null;
  descripcion: string | null;
  tecnica: string | null;
  posicion_inicial: string | null;
  pasos_ejecucion: string | null;
  respiracion: string | null;
  errores_frecuentes: string | null;
  consejos: string | null;
  contraindicaciones: string | null;
  variante_facil: string | null;
  variante_avanzada: string | null;
  regresion: string | null;
  progresion: string | null;
  tipo_movimiento: string | null;
  lateralidad: string | null;
  plano_movimiento: string | null;
  articulacion_principal: string | null;
  objetivos: string[];
  etiquetas: string[];
};

const PUBLIC_FIELDS = [
  "id",
  "codigo_interno",
  "nombre",
  "nombre_alternativo",
  "grupo_muscular",
  "grupo_secundario",
  "categoria",
  "subcategoria",
  "dificultad",
  "material",
  "descripcion",
  "tecnica",
  "posicion_inicial",
  "pasos_ejecucion",
  "respiracion",
  "errores_frecuentes",
  "consejos",
  "contraindicaciones",
  "variante_facil",
  "variante_avanzada",
  "regresion",
  "progresion",
  "tipo_movimiento",
  "lateralidad",
  "plano_movimiento",
  "articulacion_principal",
  "objetivos",
  "etiquetas",
].join(",");

export const PUBLIC_SITE_URL = "https://www.chetesaifitness.com";

function normalizeCode(code: string) {
  return decodeURIComponent(code).trim().toUpperCase();
}

export function exercisePath(code: string) {
  return `/guia-ejercicios/${normalizeCode(code).toLowerCase()}`;
}

export async function getPublicExercise(code: string) {
  const normalized = normalizeCode(code);
  if (!/^CHE-[A-Z]{3}-\d{3}$/.test(normalized)) return null;

  const rows = await supabaseRest<PublicExercise[]>(
    `ejercicios?select=${PUBLIC_FIELDS}&codigo_interno=eq.${encodeURIComponent(normalized)}&activo=eq.true&limit=1`
  );

  return rows[0] ?? null;
}

export async function getPublicExercises() {
  return supabaseRest<PublicExercise[]>(
    `ejercicios?select=${PUBLIC_FIELDS}&codigo_interno=not.is.null&activo=eq.true&order=codigo_interno.asc`
  );
}

export function labelFor(value?: string | null) {
  if (!value) return "—";
  const labels: Record<string, string> = {
    biceps: "Bíceps",
    cardio: "Cardio",
    core: "Core",
    cuerpo_completo: "Cuerpo completo",
    espalda: "Espalda",
    gluteos: "Glúteos",
    hombros: "Hombros",
    pecho: "Pecho",
    piernas: "Piernas",
    triceps: "Tríceps",
    fuerza: "Fuerza",
    movilidad: "Movilidad",
    estiramiento: "Estiramiento",
    rehabilitacion: "Rehabilitación",
    tecnica: "Técnica",
    principiante: "Principiante",
    intermedio: "Intermedio",
    avanzado: "Avanzado",
  };
  return labels[value.toLowerCase()] ?? value.replaceAll("_", " ");
}
