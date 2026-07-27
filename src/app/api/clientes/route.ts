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

export async function GET() {
  try {
    const rows = await supabaseRest<ClienteRow[]>(
      "clientes?select=*&order=created_at.desc"
    );
    return NextResponse.json({ ok: true, data: rows.map(toCliente) });
  } catch (error) {
    console.error("[API] GET /api/clientes error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!String(body.nombre || "").trim()) {
      return NextResponse.json({ ok: false, error: "El nombre es obligatorio" }, { status: 400 });
    }

    const rows = await supabaseRest<ClienteRow[]>("clientes", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(body),
    });

    return NextResponse.json({ ok: true, data: rows[0] ? toCliente(rows[0]) : null });
  } catch (error) {
    console.error("[API] POST /api/clientes error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al crear cliente" },
      { status: 500 }
    );
  }
}
