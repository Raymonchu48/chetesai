import { NextRequest, NextResponse } from "next/server";

type AppRole = "administrador" | "profesional" | "cliente";

type SessionResult = {
  valid: boolean;
  role?: AppRole;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function getProfileRole(accessToken: string): Promise<AppRole | null> {
  if (!supabaseUrl || !anonKey) return null;

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!userResponse.ok) return null;

  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) return null;

  const profileResponse = await fetch(
    `${supabaseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!profileResponse.ok) return null;

  const profiles = (await profileResponse.json()) as Array<{
    role?: AppRole;
    activo?: boolean;
  }>;
  const profile = profiles[0];

  if (!profile || profile.activo === false) return null;
  return profile.role ?? "cliente";
}

async function validateSession(request: NextRequest): Promise<SessionResult> {
  if (!supabaseUrl || !anonKey) return { valid: false };

  const accessToken = request.cookies.get("chetesai_access_token")?.value;
  const refreshToken = request.cookies.get("chetesai_refresh_token")?.value;

  if (accessToken) {
    const role = await getProfileRole(accessToken);
    if (role) return { valid: true, role, accessToken };
  }

  if (!refreshToken) return { valid: false };

  const refreshResponse = await fetch(
    `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    }
  );

  if (!refreshResponse.ok) return { valid: false };

  const refreshed = (await refreshResponse.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  if (!refreshed.access_token) return { valid: false };

  const role = await getProfileRole(refreshed.access_token);
  if (!role) return { valid: false };

  return {
    valid: true,
    role,
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token ?? refreshToken,
    expiresIn: refreshed.expires_in ?? 3600,
  };
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.set("chetesai_access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  response.cookies.set("chetesai_refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

function persistRefreshedSession(response: NextResponse, session: SessionResult) {
  if (!session.accessToken || !session.refreshToken) return;

  const secure = process.env.NODE_ENV === "production";
  response.cookies.set("chetesai_access_token", session.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: session.expiresIn ?? 3600,
  });
  response.cookies.set("chetesai_refresh_token", session.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await validateSession(request);

  if (pathname === "/login") {
    if (!session.valid || !session.role) return NextResponse.next();

    const destination = session.role === "cliente" ? "/portal" : "/dashboard";
    const response = NextResponse.redirect(new URL(destination, request.url));
    persistRefreshedSession(response, session);
    return response;
  }

  if (!session.valid || !session.role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    clearSessionCookies(response);
    return response;
  }

  if (pathname.startsWith("/dashboard") && session.role === "cliente") {
    const response = NextResponse.redirect(new URL("/portal", request.url));
    persistRefreshedSession(response, session);
    return response;
  }

  if (pathname.startsWith("/portal") && session.role !== "cliente") {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    persistRefreshedSession(response, session);
    return response;
  }

  const response = NextResponse.next();
  persistRefreshedSession(response, session);
  return response;
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/portal/:path*"],
};
