import { NextRequest, NextResponse } from "next/server";
import { totalumSdk } from "@/lib/totalum";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    console.log("[API] PUT /api/ejercicios/" + id, "- updating");
    const result = await totalumSdk.crud.editRecordById("ejercicio", id, body);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] PUT /api/ejercicios/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Error al actualizar ejercicio" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    console.log("[API] DELETE /api/ejercicios/" + id);
    const result = await totalumSdk.crud.deleteRecordById("ejercicio", id);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] DELETE /api/ejercicios/[id] error:", error);
    return NextResponse.json({ ok: false, error: "Error al eliminar ejercicio" }, { status: 500 });
  }
}
