import { NextResponse } from "next/server";
import { totalumSdk } from "@/lib/totalum";

export async function GET() {
  try {
    const [clientesRes, sesionesRes, pagosRes] = await Promise.all([
      totalumSdk.crud.getRecords("cliente"),
      totalumSdk.crud.getRecords("sesion"),
      totalumSdk.crud.getRecords("pago"),
    ]);

    const clientes = clientesRes.data || [];
    const sesiones = sesionesRes.data || [];
    const pagos = pagosRes.data || [];

    const clientesActivos = clientes.filter(
      (c: Record<string, unknown>) => c.estado === "activo"
    ).length;

    const totalIngresos = pagos
      .filter((p: Record<string, unknown>) => p.estado_pago === "pagado")
      .reduce((sum: number, p: Record<string, unknown>) => sum + (Number(p.monto) || 0), 0);

    const pagosPendientes = pagos.filter(
      (p: Record<string, unknown>) => p.estado_pago === "pendiente" || p.estado_pago === "vencido"
    ).length;

    const sesionesHoy = sesiones.filter((s: Record<string, unknown>) => {
      if (!s.fecha) return false;
      const sesionDate = new Date(s.fecha as string).toDateString();
      const today = new Date().toDateString();
      return sesionDate === today;
    }).length;

    const sesionesCompletadas = sesiones.filter(
      (s: Record<string, unknown>) => s.estado_sesion === "completada"
    ).length;

    const sesionesProgramadas = sesiones.filter(
      (s: Record<string, unknown>) => s.estado_sesion === "programada"
    ).length;

    console.log("[API] GET /api/dashboard - stats computed");

    return NextResponse.json({
      ok: true,
      data: {
        totalClientes: clientes.length,
        clientesActivos,
        totalIngresos,
        pagosPendientes,
        sesionesHoy,
        sesionesCompletadas,
        sesionesProgramadas,
        totalSesiones: sesiones.length,
        totalPagos: pagos.length,
      },
    });
  } catch (error) {
    console.error("[API] GET /api/dashboard error:", error);
    return NextResponse.json({ ok: false, error: "Error al obtener dashboard" }, { status: 500 });
  }
}
