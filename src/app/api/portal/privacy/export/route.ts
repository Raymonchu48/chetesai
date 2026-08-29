import { NextResponse } from "next/server";
import {
  getConsentState,
  getPrivacyClientContext,
  hashPrivacyEmail,
  privacyErrorStatus,
  privacyServiceRequest,
} from "@/lib/privacy-server";

type Row = Record<string, unknown>;

const directClientTables = [
  "avisos_financieros",
  "bonos_cliente",
  "cliente_rutinas",
  "eventos_comunicaciones",
  "habitos_cliente",
  "inscripciones_eventos",
  "mediciones_corporales",
  "pagos_cliente",
  "planes_nutricionales",
  "preferencias_comunicacion",
  "registros_habitos",
  "sesiones_agenda",
  "sesiones_entrenamiento",
  "solicitudes_reserva",
] as const;

export async function GET() {
  try {
    const { user, client } = await getPrivacyClientContext();
    const encodedClientId = encodeURIComponent(client.id);
    const entries = await Promise.all(
      directClientTables.map(async (table) => {
        const rows = await privacyServiceRequest<Row[]>(`${table}?cliente_id=eq.${encodedClientId}&select=*`);
        return [table, rows] as const;
      })
    );
    const personalData = Object.fromEntries(entries) as Record<string, Row[]>;

    const sessionIds = personalData.sesiones_entrenamiento.map((row) => String(row.id || "")).filter(Boolean);
    const bonoIds = personalData.bonos_cliente.map((row) => String(row.id || "")).filter(Boolean);
    const routineIds = personalData.cliente_rutinas.map((row) => String(row.rutina_id || "")).filter(Boolean);

    const [series, consumptions, routines, consents, requests] = await Promise.all([
      sessionIds.length
        ? privacyServiceRequest<Row[]>(`series_entrenamiento?sesion_id=in.(${sessionIds.map((id) => encodeURIComponent(id)).join(",")})&select=*`)
        : Promise.resolve([]),
      bonoIds.length
        ? privacyServiceRequest<Row[]>(`consumos_bono?bono_cliente_id=in.(${bonoIds.map((id) => encodeURIComponent(id)).join(",")})&select=*`)
        : Promise.resolve([]),
      routineIds.length
        ? privacyServiceRequest<Row[]>(`rutinas?id=in.(${routineIds.map((id) => encodeURIComponent(id)).join(",")})&select=id,nombre,descripcion,objetivo,nivel,dias_semana,duracion_semanas,duracion_sesion_minutos`)
        : Promise.resolve([]),
      getConsentState(client.id),
      privacyServiceRequest<Row[]>(
        `privacy_requests?cliente_id=eq.${encodedClientId}&select=id,request_type,status,requested_at,resolved_at,resolution_note&order=requested_at.desc`
      ),
    ]);

    const photoFiles = personalData.mediciones_corporales.flatMap((row) =>
      ["foto_frontal_path", "foto_lateral_path", "foto_posterior_path"]
        .map((field) => row[field])
        .filter((value): value is string => typeof value === "string" && value.length > 0)
    );

    const exportPayload = {
      export: {
        generatedAt: new Date().toISOString(),
        format: "Chetesaí Fitness+ portable data export v1",
        privacyPolicyVersion: "2026-08-28",
        note: "Las fotografías se enumeran en photoFiles y pueden descargarse desde Mi progreso mientras la cuenta permanezca activa.",
      },
      account: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at || null,
        lastSignInAt: user.last_sign_in_at || null,
      },
      client,
      consents,
      privacyRequests: requests,
      personalData: {
        ...personalData,
        series_entrenamiento: series,
        consumos_bono: consumptions,
        rutinas_asignadas: routines,
        photoFiles,
      },
    };

    await privacyServiceRequest("privacy_requests", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        cliente_id: client.id,
        auth_user_id: user.id,
        requester_email_hash: hashPrivacyEmail(user.email),
        request_type: "access_export",
        status: "completed",
        resolved_at: new Date().toISOString(),
        resolution_note: "Exportación JSON generada automáticamente desde el portal autenticado.",
      }),
    });

    const safeDate = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(exportPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="chetesai-datos-${safeDate}.json"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo generar la exportación";
    return NextResponse.json({ ok: false, error: message }, { status: privacyErrorStatus(message) });
  }
}
