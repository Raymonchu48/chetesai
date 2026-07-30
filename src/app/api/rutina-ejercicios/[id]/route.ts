import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../lib/supabase-rest";

function optionalNumber(value: unknown) {
  return value === null || value === "" || value === undefined ? null : Number(value);
}

function normalize(body: Record<string, unknown>) {
  return {
    dia: Number(body.dia ?? 1),
    bloque: body.bloque ? String(body.bloque).trim() : null,
    orden: Number(body.orden ?? 1),
    series: Number(body.series ?? 3),
    repeticiones: String(body.repeticiones ?? "10").trim() || "10",
    peso_kg: optionalNumber(body.peso_kg),
    descanso_segundos: Number(body.descanso_segundos ?? 60),
    tempo: body.tempo ? String(body.tempo).trim() : null,
    rpe: optionalNumber(body.rpe),
    rir: optionalNumber(body.rir),
    duracion_segundos: optionalNumber(body.duracion_segundos),
    distancia_metros: optionalNumber(body.distancia_metros),
    observaciones: body.observaciones ? String(body.observaciones).trim() : null,
    notas_entrenador: body.notas_entrenador ? String(body.notas_entrenador).trim() : null,
    instrucciones_cliente: body.instrucciones_cliente ? String(body.instrucciones_cliente).trim() : null,
    tipo_serie: String(body.tipo_serie ?? "normal"),
    rol_ejercicio: String(body.rol_ejercicio ?? "principal"),
    vueltas: optionalNumber(body.vueltas),
    descanso_entre_vueltas: optionalNumber(body.descanso_entre_vueltas),
    series_calentamiento: Number(body.series_calentamiento ?? 0),
    porcentaje_descarga: optionalNumber(body.porcentaje_descarga),
    pausas_rest_pause: optionalNumber(body.pausas_rest_pause),
    visible_cliente: body.visible_cliente !== false,
  };
}

function validate(payload: ReturnType<typeof normalize>) {
  if (payload.dia < 1 || payload.dia > 7) return "El día debe estar entre 1 y 7";
  if (payload.series < 1 || payload.series > 30) return "Las series deben estar entre 1 y 30";
  if (payload.descanso_segundos < 0 || payload.descanso_segundos > 3600) return "El descanso debe estar entre 0 y 3600 segundos";
  if (payload.rpe !== null && (payload.rpe < 1 || payload.rpe > 10)) return "El RPE debe estar entre 1 y 10";
  if (payload.rir !== null && (payload.rir < 0 || payload.rir > 10)) return "El RIR debe estar entre 0 y 10";
  if (payload.series_calentamiento < 0 || payload.series_calentamiento > 10) return "Las series de calentamiento deben estar entre 0 y 10";
  if (payload.porcentaje_descarga !== null && (payload.porcentaje_descarga < 0 || payload.porcentaje_descarga > 100)) return "La descarga debe estar entre 0 y 100%";
  return null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalize(body);
    const validationError = validate(payload);
    if (validationError) return NextResponse.json({ ok: false, error: validationError }, { status: 400 });

    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      `rutina_ejercicios?id=eq.${encodeURIComponent(id)}`,
      { method: "PATCH", headers: { Prefer: "return=representation" }, body: JSON.stringify(payload) }
    );
    return NextResponse.json({ ok: true, data: rows[0] ?? null });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al actualizar ejercicio" }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await supabaseRest<Array<Record<string, unknown>>>(`rutina_ejercicios?id=eq.${encodeURIComponent(id)}&select=*`);
    const source = rows[0];
    if (!source) return NextResponse.json({ ok: false, error: "Ejercicio no encontrado" }, { status: 404 });

    const last = await supabaseRest<Array<{ orden: number }>>(
      `rutina_ejercicios?rutina_id=eq.${encodeURIComponent(String(source.rutina_id))}&dia=eq.${Number(source.dia)}&select=orden&order=orden.desc&limit=1`
    );

    const copy = { ...source } as Record<string, unknown>;
    delete copy.id;
    delete copy.created_at;
    delete copy.updated_at;
    copy.orden = (last[0]?.orden ?? Number(source.orden ?? 0)) + 1;

    const created = await supabaseRest<Array<Record<string, unknown>>>("rutina_ejercicios", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(copy),
    });
    return NextResponse.json({ ok: true, data: created[0] ?? null });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al duplicar ejercicio" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await supabaseRest(`rutina_ejercicios?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al eliminar ejercicio" }, { status: 500 });
  }
}
