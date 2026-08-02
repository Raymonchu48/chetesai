import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "exercise-media";

const allowedKinds = new Set(["miniatura", "imagen", "gif", "video"]);
const allowedMime = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "ejercicio";
}

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
  const user = (await userResponse.json()) as { id: string };

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo&limit=1`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
      cache: "no-store",
    }
  );
  if (!profileResponse.ok) throw new Error("No se pudo comprobar el perfil");
  const profiles = (await profileResponse.json()) as Array<{ role?: string; activo?: boolean }>;
  const profile = profiles[0];
  if (!profile || profile.activo === false || !["administrador", "profesional"].includes(profile.role || "")) {
    throw new Error("No autorizado");
  }
}

export async function POST(request: NextRequest) {
  try {
    await assertProfessional();
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") || "");
    const exerciseName = String(formData.get("exerciseName") || "ejercicio");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Selecciona un archivo" }, { status: 400 });
    }
    if (!allowedKinds.has(kind)) {
      return NextResponse.json({ ok: false, error: "Tipo de recurso no válido" }, { status: 400 });
    }
    if (!allowedMime.has(file.type)) {
      return NextResponse.json({ ok: false, error: "Formato no permitido" }, { status: 400 });
    }

    const maxSize = kind === "video" ? 50 * 1024 * 1024 : 12 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { ok: false, error: kind === "video" ? "El vídeo supera 50 MB" : "El archivo supera 12 MB" },
        { status: 400 }
      );
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || (file.type.startsWith("video/") ? "mp4" : "webp");
    const path = `${slugify(exerciseName)}/${kind}-${Date.now()}.${extension}`;
    const bytes = await file.arrayBuffer();

    const uploadResponse = await fetch(
      `${supabaseUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`,
      {
        method: "POST",
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": file.type,
          "x-upsert": "true",
        },
        body: bytes,
      }
    );

    const text = await uploadResponse.text();
    if (!uploadResponse.ok) throw new Error(text || "No se pudo subir el archivo");

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    return NextResponse.json({ ok: true, data: { kind, path, url: publicUrl } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir el archivo";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
