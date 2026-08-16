import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

type AccessRole = "profesional" | "cliente";

function base64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function loginError(request: NextRequest, message: string) {
  const url = new URL("/login", request.url);
  url.searchParams.set("oauthError", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const accessRole = request.nextUrl.searchParams.get("role") as AccessRole | null;

  if (!supabaseUrl) {
    return loginError(request, "Google no está configurado en Chetesaí");
  }

  if (accessRole !== "profesional" && accessRole !== "cliente") {
    return loginError(request, "Selecciona un tipo de acceso válido");
  }

  const verifier = base64Url(randomBytes(64));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");
  const callbackUrl = `${appUrl}/api/auth/google/callback`;

  const authorizeUrl = new URL(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/authorize`);
  authorizeUrl.searchParams.set("provider", "google");
  authorizeUrl.searchParams.set("redirect_to", callbackUrl);
  authorizeUrl.searchParams.set("code_challenge", challenge);
  authorizeUrl.searchParams.set("code_challenge_method", "s256");

  // Resolve the Supabase authorization endpoint server-side so configuration
  // errors do not strand the user on a raw JSON response from Supabase.
  const authResponse = await fetch(authorizeUrl, {
    method: "GET",
    headers: anonKey ? { apikey: anonKey } : undefined,
    redirect: "manual",
    cache: "no-store",
  });

  if (authResponse.status < 300 || authResponse.status >= 400) {
    let message = "No se pudo iniciar el acceso con Google";
    try {
      const data = (await authResponse.json()) as {
        msg?: string;
        message?: string;
        error_description?: string;
      };
      const raw = data.error_description || data.msg || data.message || "";
      if (/provider.*not enabled|unsupported provider/i.test(raw)) {
        message = "Google todavía no está habilitado en Supabase";
      } else if (raw) {
        message = raw;
      }
    } catch {
      // Keep the friendly generic message.
    }
    return loginError(request, message);
  }

  const providerLocation = authResponse.headers.get("location");
  if (!providerLocation) {
    return loginError(request, "Google no devolvió una URL de autorización válida");
  }

  const response = NextResponse.redirect(providerLocation);
  const secure = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
  };

  response.cookies.set("chetesai_google_pkce_verifier", verifier, cookieOptions);
  response.cookies.set("chetesai_google_access_role", accessRole, cookieOptions);

  return response;
}
