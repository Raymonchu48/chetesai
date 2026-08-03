import { NextRequest, NextResponse } from "next/server";
import { assertProfessional } from "@/lib/events-server";
import { runAutomaticEventReminders } from "@/lib/event-reminders";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function cronIsAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Configura CRON_SECRET en Vercel para activar los recordatorios automáticos" },
      { status: 503 }
    );
  }
  if (!cronIsAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 });
  }

  try {
    const data = await runAutomaticEventReminders();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudieron procesar los recordatorios" },
      { status: 500 }
    );
  }
}

// Permite comprobar el proceso desde el panel profesional sin esperar al cron de producción.
export async function POST() {
  try {
    await assertProfessional();
    const data = await runAutomaticEventReminders();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron procesar los recordatorios";
    const status = message === "No autenticado" ? 401 : message === "No autorizado" ? 403 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
