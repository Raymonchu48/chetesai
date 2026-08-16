import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../../lib/supabase-rest";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type ClienteRow = {
  id: string;
  nombre: string;
  email: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  role: string;
  activo: boolean;
};

async function assertProfessional() {
  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error("Supabase no está configurado");
  }

  const store = await cookies();
  const token = store.get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!userResponse.ok) throw new Error("Sesión no válida");
  const user = (await userResponse.json()) as { id?: string };
  if (!user.id) throw new Error("Sesión no válida");

  const profiles = await supabaseRest<Array<{ role: string; activo: boolean }>>(
    `profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo&limit=1`
  );
  const profile = profiles[0];

  if (!profile || profile.activo === false || !["administrador", "profesional"].includes(profile.role)) {
    throw new Error("No autorizado");
  }
}

function createTemporaryPassword() {
  return `Cht!${randomBytes(18).toString("base64url")}9a`;
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await assertProfessional();
    const { id } = await params;

    const clients = await supabaseRest<ClienteRow[]>(
      `clientes?id=eq.${encodeURIComponent(id)}&select=id,nombre,email&limit=1`
    );
    const client = clients[0];
    if (!client) {
      return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    }

    const email = String(client.email || "").trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { ok: false, error: "El cliente necesita un correo electrónico válido antes de crear su acceso" },
        { status: 400 }
      );
    }

    const existingProfiles = await supabaseRest<ProfileRow[]>(
      `profiles?email=eq.${encodeURIComponent(email)}&select=id,email,role,activo&limit=1`
    );

    if (existingProfiles[0]) {
      const existing = existingProfiles[0];
      const message = existing.role === "cliente"
        ? "Este cliente ya tiene una cuenta de acceso. Si no recuerda la contraseña, puede usar ‘¿Olvidaste tu contraseña?’ en el login."
        : "Este correo ya pertenece a una cuenta profesional y no puede reutilizarse como acceso de cliente.";
      return NextResponse.json({ ok: false, error: message, alreadyExists: true }, { status: 409 });
    }

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Supabase no está configurado");
    }

    const temporaryPassword = createTemporaryPassword();
    const createResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          nombre: client.nombre,
        },
      }),
      cache: "no-store",
    });

    const raw = await createResponse.text();
    let createdUser: { id?: string; message?: string; msg?: string } = {};
    if (raw) {
      try {
        createdUser = JSON.parse(raw) as typeof createdUser;
      } catch {
        createdUser = {};
      }
    }

    if (!createResponse.ok || !createdUser.id) {
      const detail = createdUser.message || createdUser.msg || "No se pudo crear la cuenta del cliente";
      const duplicate = /already|registered|exists/i.test(detail);
      return NextResponse.json(
        {
          ok: false,
          error: duplicate
            ? "Ya existe una cuenta de autenticación con este correo. Usa recuperación de contraseña o revisa la cuenta existente."
            : detail,
          alreadyExists: duplicate,
        },
        { status: duplicate ? 409 : createResponse.status || 500 }
      );
    }

    await supabaseRest<ProfileRow[]>("profiles?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        id: createdUser.id,
        email,
        nombre: client.nombre,
        role: "cliente",
        activo: true,
        updated_at: new Date().toISOString(),
      }),
    });

    const verified = await supabaseRest<ProfileRow[]>(
      `profiles?id=eq.${encodeURIComponent(createdUser.id)}&role=eq.cliente&activo=eq.true&select=id,email,role,activo&limit=1`
    );

    if (!verified[0]) {
      return NextResponse.json(
        { ok: false, error: "La cuenta se creó, pero no se pudo verificar el perfil de cliente" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: {
        email,
        temporaryPassword,
        loginUrl: "https://www.chetesaifitness.com/login",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al crear el acceso del cliente";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    console.error("[API] POST /api/clientes/[id]/acceso error:", error);
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
