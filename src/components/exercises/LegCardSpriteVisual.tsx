"use client";

import ProfessionalExerciseVisual from "@/components/exercises/ProfessionalExerciseVisual";

type Props = { code?: string | null; name: string };

// El catálogo CHE-PIE ha evolucionado y algunos códigos históricos ya no
// representan el mismo ejercicio. El nombre es la fuente primaria para evitar
// mostrar una tarjeta anatómica incorrecta. Los códigos quedan solo como fallback.
const tiles: Record<string, number> = {
  "CHE-PIE-001": 0,
  "CHE-PIE-003": 1,
  "CHE-PIE-004": 3,
  "CHE-PIE-005": 5,
  "CHE-PIE-006": 8,
  "CHE-PIE-010": 2,
  "CHE-PIE-011": 4,
  "CHE-PIE-012": 7,
  "CHE-PIE-018": 6,
  "CHE-PIE-020": 10,
  "CHE-PIE-021": 11
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function byName(name: string) {
  const n = normalize(name);
  if (n.includes("goblet")) return 9;
  if (n.includes("bulgar")) return 6;
  if (n.includes("prensa")) return 2;
  if (n.includes("peso muerto rumano")) return 3;
  if (n.includes("extension") && (n.includes("pierna") || n.includes("cuadriceps"))) return 4;
  if (n.includes("hip thrust")) return 5;
  if (n.includes("curl femoral")) return 7;
  if (n.includes("step up") || n.includes("step-up")) return 8;
  if ((n.includes("elevacion de talones") || n.includes("gemelo")) && n.includes("sentad")) return 11;
  if (n.includes("elevacion de talones") || n.includes("gemelos de pie")) return 10;
  if (n.includes("zancada")) return 1;
  if (n.includes("sentadilla") || n.includes("squat")) return 0;
  return -1;
}

export default function LegCardSpriteVisual({ code, name }: Props) {
  const nameIndex = byName(name);
  const index = nameIndex >= 0 ? nameIndex : code && tiles[code] !== undefined ? tiles[code] : -1;

  if (index < 0) {
    return <ProfessionalExerciseVisual code={code} name={name} group="piernas" material={null} />;
  }

  const col = index % 3;
  const row = Math.floor(index / 3);
  const x = col === 0 ? "0%" : col === 1 ? "50%" : "100%";
  const y = row === 0 ? "0%" : row === 1 ? "33.333%" : row === 2 ? "66.667%" : "100%";

  return (
    <div className="flex h-full w-full items-center justify-center overflow-hidden bg-white" aria-label={`Tarjeta visual de ${name}`}>
      <div
        className="h-full max-w-full bg-white bg-no-repeat"
        style={{
          aspectRatio: "140 / 260",
          backgroundImage: "url('/exercises/legs/chetesai-leg-cards.webp')",
          backgroundSize: "300% 400%",
          backgroundPosition: `${x} ${y}`
        }}
      />
    </div>
  );
}
