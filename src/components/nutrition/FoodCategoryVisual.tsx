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

const foodSprites: Array<{ keywords: string[]; column: number; row: number }> = [
  { keywords: ["avena"], column: 0, row: 0 },
  { keywords: ["arroz"], column: 1, row: 0 },
  { keywords: ["quinoa"], column: 2, row: 0 },
  { keywords: ["pan integral", "pan"], column: 3, row: 0 },
  { keywords: ["pasta"], column: 4, row: 0 },
  { keywords: ["patata"], column: 5, row: 0 },
  { keywords: ["boniato", "batata"], column: 0, row: 1 },
  { keywords: ["pollo"], column: 1, row: 1 },
  { keywords: ["pavo"], column: 2, row: 1 },
  { keywords: ["ternera", "vacuno"], column: 3, row: 1 },
  { keywords: ["salmón", "salmon"], column: 4, row: 1 },
  { keywords: ["atún", "atun"], column: 5, row: 1 },
  { keywords: ["merluza", "bacalao"], column: 0, row: 2 },
  { keywords: ["clara"], column: 2, row: 2 },
  { keywords: ["huevo de", "huevo entero", "huevo"], column: 1, row: 2 },
  { keywords: ["leche"], column: 3, row: 2 },
  { keywords: ["yogur", "kéfir", "kefir"], column: 4, row: 2 },
  { keywords: ["queso fresco", "queso"], column: 5, row: 2 },
  { keywords: ["lenteja"], column: 0, row: 3 },
  { keywords: ["garbanzo"], column: 1, row: 3 },
  { keywords: ["alubia", "judía", "judia"], column: 2, row: 3 },
  { keywords: ["plátano", "platano", "banana"], column: 3, row: 3 },
  { keywords: ["manzana"], column: 4, row: 3 },
  { keywords: ["naranja", "mandarina"], column: 5, row: 3 },
  { keywords: ["fresa"], column: 0, row: 4 },
  { keywords: ["brócoli", "brocoli"], column: 1, row: 4 },
  { keywords: ["espinaca"], column: 2, row: 4 },
  { keywords: ["tomate"], column: 3, row: 4 },
  { keywords: ["aguacate"], column: 4, row: 4 },
  { keywords: ["almendra"], column: 5, row: 4 },
];

function foodSpriteStyle(name?: string | null) {
  const normalizedName = String(name || "").toLocaleLowerCase("es");
  const match = foodSprites.find(({ keywords }) => keywords.some((keyword) => normalizedName.includes(keyword)));
  if (!match) return null;
  return {
    backgroundImage: "url('/brand/chetesai-food-sprite-v1.webp')",
    backgroundPosition: `${match.column * 20}% ${match.row * 25}%`,
    backgroundSize: "600% 500%",
  };
}

function inferCategory(category?: string | null, name?: string | null) {
  if (category && themes[category]) return category;
  const normalizedName = String(name || "").toLocaleLowerCase("es");
  return categoryKeywords.find(([, keywords]) => keywords.some((keyword) => normalizedName.includes(keyword)))?.[0] || "otros";
}

export default function FoodCategoryVisual({ category, name, compact = false }: { category?: string | null; name?: string | null; compact?: boolean }) {
  const theme = themes[inferCategory(category, name)] || fallback;
  const Icon = theme.Icon;
  const spriteStyle = foodSpriteStyle(name);

  if (compact) {
    if (spriteStyle) {
      return <span role="img" aria-label={`Ilustración de ${name || theme.label}`} className="h-11 w-11 shrink-0 rounded-2xl border border-[#e6dfd3] bg-[#fffdf9] bg-no-repeat shadow-sm" style={spriteStyle} />;
    }
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
