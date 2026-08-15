import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Error de Supabase");
  return (text ? JSON.parse(text) : null) as T;
}

export async function GET() {
  try {
    const clientes = await rest<Array<Record<string, unknown>>>(
      "clientes?estado=neq.inactivo&select=id,nombre,email,estado&order=nombre.asc"
    );
    return NextResponse.json({ ok: true, data: clientes });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudieron cargar los clientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const clienteId = String(body.cliente_id || "");
    const ejercicioId = String(body.ejercicio_id || "");
    const dia = Math.max(1, Math.min(7, Number(body.dia || 1)));
    const series = Math.max(1, Math.min(30, Number(body.series || 3)));
    const repeticiones = String(body.repeticiones || "10").trim() || "10";
    const descanso = Math.max(0, Math.min(3600, Number(body.descanso_segundos ?? 60)));
    const observaciones = body.observaciones ? String(body.observaciones).trim() : null;

    if (!clienteId || !ejercicioId) {
      return NextResponse.json({ ok: false, error: "Cliente y ejercicio son obligatorios" }, { status: 400 });
    }

    const [clientes, ejercicios] = await Promise.all([
      rest<Array<Record<string, unknown>>>(`clientes?id=eq.${encodeURIComponent(clienteId)}&select=id,nombre&limit=1`),
      rest<Array<Record<string, unknown>>>(`ejercicios?id=eq.${encodeURIComponent(ejercicioId)}&select=id,nombre,dificultad&limit=1`),
    ]);
    const cliente = clientes[0];
    const ejercicio = ejercicios[0];
    if (!cliente) return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    if (!ejercicio) return NextResponse.json({ ok: false, error: "Ejercicio no encontrado" }, { status: 404 });

    const asignaciones = await rest<Array<Record<string, unknown>>>(
      `cliente_rutinas?cliente_id=eq.${encodeURIComponent(clienteId)}&estado=in.(activa,programada,pausada)&select=id,rutina_id,estado&order=created_at.desc&limit=1`
    );

    let rutinaId = asignaciones[0]?.rutina_id ? String(asignaciones[0].rutina_id) : "";
    let createdPlan = false;

    if (!rutinaId) {
      const nombreCliente = String(cliente.nombre || "Cliente");
      const nivel = ["principiante", "intermedio", "avanzado"].includes(String(ejercicio.dificultad || ""))
        ? String(ejercicio.dificultad)
        : "principiante";
      const rutinas = await rest<Array<Record<string, unknown>>>("rutinas", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          nombre: `Plan personalizado · ${nombreCliente}`,
          descripcion: "Plan creado automáticamente desde la Biblioteca Visual Chetesaí.",
          objetivo: "bienestar_general",
          nivel,
          dias_semana: dia,
          activa: true,
          es_plantilla: false,
        }),
      });
      rutinaId = String(rutinas[0]?.id || "");
      if (!rutinaId) throw new Error("No se pudo crear el plan personalizado");

      await rest("cliente_rutinas", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          cliente_id: clienteId,
          rutina_id: rutinaId,
          fecha_inicio: new Date().toISOString().slice(0, 10),
          estado: "activa",
          progreso: 0,
          notas: "Plan creado desde una asignación directa de ejercicio.",
        }),
      });
      createdPlan = true;
    }

    const existing = await rest<Array<Record<string, unknown>>>(
      `rutina_ejercicios?rutina_id=eq.${encodeURIComponent(rutinaId)}&ejercicio_id=eq.${encodeURIComponent(ejercicioId)}&dia=eq.${dia}&select=id&limit=1`
    );
    if (existing.length) {
      return NextResponse.json(
        { ok: false, error: "Este ejercicio ya está asignado a ese cliente en el día seleccionado" },
        { status: 409 }
      );
    }

    const last = await rest<Array<Record<string, unknown>>>(
      `rutina_ejercicios?rutina_id=eq.${encodeURIComponent(rutinaId)}&dia=eq.${dia}&select=orden&order=orden.desc&limit=1`
    );
    const orden = Number(last[0]?.orden || 0) + 1;

    const rows = await rest<Array<Record<string, unknown>>>("rutina_ejercicios", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        rutina_id: rutinaId,
        ejercicio_id: ejercicioId,
        dia,
        orden,
        series,
        repeticiones,
        descanso_segundos: descanso,
        observaciones,
      }),
    });

    return NextResponse.json({
      ok: true,
      data: {
        asignacion: rows[0] || null,
        rutina_id: rutinaId,
        plan_creado: createdPlan,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo asignar el ejercicio" },
      { status: 500 }
    );
  }
}
