import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../lib/supabase-rest";

function normalize(body: Record<string, unknown>) {
  return {
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      `rutina_ejercicios?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(normalize(body)),
      }
    );
    return NextResponse.json({ ok: true, data: rows[0] ?? null });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al actualizar ejercicio" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await supabaseRest(`rutina_ejercicios?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al eliminar ejercicio" },
      { status: 500 }
    );
  }
}
