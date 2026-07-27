import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../lib/supabase-rest";

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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizePayload(body);

    if (!payload.nombre || !payload.grupo_muscular) {
      return NextResponse.json(
        { ok: false, error: "El nombre y el grupo muscular son obligatorios" },
        { status: 400 }
      );
    }

    const rows = await supabaseRest<Array<Record<string, unknown>>>(
      `ejercicios?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      }
    );

    return NextResponse.json({ ok: true, data: rows[0] ?? null });
  } catch (error) {
    console.error("[API] PUT /api/ejercicios/[id] error:", error);
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
    await supabaseRest(`ejercicios?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] DELETE /api/ejercicios/[id] error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al eliminar ejercicio" },
      { status: 500 }
    );
  }
}
