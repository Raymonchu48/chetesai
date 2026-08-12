type Mode="pushup"|"dumbbellpress"|"fly"|"dips"|"barpress"|"inclinedb"|"inclinebar"|"diamond"|"decline"|"cablefly"|"machine"|"pullover";
const modes:Record<string,Mode>={"CHE-PEC-001":"pushup","CHE-PEC-002":"dumbbellpress","CHE-PEC-003":"fly","CHE-PEC-004":"dips","CHE-PEC-005":"barpress","CHE-PEC-006":"inclinedb","CHE-PEC-007":"inclinebar","CHE-PEC-008":"diamond","CHE-PEC-009":"decline","CHE-PEC-010":"cablefly","CHE-PEC-011":"machine","CHE-PEC-012":"pullover"};

export default function ChestExerciseVisual({code,name}:{code?:string|null;name:string}){
 const mode=(code&&modes[code])||"pushup";
 return <div className="relative h-full w-full overflow-hidden bg-[#f6f1e8]">
  <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-[#07111f] px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-white"><span>Chetesaí Fitness+</span><span className="text-emerald-400">Pecho</span></div>
  <div className="grid h-full grid-cols-2 pt-8"><Frame mode={mode} phase="start" label="Inicio"/><Frame mode={mode} phase="end" label="Ejecución" right/></div>
  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#f6f1e8] via-[#f6f1e8]/95 to-transparent px-4 pb-2 pt-5 text-center text-[10px] font-bold text-slate-700">{name}</div>
 </div>
}

function Frame({mode,phase,label,right=false}:{mode:Mode;phase:"start"|"end";label:string;right?:boolean}){
 return <div className={right?"border-l border-slate-300/70":""}><svg viewBox="0 0 180 250" className="h-full w-full" aria-label={label}>
  <defs><linearGradient id="shirt" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#111827"/><stop offset="1" stopColor="#263244"/></linearGradient><linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#edb184"/><stop offset="1" stopColor="#c98258"/></linearGradient></defs>
  <ellipse cx="90" cy="224" rx="55" ry="8" fill="#d9d3c8" opacity=".75"/>
  {mode==="pushup"||mode==="diamond"||mode==="decline"?<Pushup phase={phase} decline={mode==="decline"} diamond={mode==="diamond"}/>:mode==="dips"?<Dips phase={phase}/>:mode==="cablefly"?<CableFly phase={phase}/>:<BenchPress mode={mode} phase={phase}/>} 
  <text x="90" y="244" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f172a">{label}</text>
 </svg></div>
}

function Head({x,y,rotate=0}:{x:number;y:number;rotate?:number}){return <g transform={`translate(${x} ${y}) rotate(${rotate})`}><ellipse cx="0" cy="0" rx="12" ry="14" fill="url(#skin)"/><path d="M-11 -3 Q-7 -15 5 -14 Q14 -10 11 1 Q5 -5 -2 -5 Q-7 -5 -11 -3Z" fill="#18202c"/><path d="M10 0 Q15 3 10 6" fill="none" stroke="#9d5d3c" strokeWidth="1.4"/><circle cx="5" cy="-1" r="1.2" fill="#111827"/></g>}
function Torso({x,y,w=48,h=58,rotate=0}:{x:number;y:number;w?:number;h?:number;rotate?:number}){return <g transform={`translate(${x} ${y}) rotate(${rotate})`}><path d={`M${-w/2+5} ${-h/2+2} Q0 ${-h/2-6} ${w/2-5} ${-h/2+2} L${w/2} ${h/2-8} Q0 ${h/2+6} ${-w/2} ${h/2-8}Z`} fill="url(#shirt)"/><path d="M-14 -15 Q0 -5 14 -15" fill="none" stroke="#334155" strokeWidth="2"/><path d="M-18 4 Q0 12 18 4" fill="none" stroke="#0f766e" strokeWidth="3" opacity=".45"/></g>}
function Limb({x1,y1,x2,y2,w=9}:{x1:number;y1:number;x2:number;y2:number;w?:number}){return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#skin)" strokeWidth={w} strokeLinecap="round"/>}
function Shoe({x,y,flip=false}:{x:number;y:number;flip?:boolean}){return <path d={flip?`M${x+9} ${y-2} Q${x} ${y-3} ${x-11} ${y+4} Q${x-8} ${y+9} ${x+10} ${y+8}Z`:`M${x-9} ${y-2} Q${x} ${y-3} ${x+11} ${y+4} Q${x+8} ${y+9} ${x-10} ${y+8}Z`} fill="#111827"/>}
function Dumbbell({x,y}:{x:number;y:number}){return <g><line x1={x-7} y1={y} x2={x+7} y2={y} stroke="#111827" strokeWidth="3"/><circle cx={x-9} cy={y} r="5" fill="#111827"/><circle cx={x+9} cy={y} r="5" fill="#111827"/></g>}

function Pushup({phase,decline,diamond}:{phase:"start"|"end";decline:boolean;diamond:boolean}){
 const down=phase==="end";const sy=down?132:112;const handGap=diamond?10:22;
 return <>{decline?<><rect x="132" y="160" width="34" height="8" rx="4" fill="#64748b"/><rect x="138" y="168" width="4" height="26" fill="#64748b"/><rect x="156" y="168" width="4" height="26" fill="#64748b"/></>:null}
  <g transform={`rotate(${down?6:-6} 92 ${sy})`}><Head x={45} y={sy-26} rotate={6}/><Torso x={83} y={sy} w={55} h={42} rotate={6}/><Limb x1={60} y1={sy-2} x2={72-handGap} y2={down?156:147} w={8}/><Limb x1={104} y1={sy+1} x2={96+handGap} y2={down?156:147} w={8}/><circle cx={72-handGap} cy={down?156:147} r="4" fill="#d18a61"/><circle cx={96+handGap} cy={down?156:147} r="4" fill="#d18a61"/><path d={`M108 ${sy+8} Q132 ${sy+16} 150 ${decline?158:174}`} fill="none" stroke="#111827" strokeWidth="18" strokeLinecap="round"/><Limb x1={145} y1={decline?154:172} x2={decline?151:162} y2={decline?160:179} w={8}/><Shoe x={decline?153:163} y={decline?160:179}/></g></>
}

function Dips({phase}:{phase:"start"|"end"}){const y=phase==="end"?105:82;return <><line x1="30" y1="128" x2="65" y2="128" stroke="#475569" strokeWidth="6"/><line x1="115" y1="128" x2="150" y2="128" stroke="#475569" strokeWidth="6"/><Head x={90} y={48}/><Torso x={90} y={y} w={48} h={60}/><Limb x1={69} y1={y-20} x2={54} y2={phase==="end"?108:91}/><Limb x1={111} y1={y-20} x2={126} y2={phase==="end"?108:91}/><Limb x1={54} y1={phase==="end"?108:91} x2={48} y2="128"/><Limb x1={126} y1={phase==="end"?108:91} x2={132} y2="128"/><path d={`M77 ${y+27} Q73 160 67 197`} fill="none" stroke="#111827" strokeWidth="15" strokeLinecap="round"/><path d={`M103 ${y+27} Q107 160 113 197`} fill="none" stroke="#111827" strokeWidth="15" strokeLinecap="round"/><Shoe x={67} y={201} flip/><Shoe x={113} y={201}/></>}

function CableFly({phase}:{phase:"start"|"end"}){const open=phase==="start";const lx=open?28:78,rx=open?152:102;return <><line x1="18" y1="48" x2="18" y2="204" stroke="#64748b" strokeWidth="4"/><line x1="162" y1="48" x2="162" y2="204" stroke="#64748b" strokeWidth="4"/><Head x={90} y={46}/><Torso x={90} y={93} w={48} h={62}/><Limb x1={70} y1="78" x2={lx} y2="102"/><Limb x1={110} y1="78" x2={rx} y2="102"/><line x1="18" y1="60" x2={lx} y2="102" stroke="#94a3b8" strokeWidth="2"/><line x1="162" y1="60" x2={rx} y2="102" stroke="#94a3b8" strokeWidth="2"/><path d="M78 121 Q72 158 67 199" fill="none" stroke="#111827" strokeWidth="15" strokeLinecap="round"/><path d="M102 121 Q108 158 113 199" fill="none" stroke="#111827" strokeWidth="15" strokeLinecap="round"/><Shoe x={67} y={204} flip/><Shoe x={113} y={204}/></>}

function BenchPress({mode,phase}:{mode:Mode;phase:"start"|"end"}){
 const incline=mode==="inclinedb"||mode==="inclinebar";const fly=mode==="fly";const pullover=mode==="pullover";const machine=mode==="machine";const bar=mode==="barpress"||mode==="inclinebar";
 const baseY=incline?145:158;
 return <>{incline?<line x1="43" y1="169" x2="110" y2="116" stroke="#64748b" strokeWidth="10" strokeLinecap="round"/>:<line x1="38" y1="172" x2="138" y2="172" stroke="#64748b" strokeWidth="10" strokeLinecap="round"/>}<line x1="53" y1="176" x2="48" y2="215" stroke="#64748b" strokeWidth="6"/><line x1="123" y1="176" x2="129" y2="215" stroke="#64748b" strokeWidth="6"/>
  <Head x={58} y={baseY-37} rotate={incline?-22:0}/><Torso x={91} y={baseY-12} w={58} h={40} rotate={incline?-22:0}/><path d={`M112 ${baseY-1} Q128 ${baseY+12} 141 201`} fill="none" stroke="#111827" strokeWidth="15" strokeLinecap="round"/><path d={`M98 ${baseY+1} Q112 ${baseY+16} 118 202`} fill="none" stroke="#111827" strokeWidth="15" strokeLinecap="round"/><Shoe x={142} y={204}/><Shoe x={118} y={204}/>
  {pullover?<PulloverArms phase={phase} baseY={baseY}/>:fly?<FlyArms phase={phase} baseY={baseY}/>:machine?<MachineArms phase={phase} baseY={baseY}/>:<PressArms phase={phase} baseY={baseY} bar={bar}/>}</>}
function PressArms({phase,baseY,bar}:{phase:"start"|"end";baseY:number;bar:boolean}){const top=phase==="end"?baseY-72:baseY-28;return <><Limb x1={75} y1={baseY-22} x2={62} y2={baseY-46}/><Limb x1={106} y1={baseY-16} x2={116} y2={baseY-46}/><Limb x1={62} y1={baseY-46} x2={62} y2={top}/><Limb x1={116} y1={baseY-46} x2={116} y2={top}/>{bar?<><line x1="42" y1={top} x2="136" y2={top} stroke="#111827" strokeWidth="5"/><circle cx="45" cy={top} r="8" fill="#334155"/><circle cx="133" cy={top} r="8" fill="#334155"/></>:<><Dumbbell x={62} y={top}/><Dumbbell x={116} y={top}/></>}</>}
function FlyArms({phase,baseY}:{phase:"start"|"end";baseY:number}){const spread=phase==="start"?37:76;return <><Limb x1={77} y1={baseY-22} x2={spread} y2={baseY-63}/><Limb x1={103} y1={baseY-16} x2={180-spread} y2={baseY-63}/><Dumbbell x={spread} y={baseY-63}/><Dumbbell x={180-spread} y={baseY-63}/></>}
function PulloverArms({phase,baseY}:{phase:"start"|"end";baseY:number}){const hx=phase==="start"?39:89,hy=phase==="start"?107:83;return <><Limb x1={78} y1={baseY-22} x2="61" y2={baseY-49}/><Limb x1="61" y1={baseY-49} x2={hx} y2={hy}/><Dumbbell x={hx} y={hy}/></>}
function MachineArms({phase,baseY}:{phase:"start"|"end";baseY:number}){const x=phase==="start"?55:86;return <><rect x="31" y="80" width="8" height="110" fill="#64748b"/><rect x="141" y="80" width="8" height="110" fill="#64748b"/><Limb x1={74} y1={baseY-23} x2={x} y2={baseY-52}/><Limb x1={106} y1={baseY-16} x2={180-x} y2={baseY-52}/></>}
