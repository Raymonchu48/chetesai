import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "../../../../../../lib/supabase-rest";

type Row = Record<string, unknown>;

function statusFor(error: unknown) {
  const message = error instanceof Error ? error.message : "Error al cargar el espacio del cliente";
  return { message, status: message.includes("no encontrado") ? 404 : 500 };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const encoded = encodeURIComponent(id);
    const today = new Date().toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

    const [clients, nutritionPlans, routineAssignments, measurements, habits, habitRecords, sessions, payments] = await Promise.all([
      supabaseRest<Row[]>(`clientes?id=eq.${encoded}&select=*&limit=1`),
      supabaseRest<Row[]>(`planes_nutricionales?cliente_id=eq.${encoded}&estado=eq.activo&select=id,nombre,objetivo,calorias_objetivo,proteinas_g,carbohidratos_g,grasas_g,agua_ml,fecha_inicio,fecha_fin,updated_at&order=updated_at.desc&limit=1`),
      supabaseRest<Row[]>(`cliente_rutinas?cliente_id=eq.${encoded}&estado=eq.activa&select=id,rutina_id,fecha_inicio,fecha_fin,estado,progreso,notas,rutinas(id,nombre,objetivo,nivel,dias_semana,duracion_semanas,duracion_sesion_minutos)&order=updated_at.desc&limit=1`),
      supabaseRest<Row[]>(`mediciones_corporales?cliente_id=eq.${encoded}&select=id,fecha,peso_kg,grasa_corporal_pct,masa_muscular_kg,cintura_cm,notas_profesional&order=fecha.desc&limit=12`),
      supabaseRest<Row[]>(`habitos_cliente?cliente_id=eq.${encoded}&activo=eq.true&select=id,nombre,categoria,tipo_registro,objetivo_valor,unidad&order=created_at.asc`),
      supabaseRest<Row[]>(`registros_habitos?cliente_id=eq.${encoded}&fecha=gte.${sevenDaysAgo}&select=id,habito_id,fecha,completado,valor&order=fecha.desc`),
      supabaseRest<Row[]>(`sesiones_agenda?cliente_id=eq.${encoded}&select=id,titulo,inicio_at,duracion_minutos,tipo_sesion,estado,modalidad,ubicacion&order=inicio_at.desc&limit=20`),
      supabaseRest<Row[]>(`pagos_cliente?cliente_id=eq.${encoded}&select=id,concepto,importe_eur,fecha_emision,fecha_vencimiento,fecha_pago,estado,metodo_pago&order=fecha_emision.desc&limit=20`),
    ]);

    const client = clients[0];
    if (!client) throw new Error("Cliente no encontrado");

    const completedRecords = habitRecords.filter((record) => record.completado === true).length;
    const possibleRecords = habits.length * 7;
    const adherence = possibleRecords ? Math.min(100, Math.round((completedRecords / possibleRecords) * 100)) : 0;
    const upcomingSessions = sessions
      .filter((session) => String(session.inicio_at || "") >= `${today}T00:00:00` && session.estado !== "cancelada")
      .sort((a, b) => String(a.inicio_at).localeCompare(String(b.inicio_at)));
    const pendingPayments = payments.filter((payment) => ["pendiente", "vencido"].includes(String(payment.estado)));
    const pendingAmount = pendingPayments.reduce((sum, payment) => sum + Number(payment.importe_eur || 0), 0);

    return NextResponse.json({
      ok: true,
      data: {
        cliente: { ...client, _id: client.id },
        plan_nutricional: nutritionPlans[0] || null,
        rutina_activa: routineAssignments[0] || null,
        mediciones: measurements,
        habitos: habits,
        registros_habitos: habitRecords,
        adherencia_7_dias: adherence,
        sesiones: sessions,
        proximas_sesiones: upcomingSessions.slice(0, 5),
        pagos: payments,
        pagos_pendientes: pendingPayments.length,
        importe_pendiente: Math.round(pendingAmount * 100) / 100,
      },
    });
  } catch (error) {
    const result = statusFor(error);
    return NextResponse.json({ ok: false, error: result.message }, { status: result.status });
  }
}
