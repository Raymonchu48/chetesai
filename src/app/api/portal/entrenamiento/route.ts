import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function rest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Error de Supabase");
  return (text ? JSON.parse(text) : null) as T;
}

async function getClientContext() {
  if (!supabaseUrl || !anonKey) throw new Error("Supabase no está configurado");
  const store = await cookies();
  const token = store.get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("Sesión no válida");
  const user = (await userResponse.json()) as { email?: string };
  if (!user.email) throw new Error("Usuario sin correo");

  const clientes = await rest<Array<{ id: string; nombre: string }>>(
    `clientes?email=ilike.${encodeURIComponent(user.email)}&select=id,nombre&limit=1`
  );
  const cliente = clientes[0];
  if (!cliente) throw new Error("Cliente no vinculado");

  const asignaciones = await rest<Array<Record<string, unknown>>>(
    `cliente_rutinas?cliente_id=eq.${cliente.id}&estado=eq.activa&select=id,rutina_id,progreso&order=fecha_inicio.desc&limit=1`
  );
  const asignacion = asignaciones[0];
  if (!asignacion) throw new Error("No tienes una rutina activa");
  return { cliente, asignacion };
}

async function getSessionPayload(sessionId: string) {
  const sesiones = await rest<Array<Record<string, unknown>>>(
    `sesiones_entrenamiento?id=eq.${sessionId}&select=*&limit=1`
  );
  const sesion = sesiones[0] || null;
  const series = sesion
    ? await rest<Array<Record<string, unknown>>>(
        `series_entrenamiento?sesion_id=eq.${sessionId}&select=*&order=rutina_ejercicio_id.asc,numero_serie.asc`
      )
    : [];
  return { sesion, series };
}

export async function GET(request: NextRequest) {
  try {
    const { cliente, asignacion } = await getClientContext();
    const dia = Number(request.nextUrl.searchParams.get("dia") || 1);
    const sesiones = await rest<Array<Record<string, unknown>>>(
      `sesiones_entrenamiento?cliente_id=eq.${cliente.id}&cliente_rutina_id=eq.${String(asignacion.id)}&dia=eq.${dia}&estado=eq.en_curso&select=*&order=iniciada_at.desc&limit=1`
    );
    if (!sesiones[0]) return NextResponse.json({ ok: true, data: null });
    return NextResponse.json({ ok: true, data: await getSessionPayload(String(sesiones[0].id)) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al cargar la sesión" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cliente, asignacion } = await getClientContext();
    const body = (await request.json()) as { dia?: number };
    const dia = Number(body.dia || 1);

    const existing = await rest<Array<Record<string, unknown>>>(
      `sesiones_entrenamiento?cliente_id=eq.${cliente.id}&cliente_rutina_id=eq.${String(asignacion.id)}&dia=eq.${dia}&estado=eq.en_curso&select=*&limit=1`
    );
    if (existing[0]) return NextResponse.json({ ok: true, data: await getSessionPayload(String(existing[0].id)) });

    const exercises = await rest<Array<Record<string, unknown>>>(
      `rutina_ejercicios?rutina_id=eq.${String(asignacion.rutina_id)}&dia=eq.${dia}&visible_cliente=eq.true&select=id,series,repeticiones,peso_kg&order=orden.asc`
    );
    if (!exercises.length) return NextResponse.json({ ok: false, error: "Este día no tiene ejercicios visibles" }, { status: 400 });

    const seriesCount = exercises.reduce((sum, item) => sum + Number(item.series || 0), 0);
    const created = await rest<Array<Record<string, unknown>>>("sesiones_entrenamiento", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        cliente_id: cliente.id,
        cliente_rutina_id: asignacion.id,
        rutina_id: asignacion.rutina_id,
        dia,
        ejercicios_planificados: exercises.length,
        series_planificadas: seriesCount,
      }),
    });
    const session = created[0];

    const rows = exercises.flatMap((exercise) =>
      Array.from({ length: Number(exercise.series || 0) }, (_, index) => ({
        sesion_id: session.id,
        rutina_ejercicio_id: exercise.id,
        numero_serie: index + 1,
        repeticiones_objetivo: exercise.repeticiones,
        peso_objetivo: exercise.peso_kg,
      }))
    );
    if (rows.length) {
      await rest("series_entrenamiento", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(rows),
      });
    }
    return NextResponse.json({ ok: true, data: await getSessionPayload(String(session.id)) });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al iniciar sesión" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await getClientContext();
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "update_set");

    if (action === "update_set") {
      const id = String(body.serie_id || "");
      if (!id) return NextResponse.json({ ok: false, error: "Serie no válida" }, { status: 400 });
      const completed = body.completada === true;
      await rest(`series_entrenamiento?id=eq.${id}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          repeticiones_realizadas: body.repeticiones_realizadas === "" ? null : Number(body.repeticiones_realizadas),
          peso_real: body.peso_real === "" ? null : Number(body.peso_real),
          rpe_real: body.rpe_real === "" ? null : Number(body.rpe_real),
          comentario: body.comentario ? String(body.comentario) : null,
          completada: completed,
          completada_at: completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }),
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "finish_session") {
      const sessionId = String(body.session_id || "");
      const payload = await getSessionPayload(sessionId);
      if (!payload.sesion) return NextResponse.json({ ok: false, error: "Sesión no encontrada" }, { status: 404 });
      const completed = payload.series.filter((row) => row.completada === true);
      const volume = completed.reduce((sum, row) => sum + Number(row.peso_real || 0) * Number(row.repeticiones_realizadas || 0), 0);
      const exerciseIds = new Set(completed.map((row) => String(row.rutina_ejercicio_id)));
      const started = new Date(String(payload.sesion.iniciada_at)).getTime();
      const finished = Date.now();
      await rest(`sesiones_entrenamiento?id=eq.${sessionId}`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({
          estado: "completada",
          finalizada_at: new Date(finished).toISOString(),
          duracion_segundos: Math.max(0, Math.round((finished - started) / 1000)),
          series_completadas: completed.length,
          ejercicios_completados: exerciseIds.size,
          volumen_total: volume,
          rpe_sesion: body.rpe_sesion === "" ? null : Number(body.rpe_sesion),
          comentario_cliente: body.comentario_cliente ? String(body.comentario_cliente) : null,
          updated_at: new Date().toISOString(),
        }),
      });
      return NextResponse.json({ ok: true, data: await getSessionPayload(sessionId) });
    }

    return NextResponse.json({ ok: false, error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al actualizar la sesión" }, { status: 500 });
  }
}