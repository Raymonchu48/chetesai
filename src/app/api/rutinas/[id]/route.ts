import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../lib/supabase-rest";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalize(body);

    if (!payload.nombre) {
      return NextResponse.json({ ok: false, error: "El nombre es obligatorio" }, { status: 400 });
    }

    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      `rutinas?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      }
    );

    return NextResponse.json({ ok: true, data: rows[0] ?? null });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al actualizar rutina" },
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
    const source = await supabaseRest<Array<Record<string, unknown>>>(
      `rutinas?id=eq.${encodeURIComponent(id)}&select=*`
    );
    const original = source[0];
    if (!original) {
      return NextResponse.json({ ok: false, error: "Rutina no encontrada" }, { status: 404 });
    }

    const copyPayload = {
      nombre: `${String(original.nombre)} (copia)`,
      descripcion: original.descripcion ?? null,
      objetivo: original.objetivo,
      nivel: original.nivel,
      dias_semana: original.dias_semana,
      duracion_semanas: original.duracion_semanas ?? null,
      duracion_sesion_minutos: original.duracion_sesion_minutos ?? null,
      activa: true,
      es_plantilla: true,
    };

    const created = await supabaseRest<Array<Record<string, unknown>>>("rutinas", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(copyPayload),
    });

    return NextResponse.json({ ok: true, data: created[0] ?? null });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al duplicar rutina" },
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
    await supabaseRest(`rutinas?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({ activa: false }),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al desactivar rutina" },
      { status: 500 }
    );
  }
}
