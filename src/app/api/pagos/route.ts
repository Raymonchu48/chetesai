import { NextRequest, NextResponse } from "next/server";
import { totalumSdk } from "@/lib/totalum";

export async function GET() {
  try {
    const result = await totalumSdk.crud.getRecords("pago", {
      sort: { fecha_pago: -1 },
    });
    console.log("[API] GET /api/pagos - fetched", result.data?.length ?? 0, "payments");
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] GET /api/pagos error:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener pagos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    console.log("[API] POST /api/pagos - creating payment:", body.concepto);
    const result = await totalumSdk.crud.createRecord("pago", body);
    return NextResponse.json({ ok: true, data: result.data });
  } catch (error) {
    console.error("[API] POST /api/pagos error:", error);
    return NextResponse.json({ ok: false, error: "Error al crear pago" }, { status: 500 });
  }
}
