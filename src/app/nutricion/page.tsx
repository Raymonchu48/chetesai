"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Apple, CheckCircle2, Droplets, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Cliente = { _id: string; nombre: string; email: string };
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
type HabitRecord = { habito_id: string; fecha: string; completado: boolean; valor: number | null };

type NutritionData = { plan: Plan | null; habitos: Habit[]; registros: HabitRecord[] };

const defaultMeals: Meal[] = [
  { nombre: "Desayuno", hora: "08:00", descripcion: "" },
  { nombre: "Media mañana", hora: "11:00", descripcion: "" },
  { nombre: "Comida", hora: "14:00", descripcion: "" },
  { nombre: "Merienda", hora: "17:30", descripcion: "" },
  { nombre: "Cena", hora: "21:00", descripcion: "" },
];

const emptyPlan = {
  id: "",
  nombre: "Plan nutricional personalizado",
  objetivo: "",
  calorias_objetivo: "",
  proteinas_g: "",
  carbohidratos_g: "",
  grasas_g: "",
  agua_ml: "",
  recomendaciones: "",
  fecha_inicio: new Date().toISOString().slice(0, 10),
  fecha_fin: "",
  comidas: defaultMeals,
};

const emptyHabit = {
  nombre: "",
  categoria: "bienestar",
  tipo_registro: "booleano",
  objetivo_valor: "",
  unidad: "",
  instrucciones: "",
};

const categoryLabels: Record<string, string> = {
  hidratacion: "Hidratación",
  alimentacion: "Alimentación",
  descanso: "Descanso",
  actividad: "Actividad",
  bienestar: "Bienestar",
  otro: "Otro",
};

