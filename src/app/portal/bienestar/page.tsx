"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Apple, ArrowLeft, Check, Circle, Droplets, HeartPulse, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type Meal = { nombre: string; hora: string; descripcion: string };
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
      const response = await fetch("/api/portal/bienestar");
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

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#29312e]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold tracking-[0.22em] text-[#c9653b]">CHETESAÍ FITNESS+</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight"><Apple className="h-8 w-8 text-[#46624f]" />Nutrición y hábitos</h1><p className="mt-2 text-sm text-[#707872]">{data?.cliente?.nombre ? `Hola, ${data.cliente.nombre}. Tu planificación y objetivos diarios están aquí.` : "Tu planificación personal."}</p></div>
          <div className="flex w-full flex-wrap gap-2 sm:w-auto"><Button asChild variant="outline"><Link href="/portal"><ArrowLeft className="mr-2 h-4 w-4" />Entrenamiento</Link></Button><Button asChild variant="outline"><Link href="/portal/progreso"><TrendingUp className="mr-2 h-4 w-4" />Mi progreso</Link></Button><div className="w-48 rounded-xl border border-[#e7dfd3] bg-white p-1 text-[#46624f]"><LogoutButton /></div></div>
        </header>

        {loading ? <p className="py-16 text-center text-[#707872]">Cargando tu planificación...</p> : !data ? null : <>
          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <Metric label="Hábitos completados hoy" value={`${completedToday}/${data.habitos.length}`} />
            <Metric label="Progreso de hoy" value={`${progress}%`} />
            <Metric label="Adherencia últimos 7 días" value={`${weeklyProgress}%`} />
          </section>

          {!data.plan ? <Card className="mb-6"><CardContent className="py-14 text-center"><Apple className="mx-auto h-10 w-10 text-[#707872]" /><h2 className="mt-4 text-xl font-bold">Todavía no tienes un plan nutricional activo</h2><p className="mt-2 text-[#707872]">Tu profesional podrá publicarlo desde el panel de seguimiento.</p></CardContent></Card> : <>
            <Card className="mb-6"><CardContent className="p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#46624f]">Plan activo</p><h2 className="mt-2 text-2xl font-bold">{data.plan.nombre}</h2><p className="mt-2 text-sm leading-6 text-[#707872]">{data.plan.objetivo || "Plan adaptado a tus objetivos y evolución."}</p></div><span className="rounded-full bg-[#eef5ef] px-4 py-2 text-xs font-semibold text-[#46624f]">Desde {formatDate(data.plan.fecha_inicio)}</span></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><PlanMetric label="Energía" value={formatNumber(data.plan.calorias_objetivo, "kcal")} /><PlanMetric label="Proteínas" value={formatNumber(data.plan.proteinas_g, "g")} /><PlanMetric label="Carbohidratos" value={formatNumber(data.plan.carbohidratos_g, "g")} /><PlanMetric label="Grasas" value={formatNumber(data.plan.grasas_g, "g")} /><PlanMetric label="Agua" value={formatNumber(data.plan.agua_ml, "ml")} /></div>
              {data.plan.recomendaciones ? <div className="mt-6 rounded-2xl bg-[#f0ede7] p-5"><p className="text-sm font-bold">Recomendaciones</p><p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#59635d]">{data.plan.recomendaciones}</p></div> : null}
            </CardContent></Card>

            {Array.isArray(data.plan.comidas) && data.plan.comidas.length ? <section className="mb-6"><div className="mb-4"><h2 className="text-xl font-bold">Tu estructura diaria</h2><p className="mt-1 text-sm text-[#707872]">Utiliza estas propuestas con flexibilidad y siguiendo las indicaciones profesionales.</p></div><div className="grid gap-4 md:grid-cols-2">{data.plan.comidas.map((meal, index) => <Card key={`${meal.nombre}-${index}`}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{meal.nombre}</h3><p className="mt-1 text-sm text-[#707872]">{meal.descripcion || "Sin propuesta específica."}</p></div>{meal.hora ? <span className="rounded-full bg-[#eef5ef] px-3 py-1 text-xs font-semibold text-[#46624f]">{meal.hora}</span> : null}</div></CardContent></Card>)}</div></section> : null}
          </>}

          <section>
            <div className="mb-4"><h2 className="text-xl font-bold">Hábitos de hoy</h2><p className="mt-1 text-sm text-[#707872]">Registra lo que has completado. La constancia suele ganar por puntos, no por nocaut.</p></div>
            {!data.habitos.length ? <Card><CardContent className="py-12 text-center text-[#707872]">Todavía no tienes hábitos asignados.</CardContent></Card> : <div className="space-y-4">{data.habitos.map((habit) => {
              const record = recordFor(habit.id);
              const done = Boolean(record?.completado);
              return <Card key={habit.id} className={done ? "border-[#b8d4be] bg-[#f7fbf7]" : ""}><CardContent className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-4"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${done ? "bg-[#46624f] text-white" : "bg-[#eef0ec] text-[#707872]"}`}>{habit.categoria === "hidratacion" ? <Droplets className="h-6 w-6" /> : <HeartPulse className="h-6 w-6" />}</div><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#707872]">{categoryLabels[habit.categoria] || habit.categoria}</p><h3 className="mt-1 font-bold">{habit.nombre}</h3>{habit.instrucciones ? <p className="mt-1 text-sm text-[#707872]">{habit.instrucciones}</p> : null}{habit.tipo_registro === "cantidad" && habit.objetivo_valor ? <p className="mt-1 text-xs font-semibold text-[#46624f]">Objetivo: {habit.objetivo_valor} {habit.unidad || ""}</p> : null}</div></div>
                {habit.tipo_registro === "booleano" ? <Button onClick={() => saveHabit(habit, !done)} disabled={savingId === habit.id} className={done ? "bg-[#46624f] hover:bg-[#3b5543]" : "bg-[#c9653b] hover:bg-[#b65a35]"}>{done ? <Check className="mr-2 h-4 w-4" /> : <Circle className="mr-2 h-4 w-4" />}{savingId === habit.id ? "Guardando..." : done ? "Completado" : "Marcar como hecho"}</Button> : <div className="flex w-full gap-2 sm:w-auto"><Input type="number" step="0.1" min="0" className="w-full sm:w-32" value={quantities[habit.id] || ""} onChange={(event) => setQuantities({ ...quantities, [habit.id]: event.target.value })} placeholder={habit.unidad || "Cantidad"} /><Button onClick={() => saveHabit(habit)} disabled={savingId === habit.id} className="bg-[#46624f] hover:bg-[#3b5543]">{savingId === habit.id ? "Guardando..." : "Guardar"}</Button></div>}
              </div></CardContent></Card>;
            })}</div>}
          </section>
        </>}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <Card><CardContent className="p-5"><p className="text-sm text-[#707872]">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>; }
function PlanMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-[#f0ede7] p-4"><p className="text-xs text-[#707872]">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div>; }
function formatNumber(value: number | null | undefined, suffix: string) { return value === null || value === undefined ? "—" : `${Number(value).toFixed(value % 1 === 0 ? 0 : 1)} ${suffix}`; }
function formatDate(value: string) { return new Date(`${value}T12:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }); }
