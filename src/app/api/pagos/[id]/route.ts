import { NextRequest, NextResponse } from "next/server";
import { totalumSdk } from "@/lib/totalum";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    console.log("[API] PUT /api/pagos/" + id, "- updating");
    const result = await totalumSdk.crud.editRecordById("pago", id, body);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] PUT /api/pagos/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Error al actualizar pago" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log("[API] DELETE /api/pagos/" + id);
    const result = await totalumSdk.crud.deleteRecordById("pago", id);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] DELETE /api/pagos/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Error al eliminar pago" }, { status: 500 });
  }
}
