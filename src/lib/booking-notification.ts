const recipient = "chetesaifitnnes@gmail.com";

type RequestEntry = {
  id: string;
  nombre: string;
  email: string;
  modalidad: string;
};

export async function sendBookingNotification(entry: RequestEntry): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOKING_FROM_EMAIL;
  if (!apiKey || !from) throw new Error("Configuración Resend incompleta: RESEND_API_KEY o BOOKING_FROM_EMAIL");
  const modalities: Record<string,string> = {
    entrenamiento_personal: "Entrenamiento personal",
    grupo_reducido: "Grupo reducido",
    orientacion: "Orientación"
  };
  // Avoid embedding client-provided HTML and health details in email.
  const body = [
    "Nueva solicitud recibida en Chetesaí Fitness+",
    "",
    `Nombre: ${entry.nombre}`,
    `Servicio: ${modalities[entry.modalidad] || "Solicitud de información"}`,
    `Contacto: ${entry.email}`,
    "",
    "Consulta la información completa desde el panel profesional:",
    "https://www.chetesaifitness.com/sesiones?tab=solicitudes",
    "",
    `Identificador de solicitud: ${entry.id}`,
  ].join("\n");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: "Chetesaí Fitness+ | Nueva solicitud web",
      text: body,
      reply_to: entry.email,
    }),
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({})) as { id?: string; message?: string };
  if (!response.ok || !result.id) {
    throw new Error(`Resend HTTP ${response.status}: ${(result.message || "No se obtuvo identificador de envío").slice(0,200)}`);
  }
  return { id: result.id };
}
