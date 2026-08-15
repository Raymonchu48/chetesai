"use client";

import ProfessionalExerciseVisual from "@/components/exercises/ProfessionalExerciseVisual";
import { LEG_CARD_SPRITE } from "@/components/exercises/legSprite";

type Props = { code?: string | null; name: string };

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

const X_POSITIONS = ["9.09%", "50%", "90.91%"];
const Y_POSITIONS = ["5.88%", "35.29%", "64.71%", "94.12%"];

export default function LegCardSpriteVisual({ code, name }: Props) {
  const normalizedName = normalize(name);

  // LEG-007: recurso final aprobado e independiente.
  // Se usa directamente para evitar cualquier error de recorte o asignación del sprite.
  if (normalizedName.includes("bulgar")) {
    return (
      <div className="h-full w-full overflow-hidden bg-white" aria-label={`Ejecución visual de ${name}`}>
        <img
          src="/exercises/legs/LEG-007_Sentadilla_Bulgara.webp"
          alt="Sentadilla Búlgara - Chetesaí Fitness+"
          className="h-full w-full object-cover object-[center_48%]"
        />
      </div>
    );
  }

  const nameIndex = byName(name);
  const index = nameIndex >= 0 ? nameIndex : code && tiles[code] !== undefined ? tiles[code] : -1;

  if (index < 0) {
    return <ProfessionalExerciseVisual code={code} name={name} group="piernas" material={null} />;
  }

  const col = index % 3;
  const row = Math.floor(index / 3);

  return (
    <div className="h-full w-full overflow-hidden bg-white" aria-label={`Ejecución visual de ${name}`}>
      <div
        className="h-full w-full bg-white bg-no-repeat"
        style={{
          backgroundImage: `url(${LEG_CARD_SPRITE})`,
          backgroundSize: "540% 720%",
          backgroundPosition: `${X_POSITIONS[col]} ${Y_POSITIONS[row]}`
        }}
      />
    </div>
  );
}
