import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { privacyErrorStatus, requireConsent } from "@/lib/privacy-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type AppUser = { id: string };
type Row = Record<string, unknown>;
type CleanFood = {
  alimento_id: string;
  nombre: string;
  cantidad_g: number;
  energia_kcal: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
};
type CleanMeal = { nombre: string; hora: string; descripcion: string; alimentos: CleanFood[] };

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
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    }
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

function optionalNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function cleanMeals(value: unknown): CleanMeal[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as Record<string, unknown>;
      const foods = Array.isArray(row.alimentos)
        ? row.alimentos.map((food) => {
            const item = food as Record<string, unknown>;
            return {
              alimento_id: String(item.alimento_id || ""),
              nombre: String(item.nombre || "").trim(),
              cantidad_g: Math.max(optionalNumber(item.cantidad_g) || 0, 0),
              energia_kcal: Math.max(optionalNumber(item.energia_kcal) || 0, 0),
              proteinas_g: Math.max(optionalNumber(item.proteinas_g) || 0, 0),
              carbohidratos_g: Math.max(optionalNumber(item.carbohidratos_g) || 0, 0),
              grasas_g: Math.max(optionalNumber(item.grasas_g) || 0, 0),
            };
          }).filter((food) => food.nombre && food.cantidad_g > 0)
        : [];
      return {
        nombre: String(row.nombre || "").trim(),
        hora: String(row.hora || "").trim(),
        descripcion: String(row.descripcion || "").trim(),
        alimentos: foods,
      };
    })
    .filter((item) => item.nombre || item.descripcion || item.alimentos.length);
}

function hasMeaningfulPlanContent(body: Record<string, unknown>, meals: CleanMeal[]) {
  const hasMealProposal = meals.some((meal) => meal.descripcion.length > 0 || meal.alimentos.length > 0);
  const hasText = [body.objetivo, body.recomendaciones].some((value) => String(value || "").trim().length > 0);
  const hasTargets = [
    body.calorias_objetivo,
    body.proteinas_g,
    body.carbohidratos_g,
    body.grasas_g,
    body.agua_ml,
  ].some((value) => value !== "" && value !== null && value !== undefined && Number.isFinite(Number(value)));
  return hasMealProposal || hasText || hasTargets;
}

export async function GET(request: NextRequest) {
  try {
    await assertProfessional();
    const clienteId = request.nextUrl.searchParams.get("cliente_id");
    if (!clienteId) return NextResponse.json({ ok: true, data: { plan: null, habitos: [], registros: [] } });
    await requireConsent(clienteId, "health_data");

    const encoded = encodeURIComponent(clienteId);
    const [plans, habits, records] = await Promise.all([
      serviceRequest<Row[]>(
        `planes_nutricionales?cliente_id=eq.${encoded}&estado=eq.activo&select=*&order=fecha_inicio.desc,created_at.desc&limit=1`
      ),
      serviceRequest<Row[]>(
        `habitos_cliente?cliente_id=eq.${encoded}&activo=eq.true&select=*&order=created_at.asc`
      ),
      serviceRequest<Row[]>(
        `registros_habitos?cliente_id=eq.${encoded}&select=*&order=fecha.desc,created_at.desc&limit=200`
      ),
    ]);

    return NextResponse.json({ ok: true, data: { plan: plans[0] || null, habitos: habits, registros: records } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar nutrición y hábitos";
    const status = privacyErrorStatus(message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await assertProfessional();
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "");
    const clienteId = String(body.cliente_id || "");
    if (!clienteId) return NextResponse.json({ ok: false, error: "Selecciona un cliente" }, { status: 400 });
    await requireConsent(clienteId, "health_data");

    if (action === "save_plan") {
      const meals = cleanMeals(body.comidas);
      if (!hasMeaningfulPlanContent(body, meals)) {
        return NextResponse.json(
          {
            ok: false,
            error: "El plan está vacío. Añade al menos una propuesta de comida, una recomendación, un objetivo o valores nutricionales antes de publicarlo.",
          },
          { status: 400 }
        );
      }

      const payload = {
        cliente_id: clienteId,
        nombre: String(body.nombre || "Plan nutricional personalizado").trim(),
        objetivo: String(body.objetivo || "").trim() || null,
        calorias_objetivo: optionalNumber(body.calorias_objetivo),
        proteinas_g: optionalNumber(body.proteinas_g),
        carbohidratos_g: optionalNumber(body.carbohidratos_g),
        grasas_g: optionalNumber(body.grasas_g),
        agua_ml: optionalNumber(body.agua_ml),
        recomendaciones: String(body.recomendaciones || "").trim() || null,
        comidas: meals,
        fecha_inicio: String(body.fecha_inicio || new Date().toISOString().slice(0, 10)),
        fecha_fin: String(body.fecha_fin || "").trim() || null,
        estado: "activo",
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      const planId = String(body.id || "");
      const rows = planId
        ? await serviceRequest<Row[]>(`planes_nutricionales?id=eq.${encodeURIComponent(planId)}&cliente_id=eq.${encodeURIComponent(clienteId)}`, {
            method: "PATCH",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(payload),
          })
        : await serviceRequest<Row[]>("planes_nutricionales", {
            method: "POST",
            headers: { Prefer: "return=representation" },
            body: JSON.stringify(payload),
          });

      const savedPlan = rows[0] || null;
      if (!savedPlan) {
        return NextResponse.json({ ok: false, error: "Supabase no confirmó la publicación del plan" }, { status: 500 });
      }

      return NextResponse.json({ ok: true, data: savedPlan, published: true });
    }

    if (action === "create_habit") {
      const name = String(body.nombre || "").trim();
      if (!name) return NextResponse.json({ ok: false, error: "Escribe el nombre del hábito" }, { status: 400 });
      const type = body.tipo_registro === "cantidad" ? "cantidad" : "booleano";
      const rows = await serviceRequest<Row[]>("habitos_cliente", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          cliente_id: clienteId,
          nombre: name,
          categoria: String(body.categoria || "bienestar"),
          tipo_registro: type,
          objetivo_valor: type === "cantidad" ? optionalNumber(body.objetivo_valor) : null,
          unidad: type === "cantidad" ? String(body.unidad || "").trim() || null : null,
          instrucciones: String(body.instrucciones || "").trim() || null,
          activo: true,
          visible_cliente: body.visible_cliente !== false,
          created_by: user.id,
        }),
      });
      return NextResponse.json({ ok: true, data: rows[0] || null });
    }

    return NextResponse.json({ ok: false, error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar nutrición y hábitos";
    const status = privacyErrorStatus(message);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await assertProfessional();
    const habitId = request.nextUrl.searchParams.get("habito_id");
    if (!habitId) return NextResponse.json({ ok: false, error: "Hábito no válido" }, { status: 400 });
    await serviceRequest(`habitos_cliente?id=eq.${encodeURIComponent(habitId)}`, {
      method: "PATCH",
      body: JSON.stringify({ activo: false, updated_at: new Date().toISOString() }),
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar el hábito";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
