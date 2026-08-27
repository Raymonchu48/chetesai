import { NextRequest, NextResponse } from "next/server";

type AccessRole = "profesional" | "cliente";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: {
    id?: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  error?: string;
  error_description?: string;
  msg?: string;
};

function publicAppUrl(request: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(configured)) {
    return configured.replace(/\/$/, "");
  }
  return request.nextUrl.origin.replace(/\/$/, "");
}

function loginError(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("oauthError", message);
  const response = NextResponse.redirect(url);
  response.cookies.delete("chetesai_google_pkce_verifier");
  response.cookies.delete("chetesai_google_access_role");
  return response;
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return loginError(request, "Supabase no está configurado para Google");
  }

  const oauthError = request.nextUrl.searchParams.get("error_description") || request.nextUrl.searchParams.get("error");
  if (oauthError) {
    return loginError(request, oauthError);
  }

  const code = request.nextUrl.searchParams.get("code");
  const verifier = request.cookies.get("chetesai_google_pkce_verifier")?.value;
  const accessRole = request.cookies.get("chetesai_google_access_role")?.value as AccessRole | undefined;

  if (!code || !verifier || (accessRole !== "profesional" && accessRole !== "cliente")) {
    return loginError(request, "La sesión de Google ha caducado. Inténtalo de nuevo.");
  }

  const tokenResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=pkce`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
      cache: "no-store",
    }
  );

  const tokenData = (await tokenResponse.json()) as TokenResponse;
  if (!tokenResponse.ok || !tokenData.access_token || !tokenData.user?.id) {
    return loginError(
      request,
      tokenData.error_description || tokenData.msg || tokenData.error || "No se pudo completar el acceso con Google"
    );
  }

  const accessToken = tokenData.access_token;
  const userId = tokenData.user.id;
  const email = tokenData.user.email || "";

  const profileResponse = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,email,nombre,role,activo`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  const profiles = profileResponse.ok ? await profileResponse.json() : [];
  let profile = profiles?.[0] ?? null;

  if (profile?.activo === false) {
    return loginError(request, "La cuenta está desactivada");
  }

  // Never allow a new Google account to self-promote to a professional role.
  if (!profile && accessRole === "profesional") {
    return loginError(
      request,
      "Esta cuenta de Google no está autorizada como profesional. Usa una cuenta profesional existente o selecciona Cliente."
    );
  }

  // For a new Google client, create the basic profile on a best-effort basis.
  if (!profile && accessRole === "cliente") {
    const metadata = tokenData.user.user_metadata || {};
    const displayName =
      (typeof metadata.full_name === "string" && metadata.full_name) ||
      (typeof metadata.name === "string" && metadata.name) ||
      email;

    const createProfileResponse = await fetch(`${supabaseUrl.replace(/\/$/, "")}/rest/v1/profiles`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        id: userId,
        email,
        nombre: displayName,
        role: "cliente",
        activo: true,
      }),
      cache: "no-store",
    });

    if (createProfileResponse.ok) {
      const createdProfiles = await createProfileResponse.json();
      profile = createdProfiles?.[0] ?? null;
    }
  }

  const role = profile?.role || "cliente";
  const isClientAccount = role === "cliente";

  if (accessRole === "cliente" && !isClientAccount) {
    return loginError(request, "Esta cuenta corresponde al acceso profesional. Selecciona Profesional.");
  }

  if (accessRole === "profesional" && isClientAccount) {
    return loginError(request, "Esta cuenta corresponde al acceso de cliente. Selecciona Cliente.");
  }

  const appUrl = publicAppUrl(request);
  const response = NextResponse.redirect(`${appUrl}${isClientAccount ? "/portal" : "/dashboard"}`);
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set("chetesai_access_token", accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: tokenData.expires_in || 3600,
  });

  if (tokenData.refresh_token) {
    response.cookies.set("chetesai_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  response.cookies.delete("chetesai_google_pkce_verifier");
  response.cookies.delete("chetesai_google_access_role");

  return response;
}
