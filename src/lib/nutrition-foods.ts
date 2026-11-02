export type FoodUnit = "g" | "ml";

export function foodUnit(food: { unidad_medida?: string; etiquetas?: string[]; porcion_nombre?: string }): FoodUnit {
  if (food.unidad_medida === "ml" || food.etiquetas?.includes("unidad_ml")) return "ml";
  if (food.unidad_medida === "g") return "g";
  return /\bml\b/i.test(food.porcion_nombre || "") ? "ml" : "g";
}

export function nutritionUndeclared(food: { macros_no_declarados?: boolean; etiquetas?: string[] }) {
  return food.macros_no_declarados === true || food.etiquetas?.includes("macros_no_declarados") === true;
}

export function normalizeFoodSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/_/g, " ").toLocaleLowerCase("es");
}

export function scaleFoodNutrients(food: { energia_kcal: number; proteinas_g: number; carbohidratos_g: number; grasas_g: number }, quantity: number) {
  const scaled = (value: number) => Math.round(Number(value) * quantity / 100 * 10) / 10;
  return { energia_kcal: scaled(food.energia_kcal), proteinas_g: scaled(food.proteinas_g), carbohidratos_g: scaled(food.carbohidratos_g), grasas_g: scaled(food.grasas_g) };
}

export function nutritionTotals(foods: Array<{ energia_kcal: number; proteinas_g: number; carbohidratos_g: number; grasas_g: number; macros_no_declarados?: boolean }>) {
  return foods.reduce((sum, food) => nutritionUndeclared(food)
    ? { ...sum, incomplete: sum.incomplete + 1 }
    : { ...sum, kcal: sum.kcal + Number(food.energia_kcal), protein: sum.protein + Number(food.proteinas_g), carbs: sum.carbs + Number(food.carbohidratos_g), fat: sum.fat + Number(food.grasas_g) },
  { kcal: 0, protein: 0, carbs: 0, fat: 0, incomplete: 0 });
}
