import { NextRequest, NextResponse } from "next/server";

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
  msg?: string;
};

const INVALID_LINK_MESSAGE =
  "El enlace de recuperación ha caducado o ya se ha utilizado. Solicita uno nuevo.";

function recoveryError(request: NextRequest, message: string) {
  const url = new URL("/forgot-password", request.url);
  url.searchParams.set("error", message);
  const response = NextResponse.redirect(url);
  response.cookies.delete("chetesai_recovery_pkce_verifier");
  return response;
}

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return recoveryError(request, "El servicio de recuperación no está configurado");
  }

  const callbackError =
    request.nextUrl.searchParams.get("error_description") ||
    request.nextUrl.searchParams.get("error");
  if (callbackError) {
    return recoveryError(request, INVALID_LINK_MESSAGE);
  }

  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const verificationType = request.nextUrl.searchParams.get("type");
  const code = request.nextUrl.searchParams.get("code");
  const verifier = request.cookies.get("chetesai_recovery_pkce_verifier")?.value;

  let tokenResponse: Response;
  if (tokenHash && verificationType === "recovery") {
    tokenResponse = await fetch(`${supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token_hash: tokenHash, type: "recovery" }),
      cache: "no-store",
    });
  } else if (code && verifier) {
    tokenResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=pkce`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
      cache: "no-store",
    });
  } else {
    return recoveryError(request, INVALID_LINK_MESSAGE);
  }

  const tokenData = (await tokenResponse.json()) as TokenResponse;
  if (!tokenResponse.ok || !tokenData.access_token) {
    return recoveryError(request, INVALID_LINK_MESSAGE);
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");
  const response = NextResponse.redirect(`${appUrl}/reset-password`);
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set("chetesai_access_token", tokenData.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: Math.min(tokenData.expires_in || 3600, 60 * 30),
  });

  if (tokenData.refresh_token) {
    response.cookies.set("chetesai_refresh_token", tokenData.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 30,
    });
  }

  response.cookies.set("chetesai_password_recovery", "1", {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 30,
  });

  response.cookies.delete("chetesai_recovery_pkce_verifier");
  return response;
}
