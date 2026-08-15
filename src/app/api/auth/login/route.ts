import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type AccessRole = "profesional" | "cliente";

export async function POST(request: NextRequest) {
  try {
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { ok: false, error: "Supabase no está configurado" },
        { status: 500 }
      );
    }

    const { email, password, accessRole } = (await request.json()) as {
      email?: string;
      password?: string;
      accessRole?: AccessRole;
    };

    if (!email?.trim() || !password) {
      return NextResponse.json(
        { ok: false, error: "Correo y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    if (accessRole && accessRole !== "profesional" && accessRole !== "cliente") {
      return NextResponse.json(
        { ok: false, error: "Tipo de acceso no válido" },
        { status: 400 }
      );
    }

    const authResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        cache: "no-store",
      }
    );

    const authData = (await authResponse.json()) as any;

    if (!authResponse.ok) {
      return NextResponse.json(
        { ok: false, error: authData?.error_description || authData?.msg || "Credenciales incorrectas" },
        { status: 401 }
      );
    }

    const profileResponse = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/profiles?id=eq.${encodeURIComponent(authData.user.id)}&select=id,email,nombre,role,activo`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${authData.access_token}`,
        },
        cache: "no-store",
      }
    );

    const profiles = profileResponse.ok ? await profileResponse.json() : [];
    const profile = profiles?.[0] ?? null;

    if (profile && profile.activo === false) {
      return NextResponse.json(
        { ok: false, error: "La cuenta está desactivada" },
        { status: 403 }
      );
    }

    const role = profile?.role || "cliente";
    const isClientAccount = role === "cliente";

    if (accessRole === "cliente" && !isClientAccount) {
      return NextResponse.json(
        { ok: false, error: "Esta cuenta corresponde al acceso profesional. Selecciona Profesional." },
        { status: 403 }
      );
    }

    if (accessRole === "profesional" && isClientAccount) {
      return NextResponse.json(
        { ok: false, error: "Esta cuenta corresponde al acceso de cliente. Selecciona Cliente." },
        { status: 403 }
      );
    }

    const redirectTo = isClientAccount ? "/portal" : "/dashboard";

    const response = NextResponse.json({
      ok: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        nombre: profile?.nombre || authData.user.email,
        role,
      },
      redirectTo,
    });

    const secure = process.env.NODE_ENV === "production";
    response.cookies.set("chetesai_access_token", authData.access_token, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: authData.expires_in || 3600,
    });

    if (authData.refresh_token) {
      response.cookies.set("chetesai_refresh_token", authData.refresh_token, {
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (error) {
    console.error("[API] POST /api/auth/login error:", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo iniciar sesión" },
      { status: 500 }
    );
  }
}
