import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucket = "exercise-media";

const allowedKinds = new Set(["miniatura", "imagen", "gif", "video"]);
const fieldByKind: Record<string, "miniatura_url" | "imagen_url" | "gif_url" | "video_url"> = {
  miniatura: "miniatura_url",
  imagen: "imagen_url",
  gif: "gif_url",
  video: "video_url",
};
const allowedMime = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);
const extensionByMime: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

type UploadPayload = {
  action?: "sign" | "finalize";
  kind?: string;
  exerciseName?: string;
  exerciseId?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  path?: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "ejercicio";
}

function publicUrlForPath(path: string) {
  return supabaseUrl + "/storage/v1/object/public/" + bucket + "/" + path;
}

function maxSizeFor(kind: string) {
  return kind === "video" ? 50 * 1024 * 1024 : 12 * 1024 * 1024;
}

function isValidGeneratedPath(path: string, kind: string) {
  const pattern = /^[a-z0-9-]+\/(miniatura|imagen|gif|video)-\d+-[a-f0-9-]+\.(jpg|png|webp|gif|mp4|webm|mov)$/;
  return pattern.test(path) && path.includes("/" + kind + "-");
}

async function assertProfessional() {
  if (!supabaseUrl || !anonKey || !serviceKey) throw new Error("Supabase no está configurado");
  const store = await cookies();
  const token = store.get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");

  const userResponse = await fetch(supabaseUrl + "/auth/v1/user", {
    headers: { apikey: anonKey, Authorization: "Bearer " + token },
    cache: "no-store",
  });
  if (!userResponse.ok) throw new Error("Sesión no válida");
  const user = (await userResponse.json()) as { id: string };

  const profileResponse = await fetch(
    supabaseUrl + "/rest/v1/profiles?id=eq." + encodeURIComponent(user.id) + "&select=role,activo&limit=1",
    {
      headers: { apikey: serviceKey, Authorization: "Bearer " + serviceKey },
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

async function createSignedUpload(payload: UploadPayload) {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");

  const kind = String(payload.kind || "");
  const fileType = String(payload.fileType || "");
  const fileSize = Number(payload.fileSize || 0);
  const exerciseName = String(payload.exerciseName || "ejercicio");

  if (!allowedKinds.has(kind)) {
    return NextResponse.json({ ok: false, error: "Tipo de recurso no válido" }, { status: 400 });
  }
  if (!allowedMime.has(fileType)) {
    return NextResponse.json({ ok: false, error: "Formato no permitido" }, { status: 400 });
  }
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    return NextResponse.json({ ok: false, error: "El archivo está vacío o no es válido" }, { status: 400 });
  }
  if (fileSize > maxSizeFor(kind)) {
    return NextResponse.json(
      { ok: false, error: kind === "video" ? "El vídeo supera 50 MB" : "La imagen supera 12 MB" },
      { status: 400 }
    );
  }

  const extension = extensionByMime[fileType];
  const path =
    slugify(exerciseName) +
    "/" +
    kind +
    "-" +
    Date.now() +
    "-" +
    crypto.randomUUID().slice(0, 8) +
    "." +
    extension;

  const signResponse = await fetch(
    supabaseUrl + "/storage/v1/object/upload/sign/" + bucket + "/" + encodeURI(path),
    {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: "Bearer " + serviceKey,
        "Content-Type": "application/json",
        "x-upsert": "false",
      },
      body: "{}",
      cache: "no-store",
    }
  );

  const signText = await signResponse.text();
  if (!signResponse.ok) {
    throw new Error(signText || "No se pudo autorizar la subida");
  }

  let signedData: { url?: string };
  try {
    signedData = JSON.parse(signText) as { url?: string };
  } catch {
    throw new Error("Supabase devolvió una autorización de subida no válida");
  }
  if (!signedData.url) throw new Error("Supabase no devolvió la URL de subida");

  const signedUrl = signedData.url.startsWith("http")
    ? signedData.url
    : supabaseUrl + "/storage/v1" + (signedData.url.startsWith("/") ? "" : "/") + signedData.url;

  return NextResponse.json({
    ok: true,
    data: { signedUrl, path, publicUrl: publicUrlForPath(path) },
  });
}

async function finalizeUpload(payload: UploadPayload) {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");

  const kind = String(payload.kind || "");
  const path = String(payload.path || "");
  const exerciseId = String(payload.exerciseId || "").trim();

  if (!allowedKinds.has(kind) || !isValidGeneratedPath(path, kind)) {
    return NextResponse.json({ ok: false, error: "La referencia del archivo no es válida" }, { status: 400 });
  }

  const publicUrl = publicUrlForPath(path);
  const objectResponse = await fetch(publicUrl, { method: "HEAD", cache: "no-store" });
  if (!objectResponse.ok) {
    return NextResponse.json(
      { ok: false, error: "La subida no se completó. Inténtalo de nuevo." },
      { status: 400 }
    );
  }

  if (exerciseId) {
    const field = fieldByKind[kind];
    const saveResponse = await fetch(
      supabaseUrl + "/rest/v1/ejercicios?id=eq." + encodeURIComponent(exerciseId),
      {
        method: "PATCH",
        headers: {
          apikey: serviceKey,
          Authorization: "Bearer " + serviceKey,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ [field]: publicUrl }),
        cache: "no-store",
      }
    );
    if (!saveResponse.ok) {
      const saveError = await saveResponse.text();
      throw new Error(saveError || "La imagen se subió, pero no pudo vincularse al ejercicio");
    }
  }

  return NextResponse.json({
    ok: true,
    data: { kind, path, url: publicUrl, saved: Boolean(exerciseId) },
  });
}

export async function POST(request: NextRequest) {
  try {
    await assertProfessional();

    let payload: UploadPayload;
    try {
      payload = (await request.json()) as UploadPayload;
    } catch {
      return NextResponse.json(
        { ok: false, error: "La solicitud de subida no es válida" },
        { status: 400 }
      );
    }

    if (payload.action === "sign") return createSignedUpload(payload);
    if (payload.action === "finalize") return finalizeUpload(payload);

    return NextResponse.json({ ok: false, error: "Acción de subida no válida" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al subir el archivo";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    console.error("[exercise-media] upload failed", { message });
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
