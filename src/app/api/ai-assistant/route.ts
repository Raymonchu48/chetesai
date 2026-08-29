import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(800),
      }),
    )
    .min(1)
    .max(10),
});

function fallbackReply(message: string) {
  const normalized = message.toLocaleLowerCase("es");

  if (/dolor|lesi[oó]n|mareo|respir|falta de aire|ahogo|pecho|urgencia|desmayo/.test(normalized)) {
    return "Si tienes dolor agudo, mareo, dificultad para respirar o una posible lesión, detén el ejercicio. Contacta con un profesional sanitario y, si es una urgencia, llama a emergencias. Después, Ramón podrá adaptar el entrenamiento cuando sea seguro retomarlo.";
  }
  if (/precio|tarifa|cu[aá]nto|coste/.test(normalized)) {
    return "El entrenamiento personal parte de 75 € al mes por 4 sesiones, y los grupos reducidos parten de 45 € al mes por 4 sesiones. También hay modalidades de 8 y 12 sesiones. Pulsa “Consultar tarifas” para ver el detalle completo.";
  }
  if (/reserv|valoraci[oó]n|empezar|apuntar/.test(normalized)) {
    return "Para empezar, pulsa “Solicitar valoración” y completa tus datos, objetivo y disponibilidad. Ramón revisará la solicitud y normalmente responderá en menos de 24 horas.";
  }
  if (/nutrici[oó]n|comida|dieta|aliment/.test(normalized)) {
    return "Chetesaí integra seguimiento de nutrición y hábitos dentro del acompañamiento. La pauta concreta debe ajustarse a cada persona; si ya eres cliente, abre “Mi nutrición”, y si todavía no lo eres, solicita una valoración.";
  }
  if (/matr[ií]cula|permanencia|baja|cambiar de modalidad/.test(normalized)) {
    return "No hay matrícula ni permanencia. Puedes cambiar de modalidad al finalizar cada mes. Para revisar tu caso concreto, contacta con Ramón.";
  }
  if (/cancel|recuperar|perdid[ao]|reubicar|24 horas/.test(normalized)) {
    return "Una sesión puede reubicarse dentro del mismo mes avisando con al menos 24 horas, siempre según disponibilidad.";
  }
  if (/d[oó]nde|ubicaci[oó]n|lugar|mallorca|exterior|indoor/.test(normalized)) {
    return "Los entrenamientos se organizan en espacios interiores o exteriores de Mallorca, según disponibilidad y ubicación. Ramón confirmará el lugar durante la valoración.";
  }
  if (/experiencia|principiante|nunca he entrenado|nivel/.test(normalized)) {
    return "No necesitas experiencia previa. El entrenamiento se adapta a tu condición física, tu nivel y tu punto de partida.";
  }
  if (/grupo|grupos reducidos|personal|individual|1:1/.test(normalized)) {
    return "Puedes elegir entrenamiento personal 1:1 o grupos reducidos de 2 a 4 personas. Si no sabes cuál te conviene, solicita una valoración y Ramón te orientará según tus objetivos y disponibilidad.";
  }
  if (/contact|ram[oó]n|correo|email/.test(normalized)) {
    return "Puedes contactar con Ramón en chetesaifitness@gmail.com. La respuesta habitual llega en menos de 24 horas.";
  }
  return "Puedo orientarte sobre servicios, tarifas, valoración inicial y funcionamiento de Chetesaí Fitness+. Para una recomendación personal, lo mejor es solicitar una valoración con Ramón.";
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "La consulta no tiene un formato válido." }, { status: 400 });
    }

    return NextResponse.json({ reply: fallbackReply(body.data.messages.at(-1)?.content || "") });
  } catch {
    return NextResponse.json({ error: "No se pudo procesar la consulta." }, { status: 400 });
  }
}
