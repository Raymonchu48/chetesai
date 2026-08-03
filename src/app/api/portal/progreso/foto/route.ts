import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "progress-photos";

async function serviceRequest<T>(path: string): Promise<T> {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
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
  const user = (await userResponse.json()) as { email?: string };
  if (!user.email) throw new Error("Tu cuenta no tiene correo asociado");

  const clients = await serviceRequest<Array<{ id: string }>>(
    `clientes?email=ilike.${encodeURIComponent(user.email)}&select=id&limit=1`
  );
  if (!clients[0]) throw new Error("Tu cuenta todavía no está vinculada a un cliente");
  return clients[0];
}

export async function GET(request: NextRequest) {
  try {
    const client = await getClient();
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
    const path = request.nextUrl.searchParams.get("path") || "";
    if (!path.startsWith(`${client.id}/`) || !/^[0-9a-f-]+\/[0-9a-f-]+\/(frontal|lateral|posterior)-\d+\.(jpg|png|webp)$/i.test(path)) {
      return NextResponse.json({ ok: false, error: "Fotografía no autorizada" }, { status: 403 });
    }

    const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    });
    if (!response.ok) return NextResponse.json({ ok: false, error: "Fotografía no disponible" }, { status: 404 });

    return new NextResponse(await response.arrayBuffer(), {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al cargar la fotografía";
    const status = message === "No autenticado" ? 401 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
