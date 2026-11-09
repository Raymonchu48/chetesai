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
  const a = responses[0].status === "fulfilled" && responses[0].value && typeof responses[0].value === "object" && "ok" in responses[0].value && responses[0].value.ok
    ? (responses[0].value as { data?: any }).data : null;
  const b = responses[1].status === "fulfilled" && responses[1].value && typeof responses[1].value === "object" && "ok" in responses[1].value && responses[1].value.ok
    ? (responses[1].value as { data?: any }).data : null;
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

/** Consultas de comidas específicas sobre el plan aprobado, sin generar sustituciones. */
export function specificMealAnswer(question: string, ctx: CoachContext | null): string | null {
  const q = question.toLocaleLowerCase("es").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const keywords: Record<string, string[]> = {
    desayuno: ["desayun"], almuerzo: ["almorz", "media manana"], comida: ["comer", "comida"],
    merienda: ["meriend"], cena: ["cenar", "cena"], recena: ["recena"],
  };
  const type = Object.keys(keywords).find(key => keywords[key].some(word => q.includes(word)));
  const quantity = /cuant[oa]s?|gramos|cantidad|porci[oó]n|raci[oó]n/.test(q);
  const foodLookup = /(?:cuant|gramos|cantidad|porci|raci|que tengo|que hay|que me toca|que debo)/.test(q);
  if (!foodLookup) return null;
  if (!type && !quantity) return null;
  if (!ctx?.nutritionLoaded) return "No puedo consultar ahora tu plan nutricional. Comprueba «Mi nutrición» desde el portal.";
  if (!ctx.foodPlan) return "No hay un plan nutricional aprobado y activo para consultar.";
  const { label } = coachToday();
  const all = ctx.foodPlan.comidas || [];
  const hasDays = all.some(meal => dayNames.slice(1).some(day => meal.nombre.toLocaleLowerCase("es").startsWith(day.toLocaleLowerCase("es") + " · ")));
  const todayMeals = hasDays ? all.filter(meal => meal.nombre.toLocaleLowerCase("es").startsWith(label.toLocaleLowerCase("es") + " · ")) : all;
  if (!type) {
    const search = q.replace(/cuant[oa]s?|gramos|cantidad|porcion|racion|de|del|la|el|los|las|tengo|que|hoy|mi|plan|comer|como|para|en|hay|deb(o|eria)|al|se|sirven|esta/g, " ").split(/\\s+/).filter(word => word.length > 3);
    if (!search.length) return "Dime qué alimento de tu plan quieres consultar, por ejemplo: «¿Cuántos gramos de arroz tengo hoy?»";
    const found = todayMeals.flatMap(meal => (meal.alimentos || [])
      .filter(food => search.some(word => food.nombre.toLocaleLowerCase("es").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").includes(word)))
      .map(food => `${meal.nombre}: ${food.nombre}, ${food.cantidad_g} ${food.unidad_medida || "g"}`));
    if (found.length) return `Según tu plan de hoy (${label}):\\n${found.slice(0,8).map(x => "• " + x).join("\\n")}\\n\\nEstas son las cantidades publicadas por tu profesional.`;
    return "No he localizado ese alimento entre las comidas de hoy. Puedes ver todos los ingredientes en «Mi nutrición».";
  }
  const matching = todayMeals.filter(meal => {
    const title = meal.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    return keywords[type].some(word => title.includes(word)) || (type === "comida" && /almuerzo|comida/.test(title));
  });
  if (!matching.length) return `En tu plan «${ctx.foodPlan.nombre}» no hay una ${type} detallada para hoy (${label}). Puedes consultarlo con tu profesional.`;
  return matching.slice(0,3).map(meal => {
    const foods = (meal.alimentos || []).map(item => `• ${item.nombre}: ${item.cantidad_g} ${item.unidad_medida || "g"}`);
    const details = foods.length ? foods.join("\n") : meal.descripcion || "Consulta el detalle en «Mi nutrición».";
    return `${meal.nombre}${meal.hora ? " · " + meal.hora : ""}\n${details}${quantity && !foods.length ? "\nLas cantidades no están desglosadas en el plan." : ""}`;
  }).join("\n\n") + "\n\nEstas cantidades son las indicadas en tu planificación profesional.";
}
