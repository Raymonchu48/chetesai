import { NextRequest, NextResponse } from "next/server";
import { buildFinancialXlsx } from "@/lib/simple-xlsx";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const source = new URL("/api/informes/financieros", request.url);
    const desde = request.nextUrl.searchParams.get("desde");
    const hasta = request.nextUrl.searchParams.get("hasta");
    if (desde) source.searchParams.set("desde", desde);
    if (hasta) source.searchParams.set("hasta", hasta);

    const response = await fetch(source, {
      headers: { cookie: request.headers.get("cookie") || "" },
      cache: "no-store",
    });
    const result = (await response.json()) as { ok: boolean; data?: Parameters<typeof buildFinancialXlsx>[0]; error?: string };
    if (!response.ok || !result.ok || !result.data) {
      return NextResponse.json(
        { ok: false, error: result.error || "No se pudo generar el informe Excel" },
        { status: response.status || 500 }
      );
    }

    const workbook = buildFinancialXlsx(result.data);
    const period = result.data.periodo;
    return new NextResponse(Buffer.from(workbook), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="chetesai-informe-${period.desde}-${period.hasta}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al generar el archivo Excel" },
      { status: 500 }
    );
  }
}
