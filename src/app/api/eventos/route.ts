import { NextRequest, NextResponse } from "next/server";
import {
  assertProfessional,
  EventRow,
  RegistrationRow,
  serviceRequest,
} from "@/lib/events-server";

type EventInput = {
  titulo?: string;
  categoria?: string;
  descripcion?: string | null;
  fecha_inicio?: string;
  fecha_fin?: string | null;
  modalidad?: string;
  ubicacion?: string | null;
  enlace_online?: string | null;
  imagen_url?: string | null;
  aforo?: number;
  precio?: number;
  fecha_limite_inscripcion?: string | null;
  estado?: string;
};

const categories = new Set(["pilates", "running", "nutricion", "senderismo", "movilidad", "taller", "otro"]);
const modalities = new Set(["presencial", "online", "mixta"]);

function normalizeInput(body: EventInput) {
  const title = String(body.titulo || "").trim();
  const start = String(body.fecha_inicio || "").trim();
  if (!title) throw new Error("El título es obligatorio");
  if (!start || Number.isNaN(new Date(start).getTime())) throw new Error("La fecha de inicio no es válida");

  const category = categories.has(String(body.categoria)) ? String(body.categoria) : "otro";
  const modality = modalities.has(String(body.modalidad)) ? String(body.modalidad) : "presencial";
  const capacity = Math.max(1, Math.min(500, Number(body.aforo || 20)));
  const price = Math.max(0, Number(body.precio || 0));

  return {
    titulo: title,
    categoria: category,
    descripcion: body.descripcion ? String(body.descripcion).trim() : null,
    fecha_inicio: new Date(start).toISOString(),
    fecha_fin: body.fecha_fin ? new Date(body.fecha_fin).toISOString() : null,
    modalidad: modality,
    ubicacion: body.ubicacion ? String(body.ubicacion).trim() : null,
    enlace_online: body.enlace_online ? String(body.enlace_online).trim() : null,
    imagen_url: body.imagen_url ? String(body.imagen_url).trim() : null,
    aforo: capacity,
    precio: price,
    fecha_limite_inscripcion: body.fecha_limite_inscripcion
      ? new Date(body.fecha_limite_inscripcion).toISOString()
      : null,
    estado: body.estado === "publicado" ? "publicado" : "borrador",
    updated_at: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    await assertProfessional();
    const [events, registrations, communications] = await Promise.all([
      serviceRequest<EventRow[]>("eventos?select=*&order=fecha_inicio.asc"),
      serviceRequest<RegistrationRow[]>(
        "inscripciones_eventos?select=id,evento_id,cliente_id,estado,origen,notas,fecha_inscripcion,updated_at,clientes(id,nombre,email,telefono)&order=fecha_inscripcion.asc"
      ),
      serviceRequest<Array<{ evento_id: string; tipo: string; estado: string; enviado_at: string }>>(
        "eventos_comunicaciones?select=evento_id,tipo,estado,enviado_at&order=enviado_at.desc"
      ),
    ]);

    return NextResponse.json({ ok: true, data: { eventos: events, inscripciones: registrations, comunicaciones: communications } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar los eventos";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await assertProfessional();
    const body = (await request.json()) as EventInput;
    const payload = normalizeInput(body);
    const now = new Date().toISOString();
    const rows = await serviceRequest<EventRow[]>("eventos", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        ...payload,
        created_by: user.id,
        created_at: now,
        publicado_at: payload.estado === "publicado" ? now : null,
      }),
    });
    return NextResponse.json({ ok: true, data: rows[0] }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear el evento";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
