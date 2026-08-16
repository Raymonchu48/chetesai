import { NextRequest, NextResponse } from "next/server";

function clearRecoveryCookies(response: NextResponse) {
  const secure = process.env.NODE_ENV === "production";
  const expired = {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
  response.cookies.set("chetesai_access_token", "", expired);
  response.cookies.set("chetesai_refresh_token", "", expired);
  response.cookies.set("chetesai_password_recovery", "", expired);
  response.cookies.set("chetesai_recovery_pkce_verifier", "", expired);
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const accessToken = request.cookies.get("chetesai_access_token")?.value;
  const isRecovery = request.cookies.get("chetesai_password_recovery")?.value === "1";

  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { ok: false, error: "El servicio de recuperación no está configurado" },
      { status: 500 }
    );
  }

  if (!accessToken || !isRecovery) {
    return NextResponse.json(
      { ok: false, error: "El enlace de recuperación ha caducado. Solicita uno nuevo." },
      { status: 401 }
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password || "";
  } catch {
    return NextResponse.json({ ok: false, error: "Solicitud no válida" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "La nueva contraseña debe tener al menos 8 caracteres" },
      { status: 400 }
    );
  }

  if (password.length > 128) {
    return NextResponse.json(
      { ok: false, error: "La contraseña es demasiado larga" },
      { status: 400 }
    );
  }

  const updateResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password }),
    cache: "no-store",
  });

  if (!updateResponse.ok) {
    let message = "No se pudo actualizar la contraseña";
    try {
      const errorData = (await updateResponse.json()) as {
        msg?: string;
        message?: string;
        error_description?: string;
        error_code?: string;
      };
      message = errorData.error_description || errorData.msg || errorData.message || message;
      if (errorData.error_code === "same_password") {
        message = "La nueva contraseña debe ser diferente de la anterior.";
      }
    } catch {
      // Keep generic message.
    }
    return NextResponse.json({ ok: false, error: message }, { status: updateResponse.status });
  }

  const response = NextResponse.json({
    ok: true,
    message: "Contraseña actualizada correctamente. Ya puedes iniciar sesión.",
    redirectTo: "/login?passwordReset=1",
  });
  clearRecoveryCookies(response);
  return response;
}
