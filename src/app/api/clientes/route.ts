import { NextRequest, NextResponse } from "next/server";
import { totalumSdk } from "@/lib/totalum";

export async function GET() {
  try {
    const result = await totalumSdk.crud.getRecords("cliente", {
      sort: { createdAt: -1 },
    });
    console.log("[API] GET /api/clientes - fetched", result.data?.length ?? 0, "clients");
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] GET /api/clientes error:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener clientes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    console.log("[API] POST /api/clientes - creating client:", body.nombre);
    const result = await totalumSdk.crud.createRecord("cliente", body);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] POST /api/clientes error:", error);
    return NextResponse.json({ ok: false, error: "Error al crear cliente" }, { status: 500 });
  }
}
