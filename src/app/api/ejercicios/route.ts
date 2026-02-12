import { NextRequest, NextResponse } from "next/server";
import { totalumSdk } from "@/lib/totalum";

export async function GET() {
  try {
    const result = await totalumSdk.crud.getRecords("ejercicio", {
      sort: { nombre: 1 },
    });
    console.log("[API] GET /api/ejercicios - fetched", result.data?.length ?? 0, "exercises");
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] GET /api/ejercicios error:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener ejercicios" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    console.log("[API] POST /api/ejercicios - creating exercise:", body.nombre);
    const result = await totalumSdk.crud.createRecord("ejercicio", body);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] POST /api/ejercicios error:", error);
    return NextResponse.json({ ok: false, error: "Error al crear ejercicio" }, { status: 500 });
  }
}
