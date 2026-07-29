import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../../lib/supabase-rest";

function normalize(body: Record<string, unknown>) {
  return {
    ejercicio_id: String(body.ejercicio_id ?? ""),
    dia: Number(body.dia ?? 1),
    bloque: body.bloque ? String(body.bloque).trim() : null,
    orden: Number(body.orden ?? 1),
    series: Number(body.series ?? 3),
    repeticiones: String(body.repeticiones ?? "10").trim() || "10",
    peso_kg: body.peso_kg === null || body.peso_kg === "" || body.peso_kg === undefined ? null : Number(body.peso_kg),
    descanso_segundos: Number(body.descanso_segundos ?? 60),
    tempo: body.tempo ? String(body.tempo).trim() : null,
    rpe: body.rpe === null || body.rpe === "" || body.rpe === undefined ? null : Number(body.rpe),
    rir: body.rir === null || body.rir === "" || body.rir === undefined ? null : Number(body.rir),
    duracion_segundos: body.duracion_segundos === null || body.duracion_segundos === "" || body.duracion_segundos === undefined ? null : Number(body.duracion_segundos),
    distancia_metros: body.distancia_metros === null || body.distancia_metros === "" || body.distancia_metros === undefined ? null : Number(body.distancia_metros),
    observaciones: body.observaciones ? String(body.observaciones).trim() : null,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      `rutina_ejercicios?rutina_id=eq.${encodeURIComponent(id)}&select=*,ejercicios(id,nombre,grupo_muscular,material,imagen_url,miniatura_url,gif_url)&order=dia.asc,orden.asc`
    );
    return NextResponse.json({ ok: true, data: rows.map((row) => ({ ...row, _id: row.id })) });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al cargar ejercicios de la rutina" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalize(body);
    if (!payload.ejercicio_id) {
      return NextResponse.json({ ok: false, error: "Selecciona un ejercicio" }, { status: 400 });
    }

    const existing = await supabaseRest<Array<{ orden: number }>>(
      `rutina_ejercicios?rutina_id=eq.${encodeURIComponent(id)}&dia=eq.${payload.dia}&select=orden&order=orden.desc&limit=1`
    );
    const orden = existing[0]?.orden ? existing[0].orden + 1 : 1;

    const rows = await supabaseRest<Array<Record<string, unknown>>>("rutina_ejercicios", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...payload, rutina_id: id, orden }),
    });

    return NextResponse.json({ ok: true, data: rows[0] ?? null });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al añadir ejercicio" },
      { status: 500 }
    );
  }
}
