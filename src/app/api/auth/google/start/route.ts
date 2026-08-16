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

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const accessRole = request.nextUrl.searchParams.get("role") as AccessRole | null;

  if (!supabaseUrl) {
    return NextResponse.redirect(
      new URL("/login?oauthError=Google%20no%20est%C3%A1%20configurado", request.url)
    );
  }

  if (accessRole !== "profesional" && accessRole !== "cliente") {
    return NextResponse.redirect(
      new URL("/login?oauthError=Selecciona%20un%20tipo%20de%20acceso%20v%C3%A1lido", request.url)
    );
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

  const response = NextResponse.redirect(authorizeUrl);
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
