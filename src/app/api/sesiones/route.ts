import { NextRequest, NextResponse } from "next/server";
import { totalumSdk } from "@/lib/totalum";

export async function GET() {
  try {
    const result = await totalumSdk.crud.getRecords("sesion", {
      sort: { fecha: -1 },
    });
    console.log("[API] GET /api/sesiones - fetched", result.data?.length ?? 0, "sessions");
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] GET /api/sesiones error:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener sesiones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    console.log("[API] POST /api/sesiones - creating session:", body.titulo);
    const result = await totalumSdk.crud.createRecord("sesion", body);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] POST /api/sesiones error:", error);
    return NextResponse.json({ ok: false, error: "Error al crear sesion" }, { status: 500 });
  }
}
