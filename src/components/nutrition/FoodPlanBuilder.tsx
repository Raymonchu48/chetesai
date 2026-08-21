"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Apple, Calculator, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FoodCategoryVisual from "@/components/nutrition/FoodCategoryVisual";

export type PlanFood = {
  alimento_id: string;
  nombre: string;
  cantidad_g: number;
  energia_kcal: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  categoria?: string;
};

export type StructuredMeal = {
  nombre: string;
  hora: string;
  descripcion: string;
  alimentos: PlanFood[];
};

type Food = {
  id: string;
  nombre: string;
  categoria: string;
  marca: string | null;
  porcion_nombre: string;
  porcion_gramos: number;
  energia_kcal: number;
  proteinas_g: number;
  carbohidratos_g: number;
  grasas_g: number;
  fibra_g: number;
  alergenos: string[];
  fuente: string;
  es_personalizado: boolean;
};

const categories: Record<string, string> = {
  todas: "Todas las categorías",
  cereales: "Cereales",
  tuberculos: "Tubérculos",
  carnes: "Carnes",
  pescados: "Pescados",
  huevos: "Huevos",
  lacteos: "Lácteos",
  legumbres: "Legumbres",
  frutas: "Frutas",
  verduras: "Verduras",
  grasas: "Aceites y grasas",
  frutos_secos: "Frutos secos",
  otros: "Otros",
};

