import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../lib/supabase-rest";

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

type SolicitudRow = {
  id: string;
  nombre: string;
  email: string;
  telefono: string | null;
  objetivo: string | null;
  mensaje: string | null;
  cliente_id: string | null;
};

function toCliente(row: ClienteRow) {
  return { ...row, _id: row.id };
}

function normalizeClientePayload(body: Record<string, unknown>) {
  return {
    ...body,
    nombre: String(body.nombre || "").trim(),
    email: body.email ? String(body.email).trim().toLowerCase() : null,
    telefono: body.telefono ? String(body.telefono).trim() : null,
    fecha_nacimiento: body.fecha_nacimiento || null,
    fecha_alta: body.fecha_alta || new Date().toISOString().slice(0, 10),
    notas: body.notas ? String(body.notas).trim() : null,
  };
}

function normalizeEmail(value: string | null | undefined) {
  return String(value || "").trim().toLowerCase();
}

async function synchronizeProspectiveClients(existingRows: ClienteRow[]) {
  const requests = await supabaseRest<SolicitudRow[]>(
    "solicitudes_reserva?cliente_id=is.null&select=id,nombre,email,telefono,objetivo,mensaje,cliente_id&order=created_at.asc"
  );

  if (!requests.length) return existingRows;

  const rows = [...existingRows];
  const clientsByEmail = new Map(
    rows
      .filter((client) => normalizeEmail(client.email))
      .map((client) => [normalizeEmail(client.email), client])
  );

  for (const request of requests) {
    const email = normalizeEmail(request.email);
    if (!email) continue;

    let client = clientsByEmail.get(email);

    if (!client) {
      const notes = [
        "Cliente potencial generado desde una solicitud web.",
        request.objetivo ? `Objetivo: ${request.objetivo}` : "",
        request.mensaje ? `Comentario: ${request.mensaje}` : "",
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 2000);

      const createdRows = await supabaseRest<ClienteRow[]>("clientes", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          nombre: String(request.nombre || "Cliente potencial").trim(),
          email,
          telefono: request.telefono ? String(request.telefono).trim() : null,
          objetivo: "bienestar_general",
          estado: "prueba",
          fecha_alta: new Date().toISOString().slice(0, 10),
          notas: notes || null,
        }),
      });

      client = createdRows[0];
      if (!client) continue;

      rows.unshift(client);
      clientsByEmail.set(email, client);
    }

    await supabaseRest(
      `solicitudes_reserva?id=eq.${encodeURIComponent(request.id)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ cliente_id: client.id }),
      }
    );
  }

  return rows;
}

export async function GET() {
  try {
    const existingRows = await supabaseRest<ClienteRow[]>(
      "clientes?select=*&order=created_at.desc"
    );
    const rows = await synchronizeProspectiveClients(existingRows);
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
    const payload = normalizeClientePayload(body);

    if (!payload.nombre) {
      return NextResponse.json({ ok: false, error: "El nombre es obligatorio" }, { status: 400 });
    }

    const rows = await supabaseRest<ClienteRow[]>("clientes", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
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
