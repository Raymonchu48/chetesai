import { NextRequest, NextResponse } from "next/server";
import { totalumSdk } from "@/lib/totalum";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await totalumSdk.crud.getRecordById("cliente", id);
    console.log("[API] GET /api/clientes/" + id);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] GET /api/clientes/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener cliente" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    console.log("[API] PUT /api/clientes/" + id, "- updating");
    const result = await totalumSdk.crud.editRecordById("cliente", id, body);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] PUT /api/clientes/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Error al actualizar cliente" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log("[API] DELETE /api/clientes/" + id);
    const result = await totalumSdk.crud.deleteRecordById("cliente", id);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] DELETE /api/clientes/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Error al eliminar cliente" }, { status: 500 });
  }
}
