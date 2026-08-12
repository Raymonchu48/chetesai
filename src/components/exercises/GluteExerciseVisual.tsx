"use client";

type Mode = "hipthrust" | "bridge" | "abduction" | "kickback";

const MODES: Record<string, Mode> = {
  "CHE-PIE-005": "hipthrust",
  "CHE-GLU-001": "bridge",
  "CHE-GLU-002": "abduction",
  "CHE-GLU-003": "kickback",
};

const skin = "#d59a70";
const dark = "#111827";
const accent = "#10b981";
const equipment = "#64748b";

export default function GluteExerciseVisual({ code, name }: { code?: string | null; name: string }) {
  const mode: Mode = (code && MODES[code]) || "bridge";

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f7f4ed]">
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-white">
        <span>Chetesaí Fitness+</span>
        <span className="text-emerald-400">Glúteos</span>
      </div>
      <div className="grid h-full grid-cols-2 pt-8">
        <Pose mode={mode} phase="start" label="Inicio" />
        <Pose mode={mode} phase="end" label="Ejecución" right />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#f7f4ed] via-[#f7f4ed]/95 to-transparent px-4 pb-2 pt-5 text-center text-[10px] font-bold text-slate-700">
        {name}
      </div>
    </div>
  );
}

function Pose({ mode, phase, label, right = false }: { mode: Mode; phase: "start" | "end"; label: string; right?: boolean }) {
  const end = phase === "end";
  return (
    <div className={right ? "border-l border-slate-300/70" : ""}>
      <svg viewBox="0 0 160 240" className="h-full w-full" role="img" aria-label={label}>
        <ellipse cx="80" cy="220" rx="42" ry="7" fill="#d8d3c8" opacity="0.7" />
        {mode === "bridge" && <Bridge end={end} />}
        {mode === "hipthrust" && <HipThrust end={end} />}
        {mode === "abduction" && <Abduction end={end} />}
        {mode === "kickback" && <Kickback end={end} />}
        <text x="80" y="237" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">{label}</text>
      </svg>
    </div>
  );
}

function Bridge({ end }: { end: boolean }) {
  const hipY = end ? 126 : 158;
  return <g><circle cx="43" cy="155" r="11" fill={skin} /><line x1="53" y1="158" x2="84" y2={hipY} stroke={dark} strokeWidth="17" strokeLinecap="round" /><circle cx="84" cy={hipY} r="13" fill={accent} opacity="0.8" /><line x1="84" y1={hipY} x2="114" y2="172" stroke={skin} strokeWidth="10" strokeLinecap="round" /><line x1="114" y1="172" x2="132" y2="214" stroke={skin} strokeWidth="9" strokeLinecap="round" /><line x1="123" y1="214" x2="143" y2="214" stroke={dark} strokeWidth="7" strokeLinecap="round" /></g>;
}

function HipThrust({ end }: { end: boolean }) {
  const hipY = end ? 116 : 150;
  return <g><line x1="24" y1="150" x2="62" y2="150" stroke={equipment} strokeWidth="10" /><line x1="32" y1="154" x2="28" y2="208" stroke={equipment} strokeWidth="6" /><circle cx="55" cy="126" r="11" fill={skin} /><line x1="63" y1="136" x2="88" y2={hipY} stroke={dark} strokeWidth="18" strokeLinecap="round" /><circle cx="88" cy={hipY} r="13" fill={accent} opacity="0.8" /><line x1="88" y1={hipY} x2="116" y2="166" stroke={skin} strokeWidth="10" strokeLinecap="round" /><line x1="116" y1="166" x2="130" y2="212" stroke={skin} strokeWidth="9" strokeLinecap="round" /><line x1="121" y1="213" x2="141" y2="213" stroke={dark} strokeWidth="7" strokeLinecap="round" /><line x1="72" y1={hipY - 4} x2="105" y2={hipY - 4} stroke="#334155" strokeWidth="5" /></g>;
}

function Abduction({ end }: { end: boolean }) {
  const leftKneeX = end ? 50 : 68;
  const rightKneeX = end ? 110 : 92;
  const leftFootX = end ? 37 : 61;
  const rightFootX = end ? 123 : 99;
  return <g><circle cx="80" cy="44" r="13" fill={skin} /><line x1="80" y1="74" x2="80" y2="145" stroke={dark} strokeWidth="21" strokeLinecap="round" /><circle cx="80" cy="143" r="14" fill={accent} opacity="0.8" /><line x1="80" y1="145" x2={leftKneeX} y2="185" stroke={skin} strokeWidth="10" strokeLinecap="round" /><line x1={leftKneeX} y1="185" x2={leftFootX} y2="220" stroke={skin} strokeWidth="9" strokeLinecap="round" /><line x1="80" y1="145" x2={rightKneeX} y2="185" stroke={skin} strokeWidth="10" strokeLinecap="round" /><line x1={rightKneeX} y1="185" x2={rightFootX} y2="220" stroke={skin} strokeWidth="9" strokeLinecap="round" /><line x1="55" y1="174" x2="105" y2="174" stroke="#84cc16" strokeWidth="4" strokeDasharray="5 4" /></g>;
}

function Kickback({ end }: { end: boolean }) {
  const kneeX = end ? 128 : 99;
  const kneeY = end ? 151 : 184;
  const footX = end ? 145 : 106;
  const footY = end ? 170 : 220;
  return <g><circle cx="69" cy="49" r="12" fill={skin} /><line x1="70" y1="78" x2="81" y2="142" stroke={dark} strokeWidth="20" strokeLinecap="round" /><circle cx="83" cy="142" r="13" fill={accent} opacity="0.8" /><line x1="74" y1="88" x2="42" y2="120" stroke={skin} strokeWidth="8" strokeLinecap="round" /><line x1="42" y1="120" x2="24" y2="120" stroke={skin} strokeWidth="8" strokeLinecap="round" /><line x1="82" y1="143" x2="68" y2="183" stroke={skin} strokeWidth="10" strokeLinecap="round" /><line x1="68" y1="183" x2="64" y2="220" stroke={skin} strokeWidth="9" strokeLinecap="round" /><line x1="84" y1="144" x2={kneeX} y2={kneeY} stroke={skin} strokeWidth="10" strokeLinecap="round" /><line x1={kneeX} y1={kneeY} x2={footX} y2={footY} stroke={skin} strokeWidth="9" strokeLinecap="round" /><line x1="24" y1="92" x2="24" y2="203" stroke={equipment} strokeWidth="4" /></g>;
}
