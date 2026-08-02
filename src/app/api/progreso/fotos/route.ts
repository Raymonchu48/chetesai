import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "progress-photos";

const fieldByPose = {
  frontal: "foto_frontal_path",
  lateral: "foto_lateral_path",
  posterior: "foto_posterior_path",
} as const;

type Pose = keyof typeof fieldByPose;

async function assertProfessional() {
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
}

function storageHeaders(contentType?: string) {
  if (!serviceKey) throw new Error("Supabase no está configurado");
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    ...(contentType ? { "Content-Type": contentType } : {}),
  };
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function GET(request: NextRequest) {
  try {
    await assertProfessional();
    if (!supabaseUrl) throw new Error("Supabase no está configurado");
    const path = request.nextUrl.searchParams.get("path") || "";
    if (!/^[0-9a-f-]+\/[0-9a-f-]+\/(frontal|lateral|posterior)-\d+\.(jpg|png|webp)$/i.test(path)) {
      return NextResponse.json({ ok: false, error: "Ruta de fotografía no válida" }, { status: 400 });
    }

    const response = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
      headers: storageHeaders(),
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
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertProfessional();
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");

    const formData = await request.formData();
    const file = formData.get("file");
    const pose = String(formData.get("pose") || "") as Pose;
    const clienteId = String(formData.get("cliente_id") || "");
    const medicionId = String(formData.get("medicion_id") || "");

    if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "Selecciona una fotografía" }, { status: 400 });
    if (!(pose in fieldByPose)) return NextResponse.json({ ok: false, error: "Posición no válida" }, { status: 400 });
    if (!validUuid(clienteId) || !validUuid(medicionId)) return NextResponse.json({ ok: false, error: "Medición no válida" }, { status: 400 });
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      return NextResponse.json({ ok: false, error: "Usa una imagen JPG, PNG o WebP" }, { status: 400 });
    }
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "La fotografía supera 12 MB" }, { status: 400 });
    }

    const field = fieldByPose[pose];
    const measurementResponse = await fetch(
      `${supabaseUrl}/rest/v1/mediciones_corporales?id=eq.${encodeURIComponent(medicionId)}&cliente_id=eq.${encodeURIComponent(clienteId)}&select=id,${field}&limit=1`,
      { headers: storageHeaders(), cache: "no-store" }
    );
    if (!measurementResponse.ok) throw new Error("No se pudo comprobar la medición");
    const measurements = (await measurementResponse.json()) as Array<Record<string, string | null>>;
    const measurement = measurements[0];
    if (!measurement) return NextResponse.json({ ok: false, error: "La medición no existe" }, { status: 404 });

    const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${clienteId}/${medicionId}/${pose}-${Date.now()}.${extension}`;
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`, {
      method: "POST",
      headers: { ...storageHeaders(file.type), "x-upsert": "true" },
      body: await file.arrayBuffer(),
    });
    const uploadText = await uploadResponse.text();
    if (!uploadResponse.ok) throw new Error(uploadText || "No se pudo subir la fotografía");

    const patchResponse = await fetch(
      `${supabaseUrl}/rest/v1/mediciones_corporales?id=eq.${encodeURIComponent(medicionId)}&cliente_id=eq.${encodeURIComponent(clienteId)}`,
      {
        method: "PATCH",
        headers: { ...storageHeaders("application/json"), Prefer: "return=representation" },
        body: JSON.stringify({ [field]: path, updated_at: new Date().toISOString() }),
      }
    );
    const patchText = await patchResponse.text();
    if (!patchResponse.ok) throw new Error(patchText || "No se pudo vincular la fotografía");

    const previousPath = measurement[field];
    if (previousPath && previousPath !== path) {
      await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(previousPath)}`, {
        method: "DELETE",
        headers: storageHeaders(),
      }).catch(() => undefined);
    }

    return NextResponse.json({ ok: true, data: { pose, field, path } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir la fotografía";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
