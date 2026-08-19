import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function serviceRest<T>(path: string): Promise<T> {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Error de Supabase");
  return (text ? JSON.parse(text) : null) as T;
}

export async function GET() {
  try {
    if (!supabaseUrl || !anonKey) throw new Error("Supabase no está configurado");
    const cookieStore = await cookies();
    const token = cookieStore.get("chetesai_access_token")?.value;
    if (!token) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!userResponse.ok) return NextResponse.json({ ok: false, error: "Sesión no válida" }, { status: 401 });
    const user = (await userResponse.json()) as { id: string; email?: string };
    if (!user.email) return NextResponse.json({ ok: true, data: null });

    const clientes = await serviceRest<Array<{ id: string; nombre: string; email: string | null; modelo_visual: "hombre" | "mujer" }>>(
      `clientes?email=ilike.${encodeURIComponent(user.email)}&select=id,nombre,email,modelo_visual&limit=1`
    );
    const cliente = clientes[0];
    if (!cliente) return NextResponse.json({ ok: true, data: null, reason: "cliente_no_vinculado" });

    const asignaciones = await serviceRest<Array<Record<string, unknown>>>(
      `cliente_rutinas?cliente_id=eq.${encodeURIComponent(cliente.id)}&estado=eq.activa&select=*,rutinas(id,nombre,descripcion,objetivo,nivel,dias_semana,duracion_semanas,duracion_sesion_minutos)&order=fecha_inicio.desc&limit=1`
    );
    const asignacion = asignaciones[0];
    if (!asignacion) return NextResponse.json({ ok: true, data: { cliente, asignacion: null, ejercicios: [] } });

    const rutina = asignacion.rutinas as Record<string, unknown> | undefined;
    const rutinaId = String(rutina?.id || asignacion.rutina_id || "");
    const ejercicios = rutinaId
      ? await serviceRest<Array<Record<string, unknown>>>(
          `rutina_ejercicios?rutina_id=eq.${encodeURIComponent(rutinaId)}&visible_cliente=eq.true&select=*,ejercicios(id,codigo_interno,nombre,grupo_muscular,grupo_secundario,categoria,dificultad,material,imagen_url,miniatura_url,gif_url,video_url,descripcion,tecnica,errores_frecuentes,consejos,tipo_movimiento,lateralidad,plano_movimiento,articulacion_principal,progresion,regresion,variante_facil,variante_avanzada,etiquetas)&order=dia.asc,orden.asc`
        )
      : [];

    return NextResponse.json({ ok: true, data: { cliente, asignacion, rutina, ejercicios } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Error al cargar el entrenamiento" }, { status: 500 });
  }
}
