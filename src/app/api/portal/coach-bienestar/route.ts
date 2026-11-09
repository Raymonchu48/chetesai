import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { privacyErrorStatus, requireConsent } from "@/lib/privacy-server";

export const runtime = "nodejs";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const inputSchema = z.object({
  energia: z.number().int().min(1).max(5),
  molestias: z.boolean(),
});

function madridDate() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

async function clientId() {
  if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Supabase no está configurado");
  const cookieStore = await cookies();
  const token = cookieStore.get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` }, cache: "no-store",
  });
  if (!response.ok) throw new Error("Sesión no válida");
  const user = (await response.json()) as { email?: string };
  if (!user.email) throw new Error("Cuenta sin correo vinculado");
  const clients = await serviceFetch<Array<{ id: string }>>(
    `clientes?email=ilike.${encodeURIComponent(user.email)}&select=id&limit=1`,
  );
  if (!clients[0]) throw new Error("Cliente no vinculado");
  await requireConsent(clients[0].id, "health_data");
  return clients[0].id;
}

async function serviceFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init, cache: "no-store",
    headers: {
      apikey: serviceKey, Authorization: `Bearer ${serviceKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
  });
  if (!response.ok) throw new Error("No se pudo acceder al registro de bienestar");
  const body = await response.text();
  return (body ? JSON.parse(body) : null) as T;
}

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "No se pudo registrar el bienestar";
  return NextResponse.json({ ok: false, error: message }, { status: privacyErrorStatus(message) });
}

export async function GET() {
  try {
    const id = await clientId();
    const today = madridDate();
    const rows = await serviceFetch<Array<{ energia: number; molestias: boolean; fecha: string }>>(
      `coach_bienestar_diario?cliente_id=eq.${encodeURIComponent(id)}&fecha=eq.${today}&select=energia,molestias,fecha&limit=1`,
    );
    return NextResponse.json({ ok: true, data: rows[0] || null });
  } catch (error) { return handleError(error); }
}

export async function POST(request: Request) {
  try {
    const id = await clientId();
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ ok: false, error: "Valoración inválida" }, { status: 400 });
    const fecha = madridDate();
    const data = await serviceFetch<Array<{ energia: number; molestias: boolean; fecha: string }>>(
      "coach_bienestar_diario?on_conflict=cliente_id,fecha", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({ cliente_id: id, fecha, ...parsed.data, updated_at: new Date().toISOString() }),
      },
    );
    return NextResponse.json({ ok: true, data: data[0] || null });
  } catch (error) { return handleError(error); }
}
