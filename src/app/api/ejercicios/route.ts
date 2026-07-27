import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../lib/supabase-rest";

type EjercicioRow = {
  id: string;
  nombre: string;
  grupo_muscular: string;
  grupo_secundario: string | null;
  categoria: string;
  dificultad: string;
  material: string | null;
  descripcion: string | null;
  tecnica: string | null;
  errores_frecuentes: string | null;
  consejos: string | null;
  imagen_url: string | null;
  video_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

function toEjercicio(row: EjercicioRow) {
  return { ...row, _id: row.id };
}

function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalizePayload(body: Record<string, unknown>) {
  return {
    nombre: String(body.nombre ?? "").trim(),
    grupo_muscular: String(body.grupo_muscular ?? "").trim(),
    grupo_secundario: optionalText(body.grupo_secundario),
    categoria: String(body.categoria ?? "fuerza").trim(),
    dificultad: String(body.dificultad ?? "principiante").trim(),
    material: optionalText(body.material),
    descripcion: optionalText(body.descripcion),
    tecnica: optionalText(body.tecnica),
    errores_frecuentes: optionalText(body.errores_frecuentes),
    consejos: optionalText(body.consejos),
    imagen_url: optionalText(body.imagen_url),
    video_url: optionalText(body.video_url),
    activo: body.activo !== false,
  };
}

export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const filters = ["select=*", "order=nombre.asc"];

    const grupo = params.get("grupo");
    const categoria = params.get("categoria");
    const dificultad = params.get("dificultad");
    const material = params.get("material");
    const activo = params.get("activo");

    if (grupo) filters.push(`grupo_muscular=eq.${encodeURIComponent(grupo)}`);
    if (categoria) filters.push(`categoria=eq.${encodeURIComponent(categoria)}`);
    if (dificultad) filters.push(`dificultad=eq.${encodeURIComponent(dificultad)}`);
    if (material) filters.push(`material=eq.${encodeURIComponent(material)}`);
    if (activo === "true" || activo === "false") filters.push(`activo=eq.${activo}`);

    const rows = await supabaseRest<EjercicioRow[]>(`ejercicios?${filters.join("&")}`);
    return NextResponse.json({ ok: true, data: rows.map(toEjercicio) });
  } catch (error) {
    console.error("[API] GET /api/ejercicios error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al obtener ejercicios" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizePayload(body);

    if (!payload.nombre || !payload.grupo_muscular) {
      return NextResponse.json(
        { ok: false, error: "El nombre y el grupo muscular son obligatorios" },
        { status: 400 }
      );
    }

    const rows = await supabaseRest<EjercicioRow[]>("ejercicios", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ ok: true, data: rows[0] ? toEjercicio(rows[0]) : null });
  } catch (error) {
    console.error("[API] POST /api/ejercicios error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al crear ejercicio" },
      { status: 500 }
    );
  }
}
