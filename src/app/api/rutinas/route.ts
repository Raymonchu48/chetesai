import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../lib/supabase-rest";

type RutinaRow = {
  id: string;
  nombre: string;
  descripcion: string | null;
  objetivo: string;
  nivel: string;
  dias_semana: number;
  duracion_semanas: number | null;
  duracion_sesion_minutos: number | null;
  activa: boolean;
  es_plantilla: boolean;
  created_at: string;
  updated_at: string;
};

function normalize(body: Record<string, unknown>) {
  const text = (value: unknown) => {
    const result = String(value ?? "").trim();
    return result || null;
  };

  return {
    nombre: String(body.nombre ?? "").trim(),
    descripcion: text(body.descripcion),
    objetivo: String(body.objetivo ?? "bienestar_general").trim(),
    nivel: String(body.nivel ?? "principiante").trim(),
    dias_semana: Number(body.dias_semana ?? 3),
    duracion_semanas: body.duracion_semanas ? Number(body.duracion_semanas) : null,
    duracion_sesion_minutos: body.duracion_sesion_minutos ? Number(body.duracion_sesion_minutos) : null,
    activa: body.activa !== false,
    es_plantilla: body.es_plantilla !== false,
  };
}

function toRutina(row: RutinaRow) {
  return { ...row, _id: row.id };
}

export async function GET() {
  try {
    const rows = await supabaseRest<RutinaRow[]>(
      "rutinas?select=*&order=created_at.desc"
    );
    return NextResponse.json({ ok: true, data: rows.map(toRutina) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al obtener rutinas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalize(body);

    if (!payload.nombre) {
      return NextResponse.json({ ok: false, error: "El nombre es obligatorio" }, { status: 400 });
    }

    const rows = await supabaseRest<RutinaRow[]>("rutinas", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ ok: true, data: rows[0] ? toRutina(rows[0]) : null });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al crear rutina" },
      { status: 500 }
    );
  }
}