const emptyCustomFood = {
  nombre: "",
  categoria: "otros",
  marca: "",
  porcion_nombre: "100 g",
  porcion_gramos: "100",
  energia_kcal: "",
  proteinas_g: "",
  carbohidratos_g: "",
  grasas_g: "",
  fibra_g: "",
};

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function totals(foods: PlanFood[]) {
  return foods.reduce(
    (sum, food) => ({
      kcal: sum.kcal + food.energia_kcal,
      protein: sum.protein + food.proteinas_g,
      carbs: sum.carbs + food.carbohidratos_g,
      fat: sum.fat + food.grasas_g,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export default function FoodPlanBuilder({ meals, onChange }: { meals: StructuredMeal[]; onChange: (meals: StructuredMeal[]) => void }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("todas");
  const [targetMeal, setTargetMeal] = useState("0");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [customOpen, setCustomOpen] = useState(false);
  const [custom, setCustom] = useState(emptyCustomFood);
  const [savingCustom, setSavingCustom] = useState(false);

  const loadFoods = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/alimentos", { cache: "no-store" });
      const result = (await response.json()) as { ok: boolean; data?: Food[]; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo cargar la biblioteca");
      setFoods(result.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la biblioteca de alimentos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFoods(); }, [loadFoods]);

  const visibleFoods = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    return foods.filter((food) => {
      const matchesCategory = category === "todas" || food.categoria === category;
      const matchesSearch = !query || `${food.nombre} ${food.marca || ""}`.toLocaleLowerCase("es").includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [foods, search, category]);

  const dayTotals = useMemo(() => totals(meals.flatMap((meal) => meal.alimentos || [])), [meals]);

  function addFood(food: Food) {
    const mealIndex = Number(targetMeal);
    const quantity = Number(quantities[food.id] || food.porcion_gramos || 100);
    if (!Number.isFinite(quantity) || quantity <= 0) return toast.error("Indica una cantidad válida");
    const factor = quantity / 100;
    const item: PlanFood = {
      alimento_id: food.id,
      nombre: food.nombre,
      cantidad_g: round(quantity, 2),
      energia_kcal: round(food.energia_kcal * factor),
      proteinas_g: round(food.proteinas_g * factor),
      carbohidratos_g: round(food.carbohidratos_g * factor),
      grasas_g: round(food.grasas_g * factor),
      categoria: food.categoria,
    };
    onChange(meals.map((meal, index) => index === mealIndex ? { ...meal, alimentos: [...(meal.alimentos || []), item] } : meal));
    toast.success(`${food.nombre} añadido a ${meals[mealIndex]?.nombre || "la comida"}`);
  }

  function removeFood(mealIndex: number, foodIndex: number) {
    onChange(meals.map((meal, index) => index === mealIndex
      ? { ...meal, alimentos: meal.alimentos.filter((_, itemIndex) => itemIndex !== foodIndex) }
      : meal));
  }

  function changeQuantity(mealIndex: number, foodIndex: number, quantity: number) {
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    const old = meals[mealIndex].alimentos[foodIndex];
    const factor = old.cantidad_g > 0 ? quantity / old.cantidad_g : 0;
    onChange(meals.map((meal, index) => index === mealIndex ? {
      ...meal,
      alimentos: meal.alimentos.map((food, indexFood) => indexFood === foodIndex ? {
        ...food,
        cantidad_g: quantity,
        energia_kcal: round(food.energia_kcal * factor),
        proteinas_g: round(food.proteinas_g * factor),
        carbohidratos_g: round(food.carbohidratos_g * factor),
        grasas_g: round(food.grasas_g * factor),
      } : food),
    } : meal));
  }

  async function createCustomFood() {
    if (!custom.nombre.trim()) return toast.error("Escribe el nombre del alimento");
    setSavingCustom(true);
    try {
      const response = await fetch("/api/alimentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(custom),
      });
      const result = (await response.json()) as { ok: boolean; data?: Food; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo crear el alimento");
      setCustom(emptyCustomFood);
      setCustomOpen(false);
      await loadFoods();
      toast.success("Alimento personalizado guardado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el alimento");
    } finally {
      setSavingCustom(false);
    }
  }

  return (
    <div className="mt-8 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold"><Apple className="h-5 w-5 text-[#46624f]" />Biblioteca de alimentos</h3>
          <p className="mt-1 text-sm text-muted-foreground">Busca un alimento, indica la cantidad y añádelo a la comida elegida.</p>
        </div>
        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
          <DialogTrigger asChild><Button variant="outline"><Plus className="mr-2 h-4 w-4" />Crear alimento propio</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>Nuevo alimento personalizado</DialogTitle><DialogDescription>Introduce los valores por 100 g según la etiqueta o una fuente fiable.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-3 sm:grid-cols-2">
              <CustomField label="Nombre" value={custom.nombre} onChange={(value) => setCustom({ ...custom, nombre: value })} text />
              <CustomField label="Marca (opcional)" value={custom.marca} onChange={(value) => setCustom({ ...custom, marca: value })} text />
              <div><Label>Categoría</Label><Select value={custom.categoria} onValueChange={(value) => setCustom({ ...custom, categoria: value })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categories).filter(([key]) => key !== "todas").map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
              <CustomField label="Medida habitual" value={custom.porcion_nombre} onChange={(value) => setCustom({ ...custom, porcion_nombre: value })} text />
              <CustomField label="Gramos por medida" value={custom.porcion_gramos} onChange={(value) => setCustom({ ...custom, porcion_gramos: value })} />
              <CustomField label="Energía (kcal/100 g)" value={custom.energia_kcal} onChange={(value) => setCustom({ ...custom, energia_kcal: value })} />
              <CustomField label="Proteínas (g/100 g)" value={custom.proteinas_g} onChange={(value) => setCustom({ ...custom, proteinas_g: value })} />
              <CustomField label="Carbohidratos (g/100 g)" value={custom.carbohidratos_g} onChange={(value) => setCustom({ ...custom, carbohidratos_g: value })} />
              <CustomField label="Grasas (g/100 g)" value={custom.grasas_g} onChange={(value) => setCustom({ ...custom, grasas_g: value })} />
              <CustomField label="Fibra (g/100 g)" value={custom.fibra_g} onChange={(value) => setCustom({ ...custom, fibra_g: value })} />
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setCustomOpen(false)}>Cancelar</Button><Button onClick={createCustomFood} disabled={savingCustom}>{savingCustom ? "Guardando..." : "Guardar alimento"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div><Label>Buscar</Label><div className="relative mt-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Avena, pollo, yogur..." /></div></div>
        <div><Label>Categoría</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categories).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Añadir a</Label><Select value={targetMeal} onValueChange={setTargetMeal}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{meals.map((meal, index) => <SelectItem key={`${meal.nombre}-${index}`} value={String(index)}>{meal.nombre || `Comida ${index + 1}`}</SelectItem>)}</SelectContent></Select></div>
      </div>

      <div className="max-h-[430px] overflow-y-auto rounded-2xl border">
        {loading ? <p className="p-10 text-center text-sm text-muted-foreground">Cargando alimentos...</p> : !visibleFoods.length ? <p className="p-10 text-center text-sm text-muted-foreground">No se encontraron alimentos.</p> : <div className="divide-y">
          {visibleFoods.map((food) => <div key={food.id} className="grid gap-3 p-4 transition hover:bg-muted/30 lg:grid-cols-[minmax(220px,1fr)_330px_100px_100px] lg:items-center">
            <div className="flex items-center gap-3"><FoodCategoryVisual category={food.categoria} name={food.nombre} compact /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{food.nombre}</p>{food.es_personalizado ? <Badge variant="secondary">Propio</Badge> : null}</div><p className="mt-1 text-xs text-muted-foreground">{categories[food.categoria] || food.categoria}{food.marca ? ` · ${food.marca}` : ""} · {food.fuente}</p></div></div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs"><Nutrient label="kcal" value={food.energia_kcal} /><Nutrient label="Prot." value={`${food.proteinas_g} g`} /><Nutrient label="HC" value={`${food.carbohidratos_g} g`} /><Nutrient label="Grasa" value={`${food.grasas_g} g`} /></div>
            <div><Label className="text-xs">Cantidad (g)</Label><Input className="mt-1 h-9" type="number" min="1" step="1" value={quantities[food.id] ?? String(food.porcion_gramos || 100)} onChange={(event) => setQuantities((current) => ({ ...current, [food.id]: event.target.value }))} /></div>
            <Button size="sm" onClick={() => addFood(food)}><Plus className="mr-1 h-4 w-4" />Añadir</Button>
          </div>)}
        </div>}
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-lg font-bold"><Calculator className="h-5 w-5 text-[#46624f]" />Composición del día</h3>
        <div className="mt-3 grid gap-4 xl:grid-cols-2">
          {meals.map((meal, mealIndex) => {
            const mealTotals = totals(meal.alimentos || []);
            return <Card key={`${meal.nombre}-${mealIndex}`} className="overflow-hidden"><CardContent className="p-0">
              <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3"><div><p className="font-bold">{meal.nombre}</p><p className="text-xs text-muted-foreground">{meal.hora}</p></div><p className="text-sm font-bold text-[#46624f]">{round(mealTotals.kcal)} kcal</p></div>
              {!meal.alimentos?.length ? <p className="p-5 text-center text-sm text-muted-foreground">Sin alimentos seleccionados</p> : <div className="divide-y">{meal.alimentos.map((food, foodIndex) => <div key={`${food.alimento_id}-${foodIndex}`} className="grid grid-cols-[minmax(0,1fr)_90px_80px_36px] items-center gap-2 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3"><FoodCategoryVisual category={food.categoria} name={food.nombre} compact /><div className="min-w-0"><p className="truncate text-sm font-medium">{food.nombre}</p><p className="truncate text-xs text-muted-foreground">P {food.proteinas_g} · HC {food.carbohidratos_g} · G {food.grasas_g}</p></div></div>
                <Input type="number" min="0" className="h-8" value={food.cantidad_g} onChange={(event) => changeQuantity(mealIndex, foodIndex, Number(event.target.value))} />
                <p className="text-right text-xs font-semibold">{food.energia_kcal} kcal</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFood(mealIndex, foodIndex)} aria-label={`Eliminar ${food.nombre}`}><Trash2 className="h-4 w-4" /></Button>
              </div>)}</div>}
            </CardContent></Card>;
          })}
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[#cfd9d1] bg-[#f4f7f4] p-4 sm:grid-cols-4">
        <Total label="Energía diaria" value={`${round(dayTotals.kcal)} kcal`} />
        <Total label="Proteínas" value={`${round(dayTotals.protein)} g`} />
        <Total label="Carbohidratos" value={`${round(dayTotals.carbs)} g`} />
        <Total label="Grasas" value={`${round(dayTotals.fat)} g`} />
      </div>
    </div>
  );
}

function Nutrient({ label, value }: { label: string; value: string | number }) { return <div className="rounded-lg bg-muted/60 px-2 py-1.5"><p className="font-bold">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>; }
function Total({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-lg font-bold text-[#314a39]">{value}</p></div>; }
function CustomField({ label, value, onChange, text = false }: { label: string; value: string; onChange: (value: string) => void; text?: boolean }) { return <div><Label>{label}</Label><Input className="mt-2" type={text ? "text" : "number"} min={text ? undefined : "0"} step={text ? undefined : "0.1"} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
