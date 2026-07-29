import { NextResponse } from "next/server";
import { supabaseRest } from "../../../../../lib/supabase-rest";

type ExerciseRow = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  material: string | null;
  imagen_url: string | null;
};

export async function GET() {
  try {
    const rows = await supabaseRest<ExerciseRow[]>(
      "ejercicios?activo=eq.true&select=id,nombre,grupo_muscular,material,imagen_url&order=nombre.asc"
    );

    return NextResponse.json({
      ok: true,
      data: rows.map((row) => ({ ...row, _id: row.id })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error al cargar la biblioteca de ejercicios",
      },
      { status: 500 }
    );
  }
}
