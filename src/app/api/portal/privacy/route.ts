import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/events-server";
import { type ConsentType } from "@/lib/privacy-contract";
import {
  getConsentState,
  getPrivacyClientContext,
  hashPrivacyEmail,
  privacyErrorStatus,
  privacyServiceRequest,
  recordConsent,
} from "@/lib/privacy-server";

type PrivacyRequest = {
  id: string;
  request_type: "access_export" | "erasure";
  status: "pending" | "in_progress" | "completed" | "rejected" | "cancelled";
  requested_at: string;
  resolved_at: string | null;
};

export async function GET() {
  try {
    const { client } = await getPrivacyClientContext();
    const [consents, requests] = await Promise.all([
      getConsentState(client.id),
      privacyServiceRequest<PrivacyRequest[]>(
        `privacy_requests?cliente_id=eq.${encodeURIComponent(client.id)}&select=id,request_type,status,requested_at,resolved_at&order=requested_at.desc&limit=20`
      ),
    ]);
    return NextResponse.json({ ok: true, data: { client, consents, requests } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo cargar la configuración de privacidad";
    return NextResponse.json({ ok: false, error: message }, { status: privacyErrorStatus(message) });
  }
}
export async function POST(request: NextRequest) {
  try {
    const { user, client } = await getPrivacyClientContext();
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action || "");

    if (action === "save_consents") {
      if (typeof body.health_data !== "boolean" || typeof body.progress_photos !== "boolean") {
        return NextResponse.json(
          { ok: false, error: "Debes indicar una respuesta para cada consentimiento" },
          { status: 400 }
        );
      }

      const current = await getConsentState(client.id);
      const choices: Array<[ConsentType, boolean]> = [
        ["health_data", body.health_data],
        ["progress_photos", body.progress_photos],
      ];
      for (const [type, granted] of choices) {
        if (current[type].granted !== granted) {
          await recordConsent(client.id, user.id, type, granted);
        }
      }

      return NextResponse.json({ ok: true, data: { consents: await getConsentState(client.id) } });
    }

    if (action === "request_erasure") {
      const openRequests = await privacyServiceRequest<PrivacyRequest[]>(
        `privacy_requests?cliente_id=eq.${encodeURIComponent(client.id)}&request_type=eq.erasure&status=in.(pending,in_progress)&select=id,request_type,status,requested_at,resolved_at&limit=1`
      );
      if (openRequests[0]) {
        return NextResponse.json({ ok: true, data: { request: openRequests[0], alreadyOpen: true } });
      }

      const rows = await privacyServiceRequest<PrivacyRequest[]>("privacy_requests", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          cliente_id: client.id,
          auth_user_id: user.id,
          requester_email_hash: hashPrivacyEmail(user.email),
          request_type: "erasure",
          status: "pending",
        }),
      });
      const created = rows[0];

      await sendEmail(
        {
          to: ["chetesaifitness@gmail.com"],
          subject: "Nueva solicitud de supresión de datos",
          html: `<p>Se ha recibido una solicitud de supresión desde el portal autenticado de Chetesaí Fitness+.</p><p><strong>Cliente:</strong> ${escapeHtml(client.nombre)}</p><p><strong>Correo:</strong> ${escapeHtml(client.email || user.email)}</p><p>Revísala en el panel profesional de Protección de datos.</p>`,
          text: `Nueva solicitud de supresión. Cliente: ${client.nombre}. Correo: ${client.email || user.email}. Revísala en el panel de Protección de datos.`,
        },
        `privacy-erasure-${created?.id || client.id}`
      ).catch((emailError) => {
        console.error("[privacy] No se pudo enviar el aviso de supresión", emailError);
      });

      return NextResponse.json({ ok: true, data: { request: created } });
    }

    return NextResponse.json({ ok: false, error: "Acción no válida" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo actualizar la privacidad";
    return NextResponse.json({ ok: false, error: message }, { status: privacyErrorStatus(message) });
  }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}
