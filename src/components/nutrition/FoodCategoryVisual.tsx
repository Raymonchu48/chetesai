import type { LucideIcon } from "lucide-react";
import { Apple, Bean, Beef, CircleHelp, CookingPot, Egg, Fish, Milk, Nut, Salad, Soup, Vegan, Wheat } from "lucide-react";

type FoodTheme = {
  label: string;
  Icon: LucideIcon;
  background: string;
  foreground: string;
  accent: string;
};

const themes: Record<string, FoodTheme> = {
  cereales: { label: "Cereales", Icon: Wheat, background: "from-[#f8edcf] to-[#efe0b5]", foreground: "text-[#936f25]", accent: "bg-[#c7a254]" },
  tuberculos: { label: "Tubérculos", Icon: CookingPot, background: "from-[#f4e4d5] to-[#ead2bd]", foreground: "text-[#9b6037]", accent: "bg-[#bd7444]" },
  carnes: { label: "Carnes", Icon: Beef, background: "from-[#f5dfda] to-[#ebc9c0]", foreground: "text-[#9b4f45]", accent: "bg-[#b85e52]" },
  pescados: { label: "Pescados", Icon: Fish, background: "from-[#dcecf0] to-[#c7dfe6]", foreground: "text-[#397485]", accent: "bg-[#4b8a9b]" },
  huevos: { label: "Huevos", Icon: Egg, background: "from-[#fff2c9] to-[#f3dfa1]", foreground: "text-[#967020]", accent: "bg-[#d0a83e]" },
  lacteos: { label: "Lácteos", Icon: Milk, background: "from-[#e5eaf3] to-[#d4dced]", foreground: "text-[#536d9b]", accent: "bg-[#7187b0]" },
  legumbres: { label: "Legumbres", Icon: Bean, background: "from-[#e9dfd1] to-[#dac7b0]", foreground: "text-[#7a5c3e]", accent: "bg-[#9b7650]" },
  frutas: { label: "Frutas", Icon: Apple, background: "from-[#f7ded7] to-[#efc8bd]", foreground: "text-[#a54d42]", accent: "bg-[#c95f52]" },
  verduras: { label: "Verduras", Icon: Salad, background: "from-[#dff0dd] to-[#c7e2c3]", foreground: "text-[#3d7b42]", accent: "bg-[#55945b]" },
  grasas: { label: "Aceites y grasas", Icon: Vegan, background: "from-[#eef0d2] to-[#dfe3ae]", foreground: "text-[#727a2c]", accent: "bg-[#919b3e]" },
  frutos_secos: { label: "Frutos secos", Icon: Nut, background: "from-[#eee0ce] to-[#dec7a9]", foreground: "text-[#805d36]", accent: "bg-[#a27a4c]" },
  otros: { label: "Otros", Icon: Soup, background: "from-[#e6e7e3] to-[#d5d8d1]", foreground: "text-[#59645d]", accent: "bg-[#758078]" },
};

const fallback: FoodTheme = { label: "Alimento", Icon: CircleHelp, background: "from-[#e6e7e3] to-[#d5d8d1]", foreground: "text-[#59645d]", accent: "bg-[#758078]" };

export function foodCategoryLabel(category?: string | null) {
  return themes[category || ""]?.label || fallback.label;
}

const categoryKeywords: Array<[string, string[]]> = [
  ["pescados", ["salmón", "salmon", "atún", "atun", "merluza", "bacalao", "sardina", "pescado"]],
  ["carnes", ["pollo", "pavo", "ternera", "cerdo", "carne", "jamón", "jamon"]],
  ["huevos", ["huevo", "clara"]],
  ["lacteos", ["leche", "yogur", "queso", "kéfir", "kefir"]],
  ["frutas", ["manzana", "plátano", "platano", "naranja", "fresa", "fruta", "kiwi", "pera", "melón", "melon", "sandía", "sandia"]],
  ["verduras", ["brócoli", "brocoli", "espinaca", "lechuga", "tomate", "zanahoria", "calabacín", "calabacin", "verdura"]],
  ["legumbres", ["lenteja", "garbanzo", "alubia", "judía", "judia"]],
  ["frutos_secos", ["almendra", "nuez", "avellana", "pistacho", "cacahuete"]],
  ["tuberculos", ["patata", "boniato", "yuca"]],
  ["grasas", ["aceite", "aguacate", "oliva"]],
  ["cereales", ["arroz", "avena", "pan", "pasta", "quinoa", "cereal"]],
];

function inferCategory(category?: string | null, name?: string | null) {
  if (category && themes[category]) return category;
  const normalizedName = String(name || "").toLocaleLowerCase("es");
  return categoryKeywords.find(([, keywords]) => keywords.some((keyword) => normalizedName.includes(keyword)))?.[0] || "otros";
}

export default function FoodCategoryVisual({ category, name, compact = false }: { category?: string | null; name?: string | null; compact?: boolean }) {
  const theme = themes[inferCategory(category, name)] || fallback;
  const Icon = theme.Icon;

  if (compact) {
    return (
      <span aria-label={`Ilustración de ${theme.label}`} className={`relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${theme.background} ${theme.foreground}`}>
        <span className={`absolute -bottom-3 -right-3 h-7 w-7 rounded-full opacity-20 ${theme.accent}`} />
        <Icon className="relative h-5 w-5" strokeWidth={1.8} />
      </span>
    );
  }

  return (
    <div aria-label={`Ilustración predeterminada de ${theme.label}`} className={`relative flex min-h-24 overflow-hidden rounded-[22px] bg-gradient-to-br ${theme.background} p-4 ${theme.foreground}`}>
      <span className={`absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-15 ${theme.accent}`} />
      <span className={`absolute -bottom-10 left-8 h-20 w-20 rounded-full opacity-10 ${theme.accent}`} />
      <div className="relative flex w-full items-center justify-between gap-3">
        <div><p className="text-[9px] font-black uppercase tracking-[0.18em] opacity-65">Selección Chetesaí</p><p className="mt-1 text-sm font-black">{theme.label}</p></div>
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/45 shadow-sm"><Icon className="h-7 w-7" strokeWidth={1.7} /></span>
      </div>
    </div>
  );
}