export default function NutritionPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [plan, setPlan] = useState(emptyPlan);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [records, setRecords] = useState<HabitRecord[]>([]);
  const [habitForm, setHabitForm] = useState(emptyHabit);
  const [loading, setLoading] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [savingHabit, setSavingHabit] = useState(false);

  useEffect(() => {
    fetch("/api/clientes")
      .then((response) => response.json())
      .then((result: { ok: boolean; data?: Cliente[] }) => {
        if (!result.ok) return;
        const rows = result.data || [];
        setClientes(rows);
        if (rows[0]) setClienteId(rows[0]._id);
      })
      .catch(() => toast.error("No se pudieron cargar los clientes"));
  }, []);

  const load = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/nutricion?cliente_id=${encodeURIComponent(clienteId)}`);
      const result = (await response.json()) as { ok: boolean; data?: NutritionData; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudo cargar la información");
      const current = result.data.plan;
      setPlan(current ? {
        id: current.id,
        nombre: current.nombre || "Plan nutricional personalizado",
        objetivo: current.objetivo || "",
        calorias_objetivo: current.calorias_objetivo?.toString() || "",
        proteinas_g: current.proteinas_g?.toString() || "",
        carbohidratos_g: current.carbohidratos_g?.toString() || "",
        grasas_g: current.grasas_g?.toString() || "",
        agua_ml: current.agua_ml?.toString() || "",
        recomendaciones: current.recomendaciones || "",
        fecha_inicio: current.fecha_inicio || new Date().toISOString().slice(0, 10),
        fecha_fin: current.fecha_fin || "",
        comidas: Array.isArray(current.comidas) && current.comidas.length ? current.comidas : defaultMeals,
      } : emptyPlan);
      setHabits(result.data.habitos || []);
      setRecords(result.data.registros || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toISOString().slice(0, 10);
  const todayRecords = records.filter((item) => item.fecha === today && item.completado);
  const adherenceToday = habits.length ? Math.round((todayRecords.length / habits.length) * 100) : 0;
  const selectedClient = clientes.find((item) => item._id === clienteId);

  const weeklyCompletion = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const startDate = start.toISOString().slice(0, 10);
    const relevant = records.filter((item) => item.fecha >= startDate && item.completado);
    const possible = habits.length * 7;
    return possible ? Math.round((relevant.length / possible) * 100) : 0;
  }, [records, habits]);

  async function savePlan() {
    if (!clienteId) return toast.error("Selecciona un cliente");
    setSavingPlan(true);
    try {
      const response = await fetch("/api/nutricion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_plan", cliente_id: clienteId, ...plan }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo guardar el plan");
      toast.success("Plan nutricional guardado");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSavingPlan(false);
    }
  }

  async function createHabit() {
    if (!clienteId) return toast.error("Selecciona un cliente");
    setSavingHabit(true);
    try {
      const response = await fetch("/api/nutricion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_habit", cliente_id: clienteId, ...habitForm }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo crear el hábito");
      toast.success("Hábito añadido");
      setHabitForm(emptyHabit);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear el hábito");
    } finally {
      setSavingHabit(false);
    }
  }

  async function removeHabit(id: string) {
    if (!window.confirm("¿Desactivar este hábito?")) return;
    const response = await fetch(`/api/nutricion?habito_id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const result = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !result.ok) return toast.error(result.error || "No se pudo eliminar");
    toast.success("Hábito desactivado");
    await load();
  }

  function updateMeal(index: number, field: keyof Meal, value: string) {
    setPlan((current) => ({
      ...current,
      comidas: current.comidas.map((meal, mealIndex) => mealIndex === index ? { ...meal, [field]: value } : meal),
    }));
  }

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><Apple className="h-8 w-8 text-primary" />Nutrición y hábitos</h1>
          <p className="mt-1 text-muted-foreground">Planificación nutricional, objetivos diarios y seguimiento de adherencia.</p>
        </div>

        <Card className="mb-6"><CardContent className="p-5">
          <Label>Cliente</Label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger className="mt-2 max-w-md"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
            <SelectContent>{clientes.map((client) => <SelectItem key={client._id} value={client._id}>{client.nombre} · {client.email}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent></Card>

        {loading ? <p className="py-16 text-center text-muted-foreground">Cargando nutrición y hábitos...</p> : <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Summary label="Cliente" value={selectedClient?.nombre || "—"} />
            <Summary label="Adherencia de hoy" value={`${adherenceToday}%`} />
            <Summary label="Adherencia últimos 7 días" value={`${weeklyCompletion}%`} />
          </div>

          <Card className="mb-6"><CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-xl font-bold">Plan nutricional activo</h2><p className="mt-1 text-sm text-muted-foreground">Objetivos y estructura diaria orientativa.</p></div>
              <Button onClick={savePlan} disabled={savingPlan || !clienteId}><Save className="mr-2 h-4 w-4" />{savingPlan ? "Guardando..." : "Guardar plan"}</Button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <Field label="Nombre del plan" value={plan.nombre} onChange={(value) => setPlan({ ...plan, nombre: value })} className="md:col-span-2" />
              <Field label="Fecha de inicio" type="date" value={plan.fecha_inicio} onChange={(value) => setPlan({ ...plan, fecha_inicio: value })} />
              <Field label="Fecha final" type="date" value={plan.fecha_fin} onChange={(value) => setPlan({ ...plan, fecha_fin: value })} />
              <Field label="Calorías objetivo" value={plan.calorias_objetivo} onChange={(value) => setPlan({ ...plan, calorias_objetivo: value })} />
              <Field label="Proteínas (g)" value={plan.proteinas_g} onChange={(value) => setPlan({ ...plan, proteinas_g: value })} />
              <Field label="Carbohidratos (g)" value={plan.carbohidratos_g} onChange={(value) => setPlan({ ...plan, carbohidratos_g: value })} />
              <Field label="Grasas (g)" value={plan.grasas_g} onChange={(value) => setPlan({ ...plan, grasas_g: value })} />
              <Field label="Agua diaria (ml)" value={plan.agua_ml} onChange={(value) => setPlan({ ...plan, agua_ml: value })} />
              <Field label="Objetivo" value={plan.objetivo} onChange={(value) => setPlan({ ...plan, objetivo: value })} className="md:col-span-3" />
            </div>

            <div className="mt-6"><Label>Recomendaciones profesionales</Label><Textarea className="mt-2" rows={4} value={plan.recomendaciones} onChange={(event) => setPlan({ ...plan, recomendaciones: event.target.value })} placeholder="Prioridades, sustituciones, contexto y pautas generales..." /></div>

            <div className="mt-8"><h3 className="text-lg font-bold">Estructura diaria de comidas</h3><p className="mt-1 text-sm text-muted-foreground">Orientación flexible; no sustituye una valoración clínica cuando sea necesaria.</p></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {plan.comidas.map((meal, index) => <div key={`${meal.nombre}-${index}`} className="rounded-2xl border bg-muted/20 p-4">
                <div className="grid gap-3 sm:grid-cols-[1fr_120px]"><Field label="Momento" value={meal.nombre} onChange={(value) => updateMeal(index, "nombre", value)} /><Field label="Hora" type="time" value={meal.hora} onChange={(value) => updateMeal(index, "hora", value)} /></div>
                <div className="mt-3"><Label>Propuesta</Label><Textarea className="mt-2" rows={3} value={meal.descripcion} onChange={(event) => updateMeal(index, "descripcion", event.target.value)} placeholder="Alimentos, cantidades orientativas y alternativas..." /></div>
              </div>)}
            </div>
          </CardContent></Card>

          <Card><CardContent className="p-6">
            <div><h2 className="text-xl font-bold">Hábitos diarios</h2><p className="mt-1 text-sm text-muted-foreground">Define acciones concretas que el cliente registrará desde su portal.</p></div>

            <div className="mt-6 grid gap-4 rounded-2xl border bg-muted/20 p-4 md:grid-cols-6">
              <Field label="Nombre" value={habitForm.nombre} onChange={(value) => setHabitForm({ ...habitForm, nombre: value })} className="md:col-span-2" />
              <div><Label>Categoría</Label><Select value={habitForm.categoria} onValueChange={(value) => setHabitForm({ ...habitForm, categoria: value })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categoryLabels).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Registro</Label><Select value={habitForm.tipo_registro} onValueChange={(value) => setHabitForm({ ...habitForm, tipo_registro: value })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="booleano">Sí / no</SelectItem><SelectItem value="cantidad">Cantidad</SelectItem></SelectContent></Select></div>
              <Field label="Objetivo" value={habitForm.objetivo_valor} onChange={(value) => setHabitForm({ ...habitForm, objetivo_valor: value })} disabled={habitForm.tipo_registro !== "cantidad"} />
              <Field label="Unidad" type="text" value={habitForm.unidad} onChange={(value) => setHabitForm({ ...habitForm, unidad: value })} disabled={habitForm.tipo_registro !== "cantidad"} />
              <Field label="Instrucciones" type="text" value={habitForm.instrucciones} onChange={(value) => setHabitForm({ ...habitForm, instrucciones: value })} className="md:col-span-5" />
              <div className="flex items-end"><Button className="w-full" onClick={createHabit} disabled={savingHabit}><Plus className="mr-2 h-4 w-4" />{savingHabit ? "Añadiendo..." : "Añadir hábito"}</Button></div>
            </div>

            <div className="mt-5 space-y-3">
              {!habits.length ? <p className="py-8 text-center text-muted-foreground">Todavía no hay hábitos configurados.</p> : habits.map((habit) => {
                const completed = records.some((record) => record.habito_id === habit.id && record.fecha === today && record.completado);
                return <div key={habit.id} className="flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3"><div className={`grid h-10 w-10 place-items-center rounded-full ${completed ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{habit.categoria === "hidratacion" ? <Droplets className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</div><div><p className="font-bold">{habit.nombre}</p><p className="mt-1 text-sm text-muted-foreground">{categoryLabels[habit.categoria] || habit.categoria}{habit.tipo_registro === "cantidad" ? ` · objetivo ${habit.objetivo_valor || "—"} ${habit.unidad || ""}` : " · completar diariamente"}</p>{habit.instrucciones ? <p className="mt-1 text-xs text-muted-foreground">{habit.instrucciones}</p> : null}</div></div>
                  <div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${completed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{completed ? "Completado hoy" : "Pendiente hoy"}</span><Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeHabit(habit.id)}><Trash2 className="h-4 w-4" /></Button></div>
                </div>;
              })}
            </div>
          </CardContent></Card>
        </>}
      </div>
    </AppSidebar>
  );
}

function Field({ label, value, onChange, type = "number", className = "", disabled = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; className?: string; disabled?: boolean }) {
  return <div className={className}><Label>{label}</Label><Input className="mt-2" type={type} step={type === "number" ? "0.1" : undefined} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} /></div>;
}
function Summary({ label, value }: { label: string; value: string }) { return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></CardContent></Card>; }
