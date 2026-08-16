import { ImageResponse } from "next/og";
import { getPublicExercise, labelFor } from "@/lib/public-exercises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ codigo: string }> };

const paletteByGroup: Record<string, { accent: string; soft: string; ink: string }> = {
  pecho: { accent: "#c9653b", soft: "#f5ded3", ink: "#6b2e1b" },
  espalda: { accent: "#397084", soft: "#dcebf0", ink: "#173c49" },
  hombros: { accent: "#9a7338", soft: "#f1e5d2", ink: "#5d421b" },
  biceps: { accent: "#7b5aa6", soft: "#e8def4", ink: "#432c62" },
  triceps: { accent: "#7b5aa6", soft: "#e8def4", ink: "#432c62" },
  piernas: { accent: "#2f9e24", soft: "#dff1dc", ink: "#174f12" },
  gluteos: { accent: "#b35c82", soft: "#f3dce7", ink: "#672942" },
  core: { accent: "#d18421", soft: "#f7e7cf", ink: "#75430c" },
  cardio: { accent: "#cc3f46", soft: "#f6dadd", ink: "#711d22" },
  cuerpo_completo: { accent: "#2f7b59", soft: "#dcece4", ink: "#174831" },
};

function fitTitle(name: string) {
  if (name.length > 46) return 54;
  if (name.length > 34) return 62;
  if (name.length > 24) return 70;
  return 80;
}

function compact(text?: string | null, max = 165) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean) return "Técnica, control y progresión para entrenar con método.";
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { codigo } = await params;
  const exercise = await getPublicExercise(codigo);
  if (!exercise) return new Response("Ejercicio no encontrado", { status: 404 });

  const palette = paletteByGroup[exercise.grupo_muscular.toLowerCase()] || paletteByGroup.cuerpo_completo;
  const group = labelFor(exercise.grupo_muscular).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#f5f1e9",
          color: "#18211d",
          fontFamily: "Arial, Helvetica, sans-serif",
          padding: "54px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "82px",
                height: "82px",
                borderRadius: "24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#18211d",
                color: "#8cdb78",
                fontSize: "34px",
                fontWeight: 900,
              }}
            >
              C+
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px" }}>CHETESAÍ FITNESS+</div>
              <div style={{ marginTop: "4px", color: "#6b746e", fontSize: "17px", fontWeight: 700, letterSpacing: "2.5px" }}>BIBLIOTECA VISUAL</div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              borderRadius: "999px",
              background: palette.soft,
              color: palette.ink,
              padding: "13px 20px",
              fontSize: "18px",
              fontWeight: 900,
              letterSpacing: "1.4px",
            }}
          >
            {exercise.codigo_interno}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: "70px" }}>
          <div style={{ color: palette.accent, fontSize: "21px", fontWeight: 900, letterSpacing: "4px" }}>{group}</div>
          <div
            style={{
              display: "flex",
              marginTop: "16px",
              maxWidth: "880px",
              fontSize: `${fitTitle(exercise.nombre)}px`,
              fontWeight: 900,
              lineHeight: 0.98,
              letterSpacing: "-2.8px",
            }}
          >
            {exercise.nombre}
          </div>
          <div style={{ display: "flex", marginTop: "26px", maxWidth: "840px", color: "#667069", fontSize: "25px", lineHeight: 1.45 }}>
            {compact(exercise.descripcion)}
          </div>
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            flex: 1,
            marginTop: "44px",
            overflow: "hidden",
            borderRadius: "42px",
            background: "#18211d",
            padding: "34px",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: "-40px",
              top: "-45px",
              display: "flex",
              color: "rgba(255,255,255,0.055)",
              fontSize: "118px",
              fontWeight: 900,
              letterSpacing: "-6px",
            }}
          >
            {group}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 2 }}>
            <div style={{ display: "flex", color: "#8cdb78", fontSize: "18px", fontWeight: 900, letterSpacing: "2.6px" }}>MOVIMIENTO CONTROLADO</div>
            <div style={{ display: "flex", color: "rgba(255,255,255,.55)", fontSize: "16px", fontWeight: 700 }}>INICIO → EJECUCIÓN</div>
          </div>

          <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-around", zIndex: 2 }}>
            <MovementStage accent={palette.accent} label="INICIO" rotate={-7} />
            <div style={{ display: "flex", color: "#8cdb78", fontSize: "58px", fontWeight: 300 }}>→</div>
            <MovementStage accent={palette.accent} label="EJECUCIÓN" rotate={7} active />
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px", marginTop: "24px" }}>
          <InfoPill label="NIVEL" value={labelFor(exercise.dificultad)} />
          <InfoPill label="MATERIAL" value={exercise.material || "Sin material"} />
          <InfoPill label="TIPO" value={labelFor(exercise.categoria)} />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "30px",
            borderTop: "2px solid #dcd5c9",
            paddingTop: "25px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ color: palette.accent, fontSize: "20px", fontWeight: 900, letterSpacing: "2px" }}>VER TÉCNICA COMPLETA</div>
            <div style={{ marginTop: "5px", color: "#535d57", fontSize: "20px", fontWeight: 700 }}>chetesaifitness.com</div>
          </div>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "999px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: palette.accent,
              color: "white",
              fontSize: "34px",
              fontWeight: 700,
            }}
          >
            →
          </div>
        </div>
      </div>
    ),
    {
      width: 1000,
      height: 1500,
      headers: { "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000" },
    }
  );
}

function MovementStage({ accent, label, rotate, active = false }: { accent: string; label: string; rotate: number; active?: boolean }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width: "270px",
          height: "270px",
          borderRadius: "999px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `4px solid ${active ? accent : "rgba(255,255,255,.18)"}`,
          background: active ? "rgba(255,255,255,.08)" : "rgba(255,255,255,.035)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", transform: `rotate(${rotate}deg)` }}>
          <div style={{ width: "34px", height: "112px", borderRadius: "10px", background: active ? accent : "#89918c" }} />
          <div style={{ width: "132px", height: "22px", background: "#d7ddd9" }} />
          <div style={{ width: "34px", height: "112px", borderRadius: "10px", background: active ? accent : "#89918c" }} />
        </div>
      </div>
      <div style={{ display: "flex", marginTop: "20px", color: active ? "#8cdb78" : "rgba(255,255,255,.55)", fontSize: "17px", fontWeight: 900, letterSpacing: "2.2px" }}>{label}</div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minWidth: 0,
        borderRadius: "22px",
        border: "2px solid #ded8cd",
        background: "#fffdf9",
        padding: "18px 20px",
      }}
    >
      <div style={{ color: "#8a928d", fontSize: "13px", fontWeight: 900, letterSpacing: "1.8px" }}>{label}</div>
      <div style={{ marginTop: "7px", color: "#27302b", fontSize: "18px", fontWeight: 900 }}>{value}</div>
    </div>
  );
}
