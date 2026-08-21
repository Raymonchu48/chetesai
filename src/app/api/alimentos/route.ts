import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type AppUser = { id: string };
type Row = Record<string, unknown>;

async function assertProfessional(): Promise<AppUser> {
  if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Supabase no está configurado");
  const store = await cookies();
  const token = store.get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("Sesión no válida");
  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) throw new Error("Sesión no válida");

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo&limit=1`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }, cache: "no-store" }
  );
  const profiles = profileResponse.ok
    ? ((await profileResponse.json()) as Array<{ role?: string; activo?: boolean }>)
    : [];
  const profile = profiles[0];
  if (!profile || profile.activo === false || !["administrador", "profesional"].includes(profile.role || "")) {
    throw new Error("No autorizado");
  }
  return { id: user.id };
}

async function serviceRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || "Error de Supabase");
  return (text ? JSON.parse(text) : null) as T;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function statusFor(message: string) {
  return message === "No autenticado" || message === "Sesión no válida"
    ? 401
    : message === "No autorizado"
      ? 403
      : 500;
}

export async function GET(request: NextRequest) {
  try {
    await assertProfessional();
    const search = String(request.nextUrl.searchParams.get("q") || "").trim();
    const category = String(request.nextUrl.searchParams.get("categoria") || "").trim();
    const filters = ["activo=eq.true"];
    if (search) filters.push(`nombre=ilike.*${encodeURIComponent(search)}*`);
    if (category && category !== "todas") filters.push(`categoria=eq.${encodeURIComponent(category)}`);
    const rows = await serviceRequest<Row[]>(
      `alimentos?${filters.join("&")}&select=*&order=categoria.asc,nombre.asc&limit=500`
    );
    return NextResponse.json({ ok: true, data: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar la biblioteca";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await assertProfessional();
    const body = (await request.json()) as Record<string, unknown>;
    const nombre = String(body.nombre || "").trim();
    if (!nombre) return NextResponse.json({ ok: false, error: "Escribe el nombre del alimento" }, { status: 400 });

    const rows = await serviceRequest<Row[]>("alimentos", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        nombre,
        categoria: String(body.categoria || "otros"),
        marca: String(body.marca || "").trim() || null,
        estado_preparacion: String(body.estado_preparacion || "tal_como_se_compra"),
        porcion_nombre: String(body.porcion_nombre || "100 g").trim(),
        porcion_gramos: Math.max(numberValue(body.porcion_gramos), 1),
        energia_kcal: numberValue(body.energia_kcal),
        proteinas_g: numberValue(body.proteinas_g),
        carbohidratos_g: numberValue(body.carbohidratos_g),
        grasas_g: numberValue(body.grasas_g),
        fibra_g: numberValue(body.fibra_g),
        azucares_g: numberValue(body.azucares_g),
        grasas_saturadas_g: numberValue(body.grasas_saturadas_g),
        sodio_mg: numberValue(body.sodio_mg),
        alergenos: Array.isArray(body.alergenos) ? body.alergenos : [],
        etiquetas: Array.isArray(body.etiquetas) ? body.etiquetas : [],
        fuente: String(body.fuente || "Introducido por el profesional"),
        notas: String(body.notas || "").trim() || null,
        es_personalizado: true,
        creado_por: user.id,
      }),
    });
    return NextResponse.json({ ok: true, data: rows[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el alimento";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await assertProfessional();
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "Alimento no válido" }, { status: 400 });
    await serviceRequest(
      `alimentos?id=eq.${encodeURIComponent(id)}&creado_por=eq.${encodeURIComponent(user.id)}&es_personalizado=eq.true`,
      { method: "PATCH", body: JSON.stringify({ activo: false, updated_at: new Date().toISOString() }) }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo eliminar el alimento";
    return NextResponse.json({ ok: false, error: message }, { status: statusFor(message) });
  }
}
