"use client";

import { useMemo, useState } from "react";
import ProfessionalExerciseVisual from "@/components/exercises/ProfessionalExerciseVisual";

type Props = {
  code?: string | null;
  name: string;
};

const CARD_BY_CODE: Record<string, string> = {
  "CHE-PIE-001": "/exercises/legs/LEG-001_Sentadilla.png",
  "CHE-PIE-002": "/exercises/legs/LEG-010_Sentadilla_Goblet.png",
  "CHE-PIE-003": "/exercises/legs/LEG-002_Zancada_Alterna.png",
  "CHE-PIE-004": "/exercises/legs/LEG-004_Peso_Muerto_Rumano.png",
  "CHE-PIE-005": "/exercises/legs/LEG-006_Hip_Thrust_con_Barra.png",
  "CHE-PIE-006": "/exercises/legs/LEG-009_Step_Up.png",
  "CHE-PIE-007": "/exercises/legs/LEG-001_Sentadilla.png",
  "CHE-PIE-008": "/exercises/legs/LEG-001_Sentadilla.png",
  "CHE-PIE-009": "/exercises/legs/LEG-001_Sentadilla.png",
  "CHE-PIE-010": "/exercises/legs/LEG-003_Prensa_de_Piernas.png",
  "CHE-PIE-011": "/exercises/legs/LEG-005_Extension_de_Piernas.png",
  "CHE-PIE-012": "/exercises/legs/LEG-008_Curl_Femoral_en_Maquina.png",
  "CHE-PIE-013": "/exercises/legs/LEG-008_Curl_Femoral_en_Maquina.png",
  "CHE-PIE-016": "/exercises/legs/LEG-002_Zancada_Alterna.png",
  "CHE-PIE-017": "/exercises/legs/LEG-002_Zancada_Alterna.png",
  "CHE-PIE-018": "/exercises/legs/LEG-007_Sentadilla_Bulgara.png",
  "CHE-PIE-020": "/exercises/legs/LEG-011_Elevacion_de_Talones_De_Pie.png",
  "CHE-PIE-021": "/exercises/legs/LEG-012_Elevacion_de_Talones_Sentado.png",
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function cardByName(name: string) {
  const n = normalize(name);
  if (n.includes("goblet")) return "/exercises/legs/LEG-010_Sentadilla_Goblet.png";
  if (n.includes("bulgar")) return "/exercises/legs/LEG-007_Sentadilla_Bulgara.png";
  if (n.includes("prensa")) return "/exercises/legs/LEG-003_Prensa_de_Piernas.png";
  if (n.includes("peso muerto rumano")) return "/exercises/legs/LEG-004_Peso_Muerto_Rumano.png";
  if (n.includes("extension") && (n.includes("pierna") || n.includes("cuadriceps"))) return "/exercises/legs/LEG-005_Extension_de_Piernas.png";
  if (n.includes("hip thrust")) return "/exercises/legs/LEG-006_Hip_Thrust_con_Barra.png";
  if (n.includes("curl femoral")) return "/exercises/legs/LEG-008_Curl_Femoral_en_Maquina.png";
  if (n.includes("step up") || n.includes("step-up")) return "/exercises/legs/LEG-009_Step_Up.png";
  if ((n.includes("talon") || n.includes("gemelo")) && n.includes("sentad")) return "/exercises/legs/LEG-012_Elevacion_de_Talones_Sentado.png";
  if (n.includes("talon") || n.includes("gemelo")) return "/exercises/legs/LEG-011_Elevacion_de_Talones_De_Pie.png";
  if (n.includes("zancada")) return "/exercises/legs/LEG-002_Zancada_Alterna.png";
  if (n.includes("sentadilla")) return "/exercises/legs/LEG-001_Sentadilla.png";
  return null;
}

export default function LegCardVisual({ code, name }: Props) {
  const [failed, setFailed] = useState(false);
  const src = useMemo(() => (code ? CARD_BY_CODE[code] : null) || cardByName(name), [code, name]);

  if (!src || failed) {
    return (
      <ProfessionalExerciseVisual
        code={code}
        name={name}
        group="piernas"
        material={null}
      />
    );
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-white">
      <img
        src={src}
        alt={`Tarjeta visual de ${name}`}
        className="h-full w-full object-contain"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
