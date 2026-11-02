"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Apple, Calculator, Carrot, Leaf, Plus, Search, Trash2, Wheat } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { foodUnit, nutritionUndeclared, normalizeFoodSearch, nutritionTotals as totals, scaleFoodNutrients, type FoodUnit } from "@/lib/nutrition-foods";
import FoodCategoryVisual from "@/components/nutrition/FoodCategoryVisual";

export type PlanFood = {
  alimento_id: string;
  nombre: string;
  cantidad_g: number;
  unidad_medida?: FoodUnit;
  macros_no_declarados?: boolean;
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
  unidad_medida?: FoodUnit;
  macros_no_declarados?: boolean;
  etiquetas?: string[];
  notas?: string | null;
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
  lacteos: "Leches y yogures",
  bebidas: "Bebidas y café",
  bebidas_vegetales: "Bebidas vegetales",
  suplementos: "Batidos y suplementos",
  legumbres: "Legumbres",
  frutas: "Frutas",
  verduras: "Verduras",
  grasas: "Aceites y grasas",
  frutos_secos: "Frutos secos",
  otros: "Otros",
};

const emptyCustomFood = {
  nombre: "",
  unidad_medida: "g" as FoodUnit,
  macros_no_declarados: false,
  fuente: "",
  notas: "",
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


export default function FoodPlanBuilder({ meals, onChange }: { meals: StructuredMeal[]; onChange: (meals: StructuredMeal[]) => void }) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedDay, setSelectedDay] = useState("Lunes");
  const weekDays = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"];
  const isWeekly = meals.some(meal => weekDays.some(day => meal.nombre.startsWith(`${day} · `)));
  const visibleMeals = meals.map((meal,index)=>({meal,index})).filter(({meal})=>!isWeekly || meal.nombre.startsWith(`${selectedDay} · `));
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
    const query = normalizeFoodSearch(search.trim());
    return foods.filter((food) => {
      const matchesCategory = category === "todas" || food.categoria === category;
      const matchesSearch = !query || normalizeFoodSearch(`${food.nombre} ${food.marca || ""} ${categories[food.categoria] || ""} ${(food.etiquetas || []).join(" ")}`).includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [foods, search, category]);

  const dayTotals = useMemo(() => totals(visibleMeals.flatMap(({meal}) => meal.alimentos || [])), [visibleMeals]);

  function addFood(food: Food) {
    const mealIndex = isWeekly && !visibleMeals.some(item=>item.index===Number(targetMeal)) ? visibleMeals[0]?.index : Number(targetMeal);
    if(mealIndex === undefined) return toast.error("No hay comidas para este día");
    const quantity = Number(quantities[food.id] || food.porcion_gramos || 100);
    if (!Number.isFinite(quantity) || quantity <= 0) return toast.error("Indica una cantidad válida");
    const item: PlanFood = {
      alimento_id: food.id,
      nombre: food.nombre,
      cantidad_g: round(quantity, 2),
      unidad_medida: foodUnit(food),
      macros_no_declarados: nutritionUndeclared(food),
      ...scaleFoodNutrients(food, quantity),
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
          <p className="mt-1 text-sm text-muted-foreground">Alimentos, bebidas y suplementos. Valores por 100 g o 100 ml según la ficha; cantidades editables.</p>
        </div>
        <Dialog open={customOpen} onOpenChange={setCustomOpen}>
          <DialogTrigger asChild><Button variant="outline"><Plus className="mr-2 h-4 w-4" />Crear alimento propio</Button></DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>Nuevo alimento personalizado</DialogTitle><DialogDescription>Introduce los valores por 100 g o 100 ml según la etiqueta del producto.</DialogDescription></DialogHeader>
            <div className="grid gap-4 py-3 sm:grid-cols-2">
              <CustomField label="Nombre" value={custom.nombre} onChange={(value) => setCustom({ ...custom, nombre: value })} text />
              <CustomField label="Marca (opcional)" value={custom.marca} onChange={(value) => setCustom({ ...custom, marca: value })} text />
              <div><Label>Categoría</Label><Select value={custom.categoria} onValueChange={(value) => setCustom({ ...custom, categoria: value })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categories).filter(([key]) => key !== "todas").map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
              <CustomField label="Medida habitual" value={custom.porcion_nombre} onChange={(value) => setCustom({ ...custom, porcion_nombre: value })} text />
              <div><Label>Unidad de cantidad y referencia nutricional</Label><Select value={custom.unidad_medida} onValueChange={(value: FoodUnit) => setCustom({ ...custom, unidad_medida: value, porcion_nombre: `100 ${value}` })}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="g">Gramos · valores por 100 g</SelectItem><SelectItem value="ml">Mililitros · valores por 100 ml</SelectItem></SelectContent></Select></div>
              <CustomField label={`Cantidad por medida (${custom.unidad_medida})`} value={custom.porcion_gramos} onChange={(value) => setCustom({ ...custom, porcion_gramos: value })} />
              <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={custom.macros_no_declarados} onChange={(event) => setCustom({ ...custom, macros_no_declarados: event.target.checked })} />La etiqueta no declara kcal y macros completos</label>
              {!custom.macros_no_declarados ? <>
              <CustomField label={`Energía (kcal/100 ${custom.unidad_medida})`} value={custom.energia_kcal} onChange={(value) => setCustom({ ...custom, energia_kcal: value })} />
              <CustomField label={`Proteínas (g/100 ${custom.unidad_medida})`} value={custom.proteinas_g} onChange={(value) => setCustom({ ...custom, proteinas_g: value })} />
              <CustomField label={`Carbohidratos (g/100 ${custom.unidad_medida})`} value={custom.carbohidratos_g} onChange={(value) => setCustom({ ...custom, carbohidratos_g: value })} />
              <CustomField label={`Grasas (g/100 ${custom.unidad_medida})`} value={custom.grasas_g} onChange={(value) => setCustom({ ...custom, grasas_g: value })} />
              <CustomField label={`Fibra (g/100 ${custom.unidad_medida})`} value={custom.fibra_g} onChange={(value) => setCustom({ ...custom, fibra_g: value })} />
              </> : null}
              <CustomField label="Fuente o enlace a la etiqueta" value={custom.fuente} onChange={(value) => setCustom({ ...custom, fuente: value })} text />
              <CustomField label="Preparación y notas" value={custom.notas} onChange={(value) => setCustom({ ...custom, notas: value })} text />
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setCustomOpen(false)}>Cancelar</Button><Button onClick={createCustomFood} disabled={savingCustom}>{savingCustom ? "Guardando..." : "Guardar alimento"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 rounded-2xl border bg-muted/20 p-4 md:grid-cols-[minmax(0,1fr)_220px_220px]">
        <div><Label>Buscar</Label><div className="relative mt-2"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Café, bebida vegetal, proteína, creatina..." /></div></div>
        <div><Label>Categoría</Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categories).map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Añadir a</Label><Select value={targetMeal} onValueChange={setTargetMeal}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{visibleMeals.map(({meal,index}) => <SelectItem key={`${meal.nombre}-${index}`} value={String(index)}>{meal.nombre || `Comida ${index + 1}`}</SelectItem>)}</SelectContent></Select></div>
      </div>

      <div className="max-h-[430px] overflow-y-auto rounded-2xl border">
        {loading ? <p className="p-10 text-center text-sm text-muted-foreground">Cargando alimentos...</p> : !visibleFoods.length ? <p className="p-10 text-center text-sm text-muted-foreground">No se encontraron alimentos.</p> : <div className="divide-y">
          {visibleFoods.map((food) => <div key={food.id} className="grid gap-3 p-4 transition hover:bg-muted/30 sm:grid-cols-2 2xl:grid-cols-[minmax(220px,1fr)_330px_100px_100px] 2xl:items-center">
            <div className="flex items-center gap-3 sm:col-span-2 2xl:col-span-1"><FoodCategoryVisual category={food.categoria} name={food.nombre} compact /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{food.nombre}</p>{food.es_personalizado ? <Badge variant="secondary">Propio</Badge> : null}</div><p className="mt-1 text-xs text-muted-foreground">{categories[food.categoria] || food.categoria}{food.marca ? ` · ${food.marca}` : ""} · {food.fuente.startsWith("https://") ? <a href={food.fuente} target="_blank" rel="noopener noreferrer" className="underline">Ficha de referencia</a> : food.fuente}</p><p className="mt-1 text-xs text-muted-foreground">Valores por 100 {foodUnit(food)} · Medida de catálogo: {food.porcion_gramos} {foodUnit(food)}</p>{food.notas ? <details className="mt-1 text-xs text-muted-foreground"><summary className="cursor-pointer">Preparación y referencia</summary><p className="mt-1 whitespace-pre-wrap break-words">{food.notas}</p></details> : null}</div></div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs sm:col-span-2 2xl:col-span-1"><Nutrient label="kcal" value={nutritionUndeclared(food) ? "N/D" : food.energia_kcal} /><Nutrient label="Prot." value={nutritionUndeclared(food) ? "N/D" : `${food.proteinas_g} g`} /><Nutrient label="HC" value={nutritionUndeclared(food) ? "N/D" : `${food.carbohidratos_g} g`} /><Nutrient label="Grasa" value={nutritionUndeclared(food) ? "N/D" : `${food.grasas_g} g`} /></div>
            <div><Label className="text-xs">Cantidad ({foodUnit(food)})</Label><Input aria-label={`Cantidad de ${food.nombre} (${foodUnit(food)})`} className="mt-1 h-9" type="number" min="0.01" step="0.01" value={quantities[food.id] ?? String(food.porcion_gramos || 100)} onChange={(event) => setQuantities((current) => ({ ...current, [food.id]: event.target.value }))} /></div>
            <Button size="sm" onClick={() => addFood(food)}><Plus className="mr-1 h-4 w-4" />Añadir</Button>
          </div>)}
        </div>}
      </div>

      <div>
        <h3 className="flex items-center gap-2 text-lg font-bold"><Calculator className="h-5 w-5 text-[#46624f]" />Composición del día</h3>
        {isWeekly && <div className="mt-3 flex flex-wrap gap-2">{weekDays.map(day=><Button key={day} type="button" size="sm" variant={selectedDay === day ? "default":"outline"} onClick={()=>{setSelectedDay(day);const index=meals.findIndex(meal=>meal.nombre.startsWith(`${day} · `));if(index>=0)setTargetMeal(String(index));}}>{day}</Button>)}</div>}
        <div className="mt-3 grid gap-4 xl:grid-cols-2">
          {visibleMeals.map(({meal,index:mealIndex}) => {
            const mealTotals = totals(meal.alimentos || []);
            return <Card key={`${meal.nombre}-${mealIndex}`} className="relative isolate overflow-hidden border-[#cbd9ce] bg-[#f8fbf7]"><CardContent className="relative p-0">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden text-[#618a65]">
                <Leaf className="absolute -left-7 top-12 h-28 w-28 -rotate-45 opacity-30" strokeWidth={1.15} />
                <Carrot className="absolute -right-5 top-20 h-32 w-32 rotate-[-24deg] opacity-30" strokeWidth={1.1} />
                <Wheat className="absolute -bottom-8 right-16 h-32 w-32 rotate-12 opacity-[0.09]" strokeWidth={1.1} />
                <Apple className="absolute -bottom-9 -left-9 h-28 w-28 opacity-25" strokeWidth={1.15} />
              </div>
              <div className="relative z-10 flex items-center justify-between border-b border-[#d2ddd4] bg-[#edf3ee]/90 px-4 py-3"><div><p className="text-base font-bold !text-[#253e31]">{meal.nombre}</p><p className="text-xs font-medium !text-[#53645a]">{meal.hora}</p></div><p className="text-sm font-bold text-[#46624f]">{round(mealTotals.kcal)} kcal{meal.alimentos?.some(nutritionUndeclared) ? " · parcial" : ""}</p></div>
              {!meal.alimentos?.length ? <p className="p-5 text-center text-sm text-muted-foreground">{meal.descripcion || "Sin alimentos seleccionados"}</p> : <div className="divide-y">{meal.alimentos.map((food, foodIndex) => <div key={`${food.alimento_id}-${foodIndex}`} className="relative z-10 grid grid-cols-[minmax(0,1fr)_90px_80px_36px] items-center gap-2 border-b border-[#dce5dd] bg-white/75 px-4 py-3 last:border-b-0">
                <div className="flex min-w-0 items-center gap-3"><FoodCategoryVisual category={food.categoria} name={food.nombre} compact /><div className="min-w-0"><p className="truncate text-sm font-semibold !text-[#253e31]">{food.nombre}</p><p className="mt-1 truncate text-xs font-medium text-[#53645a]">{nutritionUndeclared(food) ? "Kcal/macros no declarados" : `P ${food.proteinas_g} · HC ${food.carbohidratos_g} · G ${food.grasas_g}`} · {foodUnit(food)}</p></div></div>
                <Input aria-label={`Cantidad de ${food.nombre} (${foodUnit(food)})`} type="number" min="0.01" step="0.01" className="h-8" value={food.cantidad_g} onChange={(event) => changeQuantity(mealIndex, foodIndex, Number(event.target.value))} />
                <p className="rounded-full bg-[#e6efe8] px-2 py-1 text-right text-xs font-bold text-[#253e31]">{nutritionUndeclared(food) ? "N/D" : `${food.energia_kcal} kcal`}</p>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFood(mealIndex, foodIndex)} aria-label={`Eliminar ${food.nombre}`}><Trash2 className="h-4 w-4" /></Button>
              </div>)}</div>}
            </CardContent></Card>;
          })}
        </div>
      </div>

      {visibleMeals.some(({meal}) => meal.alimentos?.some(nutritionUndeclared)) ? <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">Totales parciales: hay suplementos con kcal y macros no declarados (N/D). No se consideran cero.</p> : null}
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
function CustomField({ label, value, onChange, text = false }: { label: string; value: string; onChange: (value: string) => void; text?: boolean }) { return <div><Label>{label}</Label><Input aria-label={label} className="mt-2" type={text ? "text" : "number"} min={text ? undefined : "0"} step={text ? undefined : "0.1"} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
