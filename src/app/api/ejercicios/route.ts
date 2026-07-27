import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../lib/supabase-rest";

function optionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function stringArray(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value ?? "").split(",").map((item) => item.trim()).filter(Boolean);
}

function normalizePayload(body: Record<string, unknown>) {
  return {
    nombre: String(body.nombre ?? "").trim(),
    nombre_alternativo: optionalText(body.nombre_alternativo),
    codigo_interno: optionalText(body.codigo_interno),
    grupo_muscular: String(body.grupo_muscular ?? "").trim(),
    grupo_secundario: optionalText(body.grupo_secundario),
    musculos_estabilizadores: stringArray(body.musculos_estabilizadores),
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
    ia_contexto: typeof body.ia_contexto === "object" && body.ia_contexto ? body.ia_contexto : {},
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

    const rows = await supabaseRest<Array<Record<string, unknown>>>(`ejercicios?${filters.join("&")}`);
    return NextResponse.json({ ok: true, data: rows.map((row) => ({ ...row, _id: row.id })) });
  } catch (error) {
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
      return NextResponse.json({ ok: false, error: "El nombre y el grupo muscular son obligatorios" }, { status: 400 });
    }

    const rows = await supabaseRest<Array<Record<string, unknown>>>("ejercicios", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ ok: true, data: rows[0] ? { ...rows[0], _id: rows[0].id } : null });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al crear ejercicio" },
      { status: 500 }
    );
  }
}