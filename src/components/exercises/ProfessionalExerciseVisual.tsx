type Mode =
  | "squat" | "lunge" | "hinge" | "calf" | "legMachine" | "hipThrust"
  | "pushup" | "benchPress" | "fly" | "dip" | "verticalPull" | "row"
  | "shoulderPress" | "raise" | "curl" | "triceps" | "plank" | "crunch"
  | "legRaise" | "rotation" | "carry" | "crawl" | "cardio" | "stretch"
  | "mobility" | "generic";

type Point = { x: number; y: number };
type Pose = {
  hip: Point;
  torso: number;
  head?: number;
  upperArmL: number; foreArmL: number;
  upperArmR: number; foreArmR: number;
  thighL: number; shinL: number;
  thighR: number; shinR: number;
};

type Props = {
  code?: string | null;
  name: string;
  group?: string | null;
  material?: string | null;
};

const SKIN = "#dfa071";
const SKIN_DARK = "#c98255";
const SHIRT = "#111827";
const SHORTS = "#171f2d";
const SHOE = "#0b111b";
const METAL = "#343c48";
const METAL2 = "#687383";
const GREEN = "#62b800";

function normalize(value?: string | null) {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function modeFor(name: string, group?: string | null): Mode {
  const n = normalize(name);
  const g = normalize(group);
  if (/gemelo|talon/.test(n)) return "calf";
  if (/prensa de piernas|extension de cuadriceps|extension de piernas|curl femoral|aductores en maquina|abduccion de cadera en maquina/.test(n)) return "legMachine";
  if (/hip thrust|puente de glute/.test(n)) return "hipThrust";
  if (/sentadilla|squat/.test(n)) return "squat";
  if (/zancada|lunge|step.?up|bulgara/.test(n)) return "lunge";
  if (/peso muerto|buenos dias|bisagra/.test(n)) return "hinge";
  if (/flexion|push.?up|scapular push/.test(n)) return "pushup";
  if (/press banca|press de pecho|press inclinado|press cerrado|maquina convergente/.test(n)) return "benchPress";
  if (/apertura|cruce de poleas|fly/.test(n)) return "fly";
  if (/fondos/.test(n)) return "dip";
  if (/dominada|jalon|encogimientos escapulares en barra/.test(n)) return "verticalPull";
  if (/remo|face pull|thread the needle/.test(n)) return "row";
  if (/press militar|press arnold|pike/.test(n)) return "shoulderPress";
  if (/elevacion lateral|elevacion frontal|pajaros|y-raise|remo al menton|rotacion externa|circulos de hombros|wall slides/.test(n)) return "raise";
  if (/curl|biceps|concentracion|zottman|predicador/.test(n) && !/femoral/.test(n)) return "curl";
  if (/triceps|frances|extension unilateral/.test(n)) return "triceps";
  if (/plancha|hollow|dead bug/.test(n)) return "plank";
  if (/crunch/.test(n)) return "crunch";
  if (/elevacion de piernas|elevacion de rodillas/.test(n)) return "legRaise";
  if (/russian|woodchop|rotacion/.test(n)) return "rotation";
  if (/carry|paseo/.test(n)) return "carry";
  if (/bear crawl|mountain climber/.test(n)) return "crawl";
  if (/jumping|burpee|skipping|marcha activa|sled push/.test(n) || g === "cardio") return "cardio";
  if (/estiramiento|cobra|90\/90/.test(n)) return "stretch";
  if (/movilidad|balanceo|rodilla a pared/.test(n)) return "mobility";
  return "generic";
}

const poses: Record<Mode, [Pose, Pose]> = {
  squat: [
    { hip:{x:90,y:132}, torso:-4, upperArmL:88,foreArmL:2,upperArmR:92,foreArmR:-2,thighL:93,shinL:88,thighR:87,shinR:92 },
    { hip:{x:90,y:156}, torso:-10, upperArmL:78,foreArmL:2,upperArmR:102,foreArmR:-2,thighL:150,shinL:70,thighR:30,shinR:110 },
  ],
  lunge: [
    { hip:{x:88,y:130}, torso:0, upperArmL:96,foreArmL:84,upperArmR:84,foreArmR:96,thighL:92,shinL:88,thighR:88,shinR:92 },
    { hip:{x:90,y:151}, torso:-2, upperArmL:98,foreArmL:82,upperArmR:82,foreArmR:98,thighL:25,shinL:90,thighR:150,shinR:92 },
  ],
  hinge: [
    { hip:{x:90,y:132}, torso:0, upperArmL:95,foreArmL:85,upperArmR:85,foreArmR:95,thighL:92,shinL:88,thighR:88,shinR:92 },
    { hip:{x:105,y:146}, torso:65, upperArmL:105,foreArmL:86,upperArmR:75,foreArmR:94,thighL:102,shinL:82,thighR:78,shinR:98 },
  ],
  calf: [
    { hip:{x:90,y:130}, torso:0, upperArmL:97,foreArmL:83,upperArmR:83,foreArmR:97,thighL:92,shinL:88,thighR:88,shinR:92 },
    { hip:{x:90,y:119}, torso:0, upperArmL:97,foreArmL:83,upperArmR:83,foreArmR:97,thighL:92,shinL:88,thighR:88,shinR:92 },
  ],
  legMachine: [
    { hip:{x:76,y:150}, torso:-32, upperArmL:125,foreArmL:90,upperArmR:55,foreArmR:90,thighL:20,shinL:25,thighR:25,shinR:20 },
    { hip:{x:76,y:150}, torso:-32, upperArmL:125,foreArmL:90,upperArmR:55,foreArmR:90,thighL:-5,shinL:4,thighR:4,shinR:-5 },
  ],
  hipThrust: [
    { hip:{x:104,y:165}, torso:-65, upperArmL:155,foreArmL:90,upperArmR:25,foreArmR:90,thighL:18,shinL:92,thighR:162,shinR:88 },
    { hip:{x:104,y:143}, torso:-72, upperArmL:155,foreArmL:90,upperArmR:25,foreArmR:90,thighL:35,shinL:92,thighR:145,shinR:88 },
  ],
  pushup: [
    { hip:{x:104,y:147}, torso:-72, upperArmL:150,foreArmL:90,upperArmR:145,foreArmR:90,thighL:6,shinL:5,thighR:4,shinR:3 },
    { hip:{x:104,y:160}, torso:-72, upperArmL:132,foreArmL:78,upperArmR:128,foreArmR:82,thighL:6,shinL:5,thighR:4,shinR:3 },
  ],
  benchPress: [
    { hip:{x:98,y:159}, torso:-90, upperArmL:145,foreArmL:-90,upperArmR:35,foreArmR:-90,thighL:18,shinL:92,thighR:162,shinR:88 },
    { hip:{x:98,y:159}, torso:-90, upperArmL:-65,foreArmL:-86,upperArmR:-115,foreArmR:-94,thighL:18,shinL:92,thighR:162,shinR:88 },
  ],
  fly: [
    { hip:{x:98,y:159}, torso:-90, upperArmL:165,foreArmL:172,upperArmR:15,foreArmR:8,thighL:18,shinL:92,thighR:162,shinR:88 },
    { hip:{x:98,y:159}, torso:-90, upperArmL:-72,foreArmL:-86,upperArmR:-108,foreArmR:-94,thighL:18,shinL:92,thighR:162,shinR:88 },
  ],
  dip: [
    { hip:{x:90,y:137}, torso:0, upperArmL:145,foreArmL:90,upperArmR:35,foreArmR:90,thighL:82,shinL:88,thighR:98,shinR:92 },
    { hip:{x:90,y:155}, torso:0, upperArmL:125,foreArmL:72,upperArmR:55,foreArmR:108,thighL:82,shinL:88,thighR:98,shinR:92 },
  ],
  verticalPull: [
    { hip:{x:90,y:135}, torso:0, upperArmL:-125,foreArmL:-92,upperArmR:-55,foreArmR:-88,thighL:92,shinL:88,thighR:88,shinR:92 },
    { hip:{x:90,y:122}, torso:0, upperArmL:-150,foreArmL:-65,upperArmR:-30,foreArmR:-115,thighL:92,shinL:88,thighR:88,shinR:92 },
  ],
  row: [
    { hip:{x:102,y:145}, torso:62, upperArmL:118,foreArmL:92,upperArmR:62,foreArmR:88,thighL:100,shinL:82,thighR:80,shinR:98 },
    { hip:{x:102,y:145}, torso:62, upperArmL:155,foreArmL:125,upperArmR:25,foreArmR:55,thighL:100,shinL:82,thighR:80,shinR:98 },
  ],
  shoulderPress: [
    { hip:{x:90,y:132}, torso:0, upperArmL:150,foreArmL:-90,upperArmR:30,foreArmR:-90,thighL:92,shinL:88,thighR:88,shinR:92 },
    { hip:{x:90,y:132}, torso:0, upperArmL:-78,foreArmL:-88,upperArmR:-102,foreArmR:-92,thighL:92,shinL:88,thighR:88,shinR:92 },
  ],
  raise: [
    { hip:{x:90,y:132}, torso:0, upperArmL:100,foreArmL:92,upperArmR:80,foreArmR:88,thighL:92,shinL:88,thighR:88,shinR:92 },
    { hip:{x:90,y:132}, torso:0, upperArmL:180,foreArmL:180,upperArmR:0,foreArmR:0,thighL:92,shinL:88,thighR:88,shinR:92 },
  ],
  curl: [
    { hip:{x:90,y:132}, torso:0, upperArmL:100,foreArmL:92,upperArmR:80,foreArmR:88,thighL:92,shinL:88,thighR:88,shinR:92 },
    { hip:{x:90,y:132}, torso:0, upperArmL:102,foreArmL:-155,upperArmR:78,foreArmR:-25,thighL:92,shinL:88,thighR:88,shinR:92 },
  ],
  triceps: [
    { hip:{x:90,y:132}, torso:0, upperArmL:-98,foreArmL:160,upperArmR:-82,foreArmR:20,thighL:92,shinL:88,thighR:88,shinR:92 },
    { hip:{x:90,y:132}, torso:0, upperArmL:-98,foreArmL:-92,upperArmR:-82,foreArmR:-88,thighL:92,shinL:88,thighR:88,shinR:92 },
  ],
  plank: [
    { hip:{x:105,y:151}, torso:-72, upperArmL:145,foreArmL:90,upperArmR:135,foreArmR:90,thighL:5,shinL:4,thighR:3,shinR:2 },
    { hip:{x:105,y:151}, torso:-72, upperArmL:145,foreArmL:90,upperArmR:-40,foreArmR:-30,thighL:5,shinL:4,thighR:145,shinR:90 },
  ],
  crunch: [
    { hip:{x:98,y:170}, torso:-88, upperArmL:-110,foreArmL:-80,upperArmR:-70,foreArmR:-100,thighL:35,shinL:95,thighR:145,shinR:85 },
    { hip:{x:98,y:170}, torso:-58, upperArmL:-120,foreArmL:-70,upperArmR:-60,foreArmR:-110,thighL:35,shinL:95,thighR:145,shinR:85 },
  ],
  legRaise: [
    { hip:{x:96,y:170}, torso:-90, upperArmL:175,foreArmL:175,upperArmR:5,foreArmR:5,thighL:3,shinL:2,thighR:-3,shinR:-2 },
    { hip:{x:96,y:170}, torso:-90, upperArmL:175,foreArmL:175,upperArmR:5,foreArmR:5,thighL:-65,shinL:-70,thighR:-75,shinR:-80 },
  ],
  rotation: [
    { hip:{x:90,y:137}, torso:0, upperArmL:160,foreArmL:175,upperArmR:20,foreArmR:5,thighL:105,shinL:90,thighR:75,shinR:90 },
    { hip:{x:90,y:137}, torso:0, upperArmL:20,foreArmL:5,upperArmR:160,foreArmR:175,thighL:105,shinL:90,thighR:75,shinR:90 },
  ],
  carry: [
    { hip:{x:90,y:132}, torso:0, upperArmL:100,foreArmL:90,upperArmR:80,foreArmR:90,thighL:105,shinL:90,thighR:75,shinR:90 },
    { hip:{x:90,y:132}, torso:0, upperArmL:100,foreArmL:90,upperArmR:80,foreArmR:90,thighL:80,shinL:100,thighR:100,shinR:80 },
  ],
  crawl: [
    { hip:{x:105,y:152}, torso:-65, upperArmL:150,foreArmL:90,upperArmR:135,foreArmR:90,thighL:35,shinL:90,thighR:145,shinR:90 },
    { hip:{x:105,y:152}, torso:-65, upperArmL:135,foreArmL:90,upperArmR:150,foreArmR:90,thighL:145,shinL:90,thighR:35,shinR:90 },
  ],
  cardio: [
    { hip:{x:90,y:132}, torso:-4, upperArmL:125,foreArmL:75,upperArmR:55,foreArmR:105,thighL:115,shinL:80,thighR:65,shinR:100 },
    { hip:{x:90,y:126}, torso:2, upperArmL:-135,foreArmL:-105,upperArmR:-45,foreArmR:-75,thighL:135,shinL:90,thighR:45,shinR:90 },
  ],
  stretch: [
    { hip:{x:90,y:138}, torso:0, upperArmL:165,foreArmL:175,upperArmR:15,foreArmR:5,thighL:105,shinL:90,thighR:75,shinR:90 },
    { hip:{x:90,y:150}, torso:48, upperArmL:135,foreArmL:110,upperArmR:45,foreArmR:70,thighL:120,shinL:90,thighR:60,shinR:90 },
  ],
  mobility: [
    { hip:{x:90,y:135}, torso:0, upperArmL:145,foreArmL:125,upperArmR:35,foreArmR:55,thighL:110,shinL:90,thighR:70,shinR:90 },
    { hip:{x:90,y:135}, torso:-8, upperArmL:-145,foreArmL:-120,upperArmR:-35,foreArmR:-60,thighL:65,shinL:95,thighR:115,shinR:85 },
  ],
  generic: [
    { hip:{x:90,y:132}, torso:0, upperArmL:100,foreArmL:90,upperArmR:80,foreArmR:90,thighL:92,shinL:88,thighR:88,shinR:92 },
    { hip:{x:90,y:132}, torso:0, upperArmL:145,foreArmL:90,upperArmR:35,foreArmR:90,thighL:105,shinL:80,thighR:75,shinR:100 },
  ],
};

function point(p: Point, len: number, angle: number): Point {
  const r = angle * Math.PI / 180;
  return { x: p.x + Math.cos(r) * len, y: p.y + Math.sin(r) * len };
}

function Limb({ a, b, width=10 }: { a:Point; b:Point; width?:number }) {
  return <g><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={SKIN_DARK} strokeWidth={width+2} strokeLinecap="round"/><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={SKIN} strokeWidth={width} strokeLinecap="round"/></g>;
}

function Shoe({ p, flip=false }: { p:Point; flip?:boolean }) {
  return <path d={`M${p.x-7} ${p.y-3} q${flip?-8:8} 2 ${flip?-14:14} 8 q-2 7 -15 5 l-8 -2 q-3 -8 4 -11z`} fill={SHOE} transform={flip?`scale(-1 1) translate(${-2*p.x} 0)`:undefined}/>;
}

function Athlete({ pose, mode, phase }: { pose:Pose; mode:Mode; phase:0|1 }) {
  const shoulder = point(pose.hip, 48, pose.torso-90);
  const neck = point(shoulder, 7, pose.torso-90);
  const head = point(neck, 14, pose.torso-90);
  const leftShoulder = point(shoulder, 12, pose.torso+180);
  const rightShoulder = point(shoulder, 12, pose.torso);
  const elbowL = point(leftShoulder, 31, pose.upperArmL);
  const handL = point(elbowL, 28, pose.foreArmL);
  const elbowR = point(rightShoulder, 31, pose.upperArmR);
  const handR = point(elbowR, 28, pose.foreArmR);
  const kneeL = point(pose.hip, 42, pose.thighL);
  const ankleL = point(kneeL, 43, pose.shinL);
  const kneeR = point(pose.hip, 42, pose.thighR);
  const ankleR = point(kneeR, 43, pose.shinR);
  const torsoL = point(shoulder, 16, pose.torso+180);
  const torsoR = point(shoulder, 16, pose.torso);
  const hipL = point(pose.hip, 12, pose.torso+180);
  const hipR = point(pose.hip, 12, pose.torso);
  return <g>
    <Limb a={hipL} b={kneeL} width={13}/><Limb a={kneeL} b={ankleL} width={11}/>
    <Limb a={hipR} b={kneeR} width={13}/><Limb a={kneeR} b={ankleR} width={11}/>
    <Shoe p={ankleL}/><Shoe p={ankleR} flip/>
    <path d={`M${torsoL.x} ${torsoL.y} Q${shoulder.x} ${shoulder.y-5} ${torsoR.x} ${torsoR.y} L${hipR.x+2} ${hipR.y} Q${pose.hip.x} ${pose.hip.y+7} ${hipL.x-2} ${hipL.y}Z`} fill={SHIRT}/>
    <path d={`M${hipL.x-4} ${hipL.y-5} L${hipR.x+4} ${hipR.y-5} L${hipR.x+5} ${hipR.y+15} L${pose.hip.x} ${pose.hip.y+10} L${hipL.x-5} ${hipL.y+15}Z`} fill={SHORTS}/>
    <Limb a={leftShoulder} b={elbowL} width={9}/><Limb a={elbowL} b={handL} width={8}/>
    <Limb a={rightShoulder} b={elbowR} width={9}/><Limb a={elbowR} b={handR} width={8}/>
    <circle cx={handL.x} cy={handL.y} r="5" fill={SKIN}/><circle cx={handR.x} cy={handR.y} r="5" fill={SKIN}/>
    <ellipse cx={head.x} cy={head.y} rx="12" ry="14" fill={SKIN}/>
    <path d={`M${head.x-11} ${head.y-5} q4 -13 15 -11 q10 2 10 10 q-8 -5 -18 -2z`} fill="#111827"/>
    <circle cx={head.x+5} cy={head.y-1} r="1.2" fill="#111827"/>
    <path d={`M${head.x+5} ${head.y+6} q4 2 7 -1`} fill="none" stroke={SKIN_DARK} strokeWidth="1.4" strokeLinecap="round"/>
    <Equipment mode={mode} pose={pose} handL={handL} handR={handR} phase={phase}/>
  </g>;
}

function Dumbbell({ p }: { p:Point }) {
  return <g transform={`translate(${p.x} ${p.y})`}><rect x="-10" y="-2" width="20" height="4" rx="2" fill={METAL2}/><rect x="-15" y="-7" width="6" height="14" rx="2" fill={SHOE}/><rect x="9" y="-7" width="6" height="14" rx="2" fill={SHOE}/></g>;
}
function Barbell({ y=83 }: { y?:number }) {
  return <g><rect x="25" y={y-2} width="130" height="4" rx="2" fill={METAL2}/><circle cx="31" cy={y} r="13" fill={SHOE}/><circle cx="149" cy={y} r="13" fill={SHOE}/><circle cx="31" cy={y} r="5" fill={METAL}/><circle cx="149" cy={y} r="5" fill={METAL}/></g>;
}
function Bench({ incline=false }: { incline?:boolean }) {
  return <g><rect x={incline?46:32} y={incline?142:176} width={incline?85:116} height="10" rx="5" fill={METAL} transform={incline?"rotate(-25 46 142)":undefined}/><rect x="46" y="180" width="7" height="35" rx="3" fill={METAL2}/><rect x="128" y="180" width="7" height="35" rx="3" fill={METAL2}/></g>;
}
function Equipment({mode, pose, handL, handR, phase}:{mode:Mode;pose:Pose;handL:Point;handR:Point;phase:0|1}) {
  if (["hinge","squat"].includes(mode)) return <>{mode==="hinge"?<Barbell y={Math.max(handL.y,handR.y)}/>:phase===0?<Barbell y={85}/>:null}</>;
  if (["curl","raise","shoulderPress","carry"].includes(mode)) return <><Dumbbell p={handL}/><Dumbbell p={handR}/></>;
  if (["benchPress","fly"].includes(mode)) return <><Bench/><Dumbbell p={handL}/><Dumbbell p={handR}/></>;
  if (mode==="hipThrust") return <><Bench/><Barbell y={pose.hip.y-4}/></>;
  if (mode==="verticalPull") return <rect x="24" y="33" width="132" height="7" rx="3.5" fill={METAL}/>;
  if (mode==="dip") return <g><rect x="25" y="126" width="45" height="7" rx="3" fill={METAL}/><rect x="110" y="126" width="45" height="7" rx="3" fill={METAL}/></g>;
  if (mode==="legMachine") return <g><rect x="28" y="142" width="75" height="13" rx="6" fill={METAL}/><rect x="42" y="154" width="12" height="57" rx="5" fill={METAL2}/><rect x="82" y="154" width="12" height="57" rx="5" fill={METAL2}/><rect x="102" y="109" width="25" height="74" rx="9" fill="#222a35"/></g>;
  if (mode==="calf") return <rect x="64" y="204" width="55" height="14" rx="3" fill={METAL}/>;
  if (mode==="rotation") return <g><circle cx="153" cy="78" r="5" fill={GREEN}/><line x1="153" y1="78" x2={handR.x} y2={handR.y} stroke={METAL2} strokeWidth="2"/></g>;
  return null;
}

function Frame({ pose, mode, phase, right=false }: {pose:Pose;mode:Mode;phase:0|1;right?:boolean}) {
  return <div className={right?"border-l border-slate-200":""}>
    <svg viewBox="0 0 180 230" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id={`floor-${mode}-${phase}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0"/><stop offset="1" stopColor="#e9e6df" stopOpacity=".9"/></linearGradient></defs>
      <rect width="180" height="230" fill="#fff"/><rect y="178" width="180" height="52" fill={`url(#floor-${mode}-${phase})`}/>
      <ellipse cx="92" cy="211" rx="54" ry="7" fill="#c9c7c2" opacity=".45"/>
      <Athlete pose={pose} mode={mode} phase={phase}/>
    </svg>
  </div>;
}

export default function ProfessionalExerciseVisual({code,name,group,material}:Props) {
  const mode=modeFor(name,group);
  const [start,end]=poses[mode];
  const groupLabel=(group||"Ejercicio").replaceAll("_"," ");
  return <div className="relative h-full w-full overflow-hidden bg-white">
    <div className="absolute left-3 top-3 z-10 rounded-full border border-emerald-200 bg-white/95 px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] text-emerald-700 shadow-sm">{code||groupLabel}</div>
    <div className="grid h-full grid-cols-2 pt-7"><Frame pose={start} mode={mode} phase={0}/><Frame pose={end} mode={mode} phase={1} right/></div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-white via-white/95 to-transparent px-3 pb-2 pt-6 text-[9px] font-bold text-slate-600"><span>Inicio</span><span className="text-emerald-700">{material||"Ejecución"}</span><span>Ejecución</span></div>
  </div>;
}
