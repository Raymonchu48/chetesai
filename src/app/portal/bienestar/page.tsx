"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Apple,
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

type MealFood = { nombre: string; cantidad_g: number; energia_kcal: number; proteinas_g: number; carbohidratos_g: number; grasas_g: number };
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
                      <div className="space-y-4">
                        {data.plan.comidas.map((meal, index) => (
                          <Card key={`${meal.nombre}-${index}`} className="overflow-hidden border-[#e3ddd3] bg-[#fffdf9] shadow-sm">
                            <CardContent className="p-0">
                              <div className="grid sm:grid-cols-[88px_1fr]">
                                <div className="flex items-center justify-center bg-[#f0f4ef] px-4 py-5 sm:flex-col sm:gap-2">
                                  <span className="mr-3 grid h-10 w-10 place-items-center rounded-full bg-[#46624f] text-sm font-black text-white sm:mr-0">{index + 1}</span>
                                  {meal.hora ? <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#46624f]"><Clock3 className="h-3.5 w-3.5" />{meal.hora}</span> : null}
                                </div>
                                <div className="p-5 sm:p-6">
                                  <h4 className="text-lg font-bold">{meal.nombre}</h4>
                                  <p className={`mt-2 whitespace-pre-line text-sm leading-7 ${meal.descripcion ? "text-[#4f5c55]" : "italic text-[#929891]"}`}>
                                    {meal.descripcion || (meal.alimentos?.length ? "Selección preparada por tu profesional." : "Pendiente de propuesta profesional.")}
                                  </p>
                                  {meal.alimentos?.length ? <div className="mt-4 overflow-hidden rounded-2xl border border-[#e3ddd3] bg-white">
                                    {meal.alimentos.map((food, foodIndex) => <div key={`${food.nombre}-${foodIndex}`} className="flex items-center justify-between gap-4 border-b border-[#eee9e1] px-4 py-3 last:border-b-0">
                                      <div><p className="text-sm font-semibold">{food.nombre}</p><p className="mt-0.5 text-xs text-[#707872]">{food.cantidad_g} g · P {food.proteinas_g} g · HC {food.carbohidratos_g} g · G {food.grasas_g} g</p></div>
                                      <span className="shrink-0 rounded-full bg-[#eef5ef] px-3 py-1 text-xs font-bold text-[#46624f]">{food.energia_kcal} kcal</span>
                                    </div>)}
                                  </div> : null}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
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
