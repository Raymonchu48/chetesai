import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

function base64Url(input: Buffer) {
  return input
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "El servicio de recuperación no está configurado" },
      { status: 500 }
    );
  }

  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = body.email?.trim().toLowerCase() || "";
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud no válida" }, { status: 400 });
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Introduce un correo electrónico válido" },
      { status: 400 }
    );
  }

  const verifier = base64Url(randomBytes(64));
  const challenge = base64Url(createHash("sha256").update(verifier).digest());
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin).replace(/\/$/, "");
  const callbackUrl = `${appUrl}/api/auth/password-recovery/callback`;

  const recoveryUrl = new URL(`${supabaseUrl}/auth/v1/recover`);
  recoveryUrl.searchParams.set("redirect_to", callbackUrl);

  const recoveryResponse = await fetch(recoveryUrl, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      code_challenge: challenge,
      code_challenge_method: "s256",
    }),
    cache: "no-store",
  });

  if (!recoveryResponse.ok) {
    let message = "No se pudo enviar el correo de recuperación";
    try {
      const errorData = (await recoveryResponse.json()) as {
        msg?: string;
        message?: string;
        error_description?: string;
      };
      message = errorData.error_description || errorData.msg || errorData.message || message;
    } catch {
      // Keep the generic message.
    }

    if (recoveryResponse.status === 429) {
      message = "Has solicitado varios correos recientemente. Espera un minuto y vuelve a intentarlo.";
    }

    return NextResponse.json({ ok: false, error: message }, { status: recoveryResponse.status });
  }

  const response = NextResponse.json({
    ok: true,
    message: "Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña.",
  });

  response.cookies.set("chetesai_recovery_pkce_verifier", verifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}
