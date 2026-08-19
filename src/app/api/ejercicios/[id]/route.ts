import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../lib/supabase-rest";

function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function textList(value: unknown) {
  if (Array.isArray(value)) {
    const items = value.map((item) => String(item).trim()).filter(Boolean);
    return items.length ? items.join(", ") : null;
  }
  return optionalText(value);
}

function iaContext(body: Record<string, unknown>) {
  const value = body.contexto_ia ?? body.ia_contexto;
  return typeof value === "object" && value ? value : {};
}

function normalizePayload(body: Record<string, unknown>) {
  return {
    nombre: String(body.nombre ?? "").trim(),
    nombre_alternativo: optionalText(body.nombre_alternativo),
    codigo_interno: optionalText(body.codigo_interno),
    grupo_muscular: String(body.grupo_muscular ?? "").trim(),
    grupo_secundario: optionalText(body.grupo_secundario),
    musculos_estabilizadores: textList(body.musculos_estabilizadores),
    categoria: String(body.categoria ?? "fuerza").trim(),
    subcategoria: optionalText(body.subcategoria),
    dificultad: String(body.dificultad ?? "principiante").trim(),
    nivel_tecnico: optionalText(body.nivel_tecnico),
    riesgo_lesion: optionalText(body.riesgo_lesion),
    material: optionalText(body.material),
    material_alternativo: optionalText(body.material_alternativo),
    apto_casa: body.apto_casa === true,
    apto_gimnasio: body.apto_gimnasio !== false,
    descripcion: optionalText(body.descripcion),
    tecnica: optionalText(body.tecnica),
    posicion_inicial: optionalText(body.posicion_inicial),
    pasos_ejecucion: optionalText(body.pasos_ejecucion),
    respiracion: optionalText(body.respiracion),
    tempo_recomendado: optionalText(body.tempo_recomendado),
    rango_movimiento: optionalText(body.rango_movimiento),
    errores_frecuentes: optionalText(body.errores_frecuentes),
    consejos: optionalText(body.consejos),
    contraindicaciones: optionalText(body.contraindicaciones),
    imagen_url: optionalText(body.imagen_url),
    miniatura_url: optionalText(body.miniatura_url),
    gif_url: optionalText(body.gif_url),
    video_url: optionalText(body.video_url),
    tipo_movimiento: optionalText(body.tipo_movimiento),
    lateralidad: optionalText(body.lateralidad),
    plano_movimiento: optionalText(body.plano_movimiento),
    articulacion_principal: optionalText(body.articulacion_principal),
    variante_facil: optionalText(body.variante_facil),
    variante_avanzada: optionalText(body.variante_avanzada),
    regresion: optionalText(body.regresion),
    progresion: optionalText(body.progresion),
    etiquetas: stringArray(body.etiquetas),
    objetivos: stringArray(body.objetivos),
    contexto_ia: iaContext(body),
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
      return NextResponse.json({ ok: false, error: "El nombre y el grupo muscular son obligatorios" }, { status: 400 });
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
    const rows = await supabaseRest<Array<Record<string, unknown>>>(`ejercicios?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Prefer: "return=representation" },
    });
    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Ejercicio no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: rows[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar ejercicio";
    const referenced = message.includes("23503") || message.toLowerCase().includes("foreign key");
    return NextResponse.json(
      { ok: false, error: referenced ? "Este ejercicio está incluido en una rutina. Quítalo primero de las rutinas donde se utiliza." : message },
      { status: referenced ? 409 : 500 }
    );
  }
}
