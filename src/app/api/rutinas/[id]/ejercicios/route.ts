import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../../lib/supabase-rest";

function optionalNumber(value: unknown) {
  return value === null || value === "" || value === undefined ? null : Number(value);
}

function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function normalize(body: Record<string, unknown>) {
  return {
    ejercicio_id: String(body.ejercicio_id ?? ""),
    dia: Number(body.dia ?? 1),
    bloque: optionalText(body.bloque),
    orden: Number(body.orden ?? 1),
    series: Number(body.series ?? 3),
    repeticiones: String(body.repeticiones ?? "10").trim() || "10",
    peso_kg: optionalNumber(body.peso_kg),
    descanso_segundos: Number(body.descanso_segundos ?? 60),
    tempo: optionalText(body.tempo),
    rpe: optionalNumber(body.rpe),
    rir: optionalNumber(body.rir),
    duracion_segundos: optionalNumber(body.duracion_segundos),
    distancia_metros: optionalNumber(body.distancia_metros),
    observaciones: optionalText(body.observaciones),
    notas_entrenador: optionalText(body.notas_entrenador),
    instrucciones_cliente: optionalText(body.instrucciones_cliente),
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
  if (!payload.ejercicio_id) return "Selecciona un ejercicio";
  if (payload.dia < 1 || payload.dia > 7) return "El día debe estar entre 1 y 7";
  if (payload.series < 1 || payload.series > 30) return "Las series deben estar entre 1 y 30";
  if (payload.descanso_segundos < 0 || payload.descanso_segundos > 3600) return "El descanso debe estar entre 0 y 3600 segundos";
  if (payload.rpe !== null && (payload.rpe < 1 || payload.rpe > 10)) return "El RPE debe estar entre 1 y 10";
  if (payload.rir !== null && (payload.rir < 0 || payload.rir > 10)) return "El RIR debe estar entre 0 y 10";
  if (payload.series_calentamiento < 0 || payload.series_calentamiento > 10) return "Las series de calentamiento deben estar entre 0 y 10";
  return null;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      `rutina_ejercicios?rutina_id=eq.${encodeURIComponent(id)}&select=*,ejercicios(id,nombre,grupo_muscular,material,imagen_url,miniatura_url,gif_url)&order=dia.asc,orden.asc`
    );
    return NextResponse.json({ ok: true, data: rows.map((row) => ({ ...row, _id: row.id })) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al cargar ejercicios de la rutina" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalize(body);
    const validationError = validate(payload);
    if (validationError) return NextResponse.json({ ok: false, error: validationError }, { status: 400 });

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
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al añadir ejercicio" }, { status: 500 });
  }
}
