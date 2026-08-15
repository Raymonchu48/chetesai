"use client";

import ProfessionalExerciseVisual from "@/components/exercises/ProfessionalExerciseVisual";

type Props = { code?: string | null; name: string };

const FINAL_LEG_SPRITE = "/exercises/legs/chetesai-leg-final-sprite.webp";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Mapeo deliberadamente exacto. No usamos includes("sentadilla") porque eso
// provocaba que ejercicios como Sentadilla al banco heredasen una imagen ajena.
const NAME_TILES: Record<string, number> = {
  "sentadilla": 0,
  "sentadilla profunda": 0,
  "sentadilla con barra": 0,
  "back squat": 0,

  "zancada alterna": 1,
  "zancadas alternas": 1,
  "zancada con mancuernas": 1,
  "zancadas con mancuernas": 1,

  "prensa de piernas": 2,
  "prensa de piernas horizontal": 2,

  "peso muerto rumano": 3,
  "romanian deadlift": 3,

  "extension de piernas": 4,
  "extension de piernas en maquina": 4,
  "extension de cuadriceps": 4,

  "hip thrust": 5,
  "hip thrust con barra": 5,

  "sentadilla bulgara": 6,
  "bulgarian split squat": 6,

  "curl femoral": 7,
  "curl femoral en maquina": 7,
  "curl femoral tumbado": 7,

  "step up": 8,
  "step up con mancuerna": 8,
  "step up con mancuernas": 8,

  "sentadilla goblet": 9,
  "goblet squat": 9,

  "elevacion de talones": 10,
  "elevacion de talones de pie": 10,
  "elevacion de gemelos": 10,
  "elevacion de gemelos de pie": 10,

  "elevacion de talones sentado": 11,
  "elevacion de talones sentado en maquina": 11,
  "elevacion de gemelos sentado": 11
};

// Códigos conocidos del catálogo profesional. Solo se usan cuando el nombre
// también pertenece al banco final, evitando asociaciones históricas erróneas.
const CODE_TILES: Record<string, number> = {
  "CHE-PIE-001": 0,
  "CHE-PIE-003": 1,
  "CHE-PIE-010": 2,
  "CHE-PIE-004": 3,
  "CHE-PIE-011": 4,
  "CHE-PIE-005": 5,
  "CHE-PIE-018": 6,
  "CHE-PIE-012": 7,
  "CHE-PIE-006": 8,
  "CHE-PIE-020": 10,
  "CHE-PIE-021": 11
};

export function getFinalLegTile(name: string, code?: string | null) {
  const normalized = normalize(name);
  if (NAME_TILES[normalized] !== undefined) return NAME_TILES[normalized];

  // El código solo actúa como respaldo si el nombre contiene el patrón correcto.
  const codeTile = code ? CODE_TILES[code] : undefined;
  if (codeTile === undefined) return -1;
  const guards = [
    ["sentadilla"], ["zancada"], ["prensa"], ["peso muerto rumano"],
    ["extension"], ["hip thrust"], ["bulgara"], ["curl femoral"],
    ["step up"], ["goblet"], ["talones", "gemelos"], ["sentado"]
  ];
  return guards[codeTile]?.some((word) => normalized.includes(word)) ? codeTile : -1;
}

export default function LegCardSpriteVisual({ code, name }: Props) {
  const index = getFinalLegTile(name, code);

  if (index < 0) {
    return <ProfessionalExerciseVisual code={code} name={name} group="piernas" material={null} />;
  }

  const col = index % 4;
  const row = Math.floor(index / 4);
  const x = ["0%", "33.333333%", "66.666667%", "100%"][col];
  const y = ["0%", "50%", "100%"][row];

  return (
    <div
      className="h-full w-full bg-white bg-no-repeat"
      aria-label={`Ejecución visual de ${name}`}
      style={{
        backgroundImage: `url(${FINAL_LEG_SPRITE})`,
        backgroundSize: "400% 300%",
        backgroundPosition: `${x} ${y}`
      }}
    />
  );
}
