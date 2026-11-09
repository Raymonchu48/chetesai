export type CoachContext = {
  name: string;
  workout: { nombre: string; duracion_sesion_minutos?: number | null } | null;
  exercises: Array<{ dia: number; orden: number; series: number; repeticiones: string; ejercicios?: { nombre: string } }>;
  foodPlan: { nombre: string; comidas: Array<{ nombre: string; hora?: string; descripcion?: string; alimentos?: Array<{ nombre: string; cantidad_g: number; unidad_medida?: string }> }> } | null;
  workoutLoaded: boolean;
  nutritionLoaded: boolean;
};

const dayNames = ["", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function coachToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Madrid", weekday: "long", hour: "numeric", hour12: false,
  }).formatToParts(new Date());
  const day = parts.find((part) => part.type === "weekday")?.value || "Monday";
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 12);
  const index = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].indexOf(day);
  return { index: index > 0 ? index : 1, label: dayNames[index] || "Hoy", greeting: hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches" };
}

export async function loadCoachContext(): Promise<CoachContext> {
  const responses = await Promise.allSettled([
    fetch("/api/portal/rutina", { cache: "no-store" }).then(async (r) => { if (!r.ok) throw Error("No routine"); return r.json(); }),
    fetch("/api/portal/bienestar", { cache: "no-store" }).then(async (r) => { if (!r.ok) throw Error("No nutrition"); return r.json(); }),
  ]);
  const a = responses[0].status === "fulfilled" && responses[0].value?.ok ? responses[0].value.data : null;
  const b = responses[1].status === "fulfilled" && responses[1].value?.ok ? responses[1].value.data : null;
  return {
    name: String(a?.cliente?.nombre || b?.cliente?.nombre || "").trim().split(/\s+/)[0] || "",
    workout: a?.rutina || null,
    exercises: Array.isArray(a?.ejercicios) ? a.ejercicios : [],
    foodPlan: b?.plan || null,
    workoutLoaded: Boolean(a), nutritionLoaded: Boolean(b),
  };
}

export function coachAnswer(question: string, ctx: CoachContext | null): string | null {
  const input = question.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const food = /que (como|comer|cenar|desayunar)|mi (menu|comida|nutricion|dieta)|que hay para (comer|cenar)|alimentacion/.test(input);
  const training = /que me toca|que entren|entrenamiento (de )?hoy|rutina (de )?hoy|ejercicios (de )?hoy|hoy entreno/.test(input);
  if (!food && !training) return null;
  if (!ctx) return "Estoy consultando tu planificación. Prueba de nuevo en unos instantes.";
  const { index, label } = coachToday();
  if (food) {
    if (!ctx.nutritionLoaded) return "No puedo consultar ahora tu plan nutricional. Puedes verlo en «Mi nutrición» dentro de tu portal.";
    if (!ctx.foodPlan) return "Tu profesional todavía no ha publicado un plan nutricional activo. En cuanto esté disponible podré contarte tus comidas diarias.";
    const meals = ctx.foodPlan.comidas || [];
    const tagged = meals.some(m => dayNames.slice(1).some(day => m.nombre.toLocaleLowerCase("es").startsWith(day.toLocaleLowerCase("es") + " · ")));
    const todayMeals = tagged ? meals.filter(m => m.nombre.toLocaleLowerCase("es").startsWith(label.toLocaleLowerCase("es") + " · ")) : meals;
    if (!todayMeals.length) return `Hoy (${label}) no hay comidas detalladas en tu plan «${ctx.foodPlan.nombre}». Consulta a tu profesional si necesitas confirmarlo.`;
    const lines = todayMeals.slice(0, 8).map(m => {
      const name = m.nombre.replace(new RegExp("^" + label + " · ", "i"), "");
      const detail = m.descripcion || (m.alimentos || []).map(f => `${f.nombre} ${f.cantidad_g} ${f.unidad_medida || "g"}`).join(", ") || "Detalles en Mi nutrición";
      return `• ${name}${m.hora ? " (" + m.hora + ")" : ""}: ${detail}`;
    });
    return `Según tu plan «${ctx.foodPlan.nombre}», hoy (${label}) tienes:\n\n${lines.join("\n")}\n\nConsulta «Mi nutrición» para revisar las cantidades y detalles aprobados por tu profesional.`;
  }
  if (!ctx.workoutLoaded) return "No puedo consultar ahora tu rutina. Entra en «Entrenamiento» en tu portal para verla.";
  if (!ctx.workout) return "Aún no tienes una rutina activa publicada. Tu profesional la pondrá a tu disposición cuando esté preparada.";
  const exercises = ctx.exercises.filter(x => Number(x.dia) === index).sort((a,b)=>a.orden-b.orden);
  if (!exercises.length) return `Hoy es ${label} y tu rutina «${ctx.workout.nombre}» no tiene ejercicios previstos para este día. Si tu calendario de entrenamiento es distinto, consúltalo con tu profesional.`;
  return `¡Vamos con tu entrenamiento de ${label}! Tu rutina «${ctx.workout.nombre}» incluye:\n\n${exercises.slice(0, 12).map(x => `• ${x.ejercicios?.nombre || "Ejercicio"}: ${x.series} series × ${x.repeticiones || "repeticiones asignadas"}`).join("\n")}${ctx.workout.duracion_sesion_minutos ? `\n\nDuración orientativa: ${ctx.workout.duracion_sesion_minutos} minutos.` : ""}\n\nAbre «Entrenamiento» en tu portal para consultar la técnica y registrar tu sesión.`;
}
