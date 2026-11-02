"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import FoodCategoryVisual from "@/components/nutrition/FoodCategoryVisual";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Apple,
  Carrot,
  Leaf,
  Wheat,
  ArrowLeft,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Droplets,
  HeartPulse,
  Sparkles,
  Target,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";

type MealFood = { nombre: string; cantidad_g: number; energia_kcal: number; proteinas_g: number; carbohidratos_g: number; grasas_g: number; categoria?: string };
type Meal = { nombre: string; hora: string; descripcion: string; alimentos?: MealFood[] };
type Plan = {
  id: string;
  nombre: string;
  objetivo: string | null;
  calorias_objetivo: number | null;
  proteinas_g: number | null;
  carbohidratos_g: number | null;
  grasas_g: number | null;
  agua_ml: number | null;
  recomendaciones: string | null;
  comidas: Meal[];
  fecha_inicio: string;
  fecha_fin: string | null;
};
type Habit = {
  id: string;
  nombre: string;
  categoria: string;
  tipo_registro: string;
  objetivo_valor: number | null;
  unidad: string | null;
  instrucciones: string | null;
};
type HabitRecord = {
  id?: string;
  habito_id: string;
  fecha: string;
  completado: boolean;
  valor: number | null;
  nota?: string | null;
};
type PortalData = {
  cliente: { id: string; nombre: string; email: string | null };
  plan: Plan | null;
  habitos: Habit[];
  registros: HabitRecord[];
};

const categoryLabels: Record<string, string> = {
  hidratacion: "Hidratación",
  alimentacion: "Alimentación",
  descanso: "Descanso",
  actividad: "Actividad",
  bienestar: "Bienestar",
  otro: "Otro",
};

