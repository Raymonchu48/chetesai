import { NextRequest, NextResponse } from "next/server";
import { totalumSdk } from "@/lib/totalum";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await totalumSdk.crud.getRecordById("sesion", id);
    console.log("[API] GET /api/sesiones/" + id);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] GET /api/sesiones/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener sesion" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    console.log("[API] PUT /api/sesiones/" + id, "- updating");
    const result = await totalumSdk.crud.editRecordById("sesion", id, body);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] PUT /api/sesiones/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Error al actualizar sesion" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log("[API] DELETE /api/sesiones/" + id);
    const result = await totalumSdk.crud.deleteRecordById("sesion", id);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] DELETE /api/sesiones/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Error al eliminar sesion" }, { status: 500 });
  }
}
