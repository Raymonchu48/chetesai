import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Row = Record<string, unknown>;

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

async function getClient() {
  if (!supabaseUrl || !anonKey) throw new Error("Supabase no está configurado");
  const store = await cookies();
  const token = store.get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("Sesión no válida");
  const user = (await userResponse.json()) as { id?: string; email?: string };
  if (!user.email) throw new Error("Tu cuenta no tiene correo asociado");

  const clients = await serviceRequest<Array<{ id: string; nombre: string; email: string | null }>>(
    `clientes?email=ilike.${encodeURIComponent(user.email)}&select=id,nombre,email&limit=1`
  );
  if (!clients[0]) throw new Error("Tu cuenta todavía no está vinculada a un cliente");
  return { userId: user.id || null, client: clients[0] };
}

function dateDaysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const { client } = await getClient();
    const encoded = encodeURIComponent(client.id);
    const [plans, habits, records] = await Promise.all([
      serviceRequest<Row[]>(
        `planes_nutricionales?cliente_id=eq.${encoded}&estado=eq.activo&select=id,nombre,objetivo,calorias_objetivo,proteinas_g,carbohidratos_g,grasas_g,agua_ml,recomendaciones,comidas,fecha_inicio,fecha_fin&order=fecha_inicio.desc,created_at.desc&limit=1`
      ),
      serviceRequest<Row[]>(
        `habitos_cliente?cliente_id=eq.${encoded}&activo=eq.true&visible_cliente=eq.true&select=id,nombre,categoria,tipo_registro,objetivo_valor,unidad,instrucciones&order=created_at.asc`
      ),
      serviceRequest<Row[]>(
        `registros_habitos?cliente_id=eq.${encoded}&fecha=gte.${dateDaysAgo(13)}&select=id,habito_id,fecha,completado,valor,nota&order=fecha.desc,created_at.desc`
      ),
    ]);

    return NextResponse.json({ ok: true, data: { cliente: client, plan: plans[0] || null, habitos: habits, registros: records } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar nutrición y hábitos";
    return NextResponse.json({ ok: false, error: message }, { status: message === "No autenticado" ? 401 : 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, client } = await getClient();
    const body = (await request.json()) as Record<string, unknown>;
    const habitId = String(body.habito_id || "");
    const date = String(body.fecha || new Date().toISOString().slice(0, 10));
    if (!habitId) return NextResponse.json({ ok: false, error: "Hábito no válido" }, { status: 400 });

    const habits = await serviceRequest<Array<{ id: string; tipo_registro: string }>>(
      `habitos_cliente?id=eq.${encodeURIComponent(habitId)}&cliente_id=eq.${encodeURIComponent(client.id)}&activo=eq.true&visible_cliente=eq.true&select=id,tipo_registro&limit=1`
    );
    const habit = habits[0];
    if (!habit) return NextResponse.json({ ok: false, error: "Hábito no disponible" }, { status: 404 });

    const rawValue = body.valor;
    const value = rawValue === "" || rawValue === null || rawValue === undefined ? null : Number(rawValue);
    if (value !== null && (!Number.isFinite(value) || value < 0)) {
      return NextResponse.json({ ok: false, error: "Introduce un valor válido" }, { status: 400 });
    }

    const payload = {
      habito_id: habitId,
      cliente_id: client.id,
      fecha: date,
      completado: Boolean(body.completado),
      valor: habit.tipo_registro === "cantidad" ? value : null,
      nota: String(body.nota || "").trim() || null,
      created_by: userId,
      updated_at: new Date().toISOString(),
    };

    const rows = await serviceRequest<Row[]>("registros_habitos?on_conflict=habito_id,fecha", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(payload),
    });
    return NextResponse.json({ ok: true, data: rows[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al guardar el hábito";
    return NextResponse.json({ ok: false, error: message }, { status: message === "No autenticado" ? 401 : 500 });
  }
}
