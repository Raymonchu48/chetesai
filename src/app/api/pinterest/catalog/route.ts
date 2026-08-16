import { NextResponse } from "next/server";
import { exercisePath, getPublicExercises, PUBLIC_SITE_URL } from "@/lib/public-exercises";

export const dynamic = "force-dynamic";

export async function GET() {
  const exercises = await getPublicExercises();
  const pins = exercises.map((exercise) => ({
    code: exercise.codigo_interno,
    title: `${exercise.nombre} | Guía de técnica Chetesaí`,
    description: exercise.descripcion || `Aprende la técnica de ${exercise.nombre}, sus errores frecuentes y consejos de ejecución.`,
    group: exercise.grupo_muscular,
    destinationUrl: `${PUBLIC_SITE_URL}${exercisePath(exercise.codigo_interno)}`,
    imageUrl: `${PUBLIC_SITE_URL}/api/pinterest/${exercise.codigo_interno.toLowerCase()}`,
  }));

  return NextResponse.json(
    { ok: true, count: pins.length, pins },
    { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } }
  );
}
