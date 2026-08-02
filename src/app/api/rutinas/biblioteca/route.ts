import { NextResponse } from "next/server";
import { supabaseRest } from "../../../../../lib/supabase-rest";

type ExerciseRow = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  material: string | null;
  imagen_url: string | null;
  activo?: boolean;
};

export async function GET() {
  try {
    const rows = await supabaseRest<ExerciseRow[]>(
      "ejercicios?select=id,nombre,grupo_muscular,material,imagen_url,activo&order=nombre.asc"
    );

    return NextResponse.json({
      ok: true,
      data: rows.map((row) => ({ ...row, _id: row.id })),
      total: rows.length,
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