export default function ClientWellbeingPage() {
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const today = new Date().toISOString().slice(0, 10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/portal/bienestar", { cache: "no-store" });
      const result = (await response.json()) as { ok: boolean; data?: PortalData; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudo cargar tu plan");
      setData(result.data);
      const next: Record<string, string> = {};
      for (const record of result.data.registros || []) {
        if (record.fecha === today && record.valor !== null && record.valor !== undefined) next[record.habito_id] = String(record.valor);
      }
      setQuantities(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const todayRecords = useMemo(() => (data?.registros || []).filter((record) => record.fecha === today), [data, today]);
  const completedToday = todayRecords.filter((record) => record.completado).length;
  const progress = data?.habitos?.length ? Math.round((completedToday / data.habitos.length) * 100) : 0;

  const weeklyProgress = useMemo(() => {
    if (!data?.habitos?.length) return 0;
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const startDate = start.toISOString().slice(0, 10);
    const completed = data.registros.filter((record) => record.fecha >= startDate && record.completado).length;
    return Math.round((completed / (data.habitos.length * 7)) * 100);
  }, [data]);

  function recordFor(habitId: string) {
    return todayRecords.find((record) => record.habito_id === habitId);
  }

  async function saveHabit(habit: Habit, completed?: boolean) {
    setSavingId(habit.id);
    try {
      const valueText = quantities[habit.id] || "";
      const value = valueText === "" ? null : Number(valueText);
      const calculatedCompleted = habit.tipo_registro === "cantidad"
        ? value !== null && Number.isFinite(value) && (habit.objetivo_valor ? value >= habit.objetivo_valor : value > 0)
        : Boolean(completed);

      const response = await fetch("/api/portal/bienestar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habito_id: habit.id, fecha: today, valor: valueText, completado: calculatedCompleted }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo guardar");
      toast.success("Hábito actualizado");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSavingId(null);
    }
  }

  const mealCount = data?.plan?.comidas?.filter((meal) => meal.nombre || meal.descripcion).length || 0;

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-7 text-[#29312e] sm:px-5 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 rounded-[28px] border border-[#e7dfd3] bg-[#fffdf9] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold tracking-[0.22em] text-[#c9653b]">CHETESAÍ FITNESS+</p>
              <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
                <Apple className="h-8 w-8 text-[#46624f]" />
                Nutrición
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#707872]">
                {data?.cliente?.nombre ? `Hola, ${data.cliente.nombre}. Aquí tienes tu plan nutricional y, al final, tus hábitos diarios.` : "Tu planificación nutricional personal."}
              </p>
            </div>
            <div className="flex w-full flex-wrap gap-2 lg:w-auto">
              <Button asChild variant="outline"><Link href="/portal"><ArrowLeft className="mr-2 h-4 w-4" />Entrenamiento</Link></Button>
              <Button asChild variant="outline"><Link href="/portal/progreso"><TrendingUp className="mr-2 h-4 w-4" />Mi progreso</Link></Button>
              <div className="w-full rounded-xl border border-[#e7dfd3] bg-white p-1 text-[#46624f] sm:w-48"><LogoutButton /></div>
            </div>
          </div>
        </header>

        {loading ? (
          <Card><CardContent className="py-20 text-center text-[#707872]">Cargando tu planificación...</CardContent></Card>
        ) : !data ? null : (
          <>
            <section id="plan-nutricional" className="mb-10">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#46624f]">Tu planificación</p>
                  <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Mi plan nutricional</h2>
                </div>
                {data.plan ? <span className="w-fit rounded-full bg-[#e9f2ea] px-4 py-2 text-xs font-bold text-[#46624f]">Plan activo</span> : null}
              </div>

              {!data.plan ? (
                <Card className="border-[#e7dfd3]"><CardContent className="py-16 text-center"><Apple className="mx-auto h-11 w-11 text-[#707872]" /><h3 className="mt-4 text-xl font-bold">Todavía no tienes un plan nutricional activo</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#707872]">Cuando tu profesional publique tu planificación, aparecerá aquí con tus comidas, objetivos y recomendaciones.</p></CardContent></Card>
              ) : (
                <>
                  <Card className="overflow-hidden border-0 bg-[#294435] text-white shadow-[0_18px_50px_rgba(41,68,53,0.18)]">
                    <CardContent className="p-0">
                      <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
                        <div className="p-6 sm:p-8">
                          <div className="flex items-center gap-2 text-[#bfe0c6]"><Sparkles className="h-4 w-4" /><span className="text-xs font-bold uppercase tracking-[0.18em]">Plan actual</span></div>
                          <h3 className="mt-3 text-2xl font-bold sm:text-3xl">{data.plan.nombre}</h3>
                          <div className="mt-4 flex items-start gap-3 text-sm leading-6 text-[#e5eee8]"><Target className="mt-0.5 h-5 w-5 shrink-0 text-[#bfe0c6]" /><p>{data.plan.objetivo || "Plan adaptado a tus objetivos y evolución."}</p></div>
                          <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-[#e5eee8]">
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><CalendarDays className="h-4 w-4" />Desde {formatDate(data.plan.fecha_inicio)}</span>
                            {data.plan.fecha_fin ? <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">Hasta {formatDate(data.plan.fecha_fin)}</span> : null}
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2"><Utensils className="h-4 w-4" />{mealCount} comidas</span>
                          </div>
                        </div>
                        <div className="border-t border-white/10 bg-white/[0.06] p-6 lg:border-l lg:border-t-0 sm:p-8">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#bfe0c6]">Resumen diario</p>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <DarkMetric label="Energía" value={formatNumber(data.plan.calorias_objetivo, "kcal")} />
                            <DarkMetric label="Agua" value={formatNumber(data.plan.agua_ml, "ml")} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <PlanMetric label="Proteínas" value={formatNumber(data.plan.proteinas_g, "g")} />
                    <PlanMetric label="Carbohidratos" value={formatNumber(data.plan.carbohidratos_g, "g")} />
                    <PlanMetric label="Grasas" value={formatNumber(data.plan.grasas_g, "g")} />
                    <PlanMetric label="Agua" value={formatNumber(data.plan.agua_ml, "ml")} />
                  </div>

                  {data.plan.recomendaciones ? (
                    <div className="mt-5 rounded-[24px] border border-[#dfe7df] bg-[#eef5ef] p-5 sm:p-6">
                      <div className="flex items-center gap-2 text-[#46624f]"><Sparkles className="h-5 w-5" /><h3 className="font-bold">Indicaciones de tu profesional</h3></div>
                      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#4f5c55]">{data.plan.recomendaciones}</p>
                    </div>
                  ) : null}

                  <section className="mt-8">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c9653b]">Plan del día</p>
                      <h3 className="mt-1 text-2xl font-bold">Mis comidas</h3>
                      <p className="mt-1 text-sm leading-6 text-[#707872]">Consulta cada propuesta, horario y alternativa publicada por tu profesional.</p>
                    </div>

                    {Array.isArray(data.plan.comidas) && data.plan.comidas.length ? (
                      <div className="space-y-3">
                        {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => {
                          const dayMeals = data.plan!.comidas.filter(meal => meal.nombre.startsWith(`${day} · `));
                          if (!dayMeals.length) return null;
                          const kcal = dayMeals.reduce((total, meal) => total + (meal.alimentos || []).reduce((sum, food) => sum + Number(food.energia_kcal || 0), 0), 0);
                          return <details key={day} className="group overflow-hidden rounded-[24px] border border-[#dce4d9] bg-[#fffdf9] shadow-sm" open={false}>
                            <summary className="relative flex cursor-pointer list-none items-center justify-between gap-3 overflow-hidden px-4 py-5 marker:hidden sm:px-6 [&::-webkit-details-marker]:hidden">
                              <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[31%] right-[110px] hidden items-center justify-center gap-1 overflow-hidden opacity-55 sm:flex lg:left-[28%] lg:right-[145px]">
                                <span className="text-3xl opacity-80 lg:text-4xl">🥕</span><span className="translate-y-2 text-3xl lg:text-4xl">🥦</span><span className="-translate-y-1 text-3xl lg:text-4xl">🍅</span><span className="translate-y-2 text-3xl lg:text-4xl">🌽</span><span className="text-3xl lg:text-4xl">🍆</span><span className="-translate-y-2 text-3xl lg:text-4xl">🍋</span><span className="translate-y-1 text-3xl lg:text-4xl">🍇</span>
                              </div>
                              <div className="relative z-10 flex items-center gap-3">
                                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#46624f] text-sm font-bold text-white">{["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].indexOf(day)+1}</span>
                                <div><h4 className="text-lg font-bold !text-[#253e31]">{day}</h4><p className="text-xs font-medium text-[#596d5e]">{dayMeals.length} comidas · {Math.round(kcal)} kcal estimadas</p></div>
                              </div>
                              <span className="relative z-10 rounded-full border border-[#cad8ca] bg-[#edf3ec] px-3 py-2 text-sm font-bold text-[#34523c] group-open:bg-[#dceadf]"> <span className="group-open:hidden">Ver comidas +</span><span className="hidden group-open:inline">Cerrar −</span></span>
                            </summary>
                            <div className="relative isolate border-t border-[#dce4d9] bg-[#f8faf6] px-3 py-5 sm:px-5">
                              <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
                                <div className="absolute -top-6 right-0 flex rotate-[-8deg] gap-2 text-4xl opacity-35 sm:text-5xl"><span>🥕</span><span>🥦</span><span>🍅</span><span>🍋</span></div>
                                <div className="absolute -bottom-4 left-0 flex -rotate-12 gap-2 text-4xl opacity-25 sm:text-5xl"><span>🍇</span><span>🌽</span><span>🍆</span></div>
                                <div className="absolute bottom-2 right-1 flex gap-2 text-3xl opacity-20"><span>🥬</span><span>🍄</span><span>🫑</span></div>
                              </div>
                              <div className="relative z-10 space-y-3">
                                {dayMeals.map((meal,index) => <details key={`${day}-${meal.nombre}-${index}`} className="group/meal overflow-hidden rounded-xl border border-[#d7e1d5] bg-white/95">
                                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
                                    <div className="min-w-0"><p className="font-semibold !text-[#263f31]">{meal.nombre.split(" · ").slice(1).join(" · ") || meal.nombre}</p><p className="text-xs text-[#59695e]">{meal.hora} · {Math.round((meal.alimentos||[]).reduce((n,f)=>n+Number(f.energia_kcal||0),0))} kcal</p></div>
                                    <span className="shrink-0 text-sm font-semibold text-[#46624f]"><span className="group-open/meal:hidden">Mostrar +</span><span className="hidden group-open/meal:inline">Ocultar −</span></span>
                                  </summary>
                                  <div className="border-t border-[#e1e8df] px-4 pb-4 pt-3">
                                    <p className="mb-3 text-sm leading-6 text-[#40574a]">{meal.descripcion || "Comida prevista por tu profesional."}</p>
                                    {meal.alimentos?.length ? <div className="divide-y divide-[#e4e9e1] rounded-lg border border-[#e0e6de] bg-white">{meal.alimentos.map((food,foodIndex)=><div key={`${food.nombre}-${foodIndex}`} className="flex items-center justify-between gap-3 px-3 py-3"><div className="flex min-w-0 items-center gap-3"><FoodCategoryVisual category={food.categoria} name={food.nombre} compact /><div className="min-w-0"><p className="text-sm font-semibold !text-[#253e31]">{food.nombre}</p><p className="text-xs text-[#53665a]">{food.cantidad_g} g · P {food.proteinas_g} g · HC {food.carbohidratos_g} g · G {food.grasas_g} g</p></div></div><span className="shrink-0 rounded-full bg-[#e9f2e9] px-2 py-1 text-xs font-bold text-[#33533c]">{food.energia_kcal} kcal</span></div>)}</div> : null}
                                  </div>
                                </details>)}
                              </div>
                            </div>
                          </details>;
                        })}
                        {!data.plan.comidas.some(meal=>["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"].some(day=>meal.nombre.startsWith(`${day} · `))) && data.plan.comidas.map((meal,index)=><details key={index} className="rounded-xl border border-[#d7e1d5] bg-white p-4"><summary className="cursor-pointer font-bold text-[#253e31]">{meal.nombre}</summary><p className="mt-3 text-sm text-[#40574a]">{meal.descripcion}</p>{meal.alimentos?.map((food,i)=><p key={i} className="text-sm text-[#253e31]">{food.nombre} · {food.cantidad_g} g · {food.energia_kcal} kcal</p>)}</details>)}
                      </div>
                    ) : (
                      <Card><CardContent className="py-10 text-center text-sm text-[#707872]">Tu plan todavía no contiene comidas publicadas.</CardContent></Card>
                    )}
                  </section>
                </>
              )}
            </section>

            <section id="habitos" className="rounded-[28px] border border-[#e3ddd3] bg-[#f1eee8] p-4 sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c9653b]">Seguimiento diario</p>
                  <h2 className="mt-1 text-2xl font-bold">Hábitos de hoy</h2>
                  <p className="mt-1 text-sm leading-6 text-[#707872]">Registra tus acciones diarias y consulta tu constancia.</p>
                </div>
                <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#46624f] shadow-sm">{completedToday}/{data.habitos.length} completados</div>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <HabitMetric label="Completados hoy" value={`${completedToday}/${data.habitos.length}`} />
                <HabitMetric label="Progreso de hoy" value={`${progress}%`} progress={progress} />
                <HabitMetric label="Últimos 7 días" value={`${weeklyProgress}%`} progress={weeklyProgress} />
              </div>

              {!data.habitos.length ? (
                <Card className="border-0 bg-white"><CardContent className="py-12 text-center text-[#707872]">Todavía no tienes hábitos asignados.</CardContent></Card>
              ) : (
                <div className="space-y-4">
                  {data.habitos.map((habit) => {
                    const record = recordFor(habit.id);
                    const done = Boolean(record?.completado);
                    return (
                      <Card key={habit.id} className={done ? "border-[#b8d4be] bg-[#f7fbf7]" : "border-0 bg-white"}>
                        <CardContent className="p-5">
                          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex gap-4">
                              <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${done ? "bg-[#46624f] text-white" : "bg-[#eef0ec] text-[#707872]"}`}>
                                {habit.categoria === "hidratacion" ? <Droplets className="h-6 w-6" /> : <HeartPulse className="h-6 w-6" />}
                              </div>
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#707872]">{categoryLabels[habit.categoria] || habit.categoria}</p>
                                <h3 className="mt-1 font-bold">{habit.nombre}</h3>
                                {habit.instrucciones ? <p className="mt-1 text-sm leading-6 text-[#707872]">{habit.instrucciones}</p> : null}
                                {habit.tipo_registro === "cantidad" && habit.objetivo_valor ? <p className="mt-1 text-xs font-semibold text-[#46624f]">Objetivo: {habit.objetivo_valor} {habit.unidad || ""}</p> : null}
                              </div>
                            </div>
                            {habit.tipo_registro === "booleano" ? (
                              <Button onClick={() => saveHabit(habit, !done)} disabled={savingId === habit.id} className={done ? "bg-[#46624f] hover:bg-[#3b5543]" : "bg-[#c9653b] hover:bg-[#b65a35]"}>
                                {done ? <Check className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}
                                {savingId === habit.id ? "Guardando..." : done ? "Completado" : "Marcar como hecho"}
                              </Button>
                            ) : (
                              <div className="flex w-full gap-2 sm:w-auto">
                                <Input type="number" step="0.1" min="0" className="w-full bg-white sm:w-32" value={quantities[habit.id] || ""} onChange={(event) => setQuantities({ ...quantities, [habit.id]: event.target.value })} placeholder={habit.unidad || "Cantidad"} />
                                <Button onClick={() => saveHabit(habit)} disabled={savingId === habit.id} className="bg-[#46624f] hover:bg-[#3b5543]">{savingId === habit.id ? "Guardando..." : "Guardar"}</Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function PlanMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[#e3ddd3] bg-[#fffdf9] p-4"><p className="text-xs font-semibold text-[#707872]">{label}</p><p className="mt-1 text-lg font-bold sm:text-xl">{value}</p></div>;
}

function DarkMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs text-[#bfe0c6]">{label}</p><p className="mt-1 text-lg font-bold text-white">{value}</p></div>;
}

function HabitMetric({ label, value, progress }: { label: string; value: string; progress?: number }) {
  const safe = Math.max(0, Math.min(100, progress || 0));
  return <div className="rounded-2xl bg-white p-4 shadow-sm"><p className="text-xs font-semibold text-[#707872]">{label}</p><p className="mt-1 text-xl font-bold">{value}</p>{progress !== undefined ? <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#e7ebe7]"><div className="h-full rounded-full bg-[#46624f]" style={{ width: `${safe}%` }} /></div> : null}</div>;
}

function formatNumber(value: number | null | undefined, suffix: string) {
  return value === null || value === undefined ? "—" : `${Number(value).toFixed(value % 1 === 0 ? 0 : 1)} ${suffix}`;
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" });
}
