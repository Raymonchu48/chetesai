import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../lib/supabase-rest";

type ClienteRow = {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  fecha_nacimiento: string | null;
  objetivo: string;
  estado: string;
  fecha_alta: string;
  notas: string | null;
};

function toCliente(row: ClienteRow) {
  return { ...row, _id: row.id };
}

function normalizeClientePayload(body: Record<string, unknown>) {
  return {
    ...body,
    nombre: String(body.nombre || "").trim(),
    email: body.email ? String(body.email).trim() : null,
    telefono: body.telefono ? String(body.telefono).trim() : null,
    fecha_nacimiento: body.fecha_nacimiento || null,
    fecha_alta: body.fecha_alta || new Date().toISOString().slice(0, 10),
    notas: body.notas ? String(body.notas).trim() : null,
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await supabaseRest<ClienteRow[]>(
      `clientes?id=eq.${encodeURIComponent(id)}&select=*`
    );
    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: toCliente(rows[0]) });
  } catch (error) {
    console.error("[API] GET /api/clientes/[id] error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al obtener cliente" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    const payload = normalizeClientePayload(body);

    if (!payload.nombre) {
      return NextResponse.json({ ok: false, error: "El nombre es obligatorio" }, { status: 400 });
    }

    const rows = await supabaseRest<ClienteRow[]>(
      `clientes?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify(payload),
      }
    );
    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Cliente no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, data: toCliente(rows[0]) });
  } catch (error) {
    console.error("[API] PUT /api/clientes/[id] error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al actualizar cliente" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await supabaseRest<ClienteRow[]>(
      `clientes?id=eq.${encodeURIComponent(id)}`,
      { method: "DELETE", headers: { Prefer: "return=representation" } }
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[API] DELETE /api/clientes/[id] error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al eliminar cliente" },
      { status: 500 }
    );
  }
}
