type Mode="curl"|"hammer"|"pushdown"|"overhead"|"barcurl"|"preacher"|"incline"|"cablecurl"|"skull"|"benchdip"|"closepress"|"singlepush"|"zottman"|"concentration";

const modes:Record<string,Mode>={
  "CHE-BRA-001":"curl","CHE-BRA-002":"hammer","CHE-BRA-003":"pushdown","CHE-BRA-004":"overhead",
  "CHE-BRA-005":"barcurl","CHE-BRA-006":"preacher","CHE-BRA-007":"incline","CHE-BRA-008":"cablecurl",
  "CHE-BRA-009":"skull","CHE-BRA-010":"benchdip","CHE-BRA-011":"closepress","CHE-BRA-012":"singlepush",
  "CHE-BRA-013":"zottman","CHE-BRA-014":"concentration"
};

export default function ArmExerciseVisual({code,name,group}:{code?:string|null;name:string;group?:string}){
 const mode=(code&&modes[code])||((group==="triceps")?"pushdown":"curl");
 return <div className="relative h-full w-full overflow-hidden bg-[#f7f4ed]">
  <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-white"><span>Chetesaí Fitness+</span><span className="text-lime-400">{group==="triceps"?"Tríceps":"Bíceps"}</span></div>
  <div className="grid h-full grid-cols-2 pt-8"><Frame mode={mode} phase="start" label="Inicio"/><Frame mode={mode} phase="end" label="Ejecución" right/></div>
  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#f7f4ed] via-[#f7f4ed]/95 to-transparent px-4 pb-2 pt-5 text-center text-[10px] font-bold text-slate-700">{name}</div>
 </div>
}

function Frame({mode,phase,label,right=false}:{mode:Mode;phase:"start"|"end";label:string;right?:boolean}){
 const seated=["preacher","incline","concentration","benchdip","skull","closepress"].includes(mode); const triceps=["pushdown","overhead","skull","benchdip","closepress","singlepush"].includes(mode);
 const shoulderY=78,hipY=146,kneeY=184,footY=220;
 return <div className={right?"border-l border-slate-300/70":""}><svg viewBox="0 0 160 240" className="h-full w-full" aria-label={label}>
  <ellipse cx="80" cy="221" rx="42" ry="7" fill="#d8d3c8" opacity=".7"/>
  {seated?<><rect x="45" y="157" width="70" height="10" rx="5" fill="#475569"/><rect x="52" y="167" width="6" height="46" fill="#64748b"/><rect x="102" y="167" width="6" height="46" fill="#64748b"/></>:null}
  {mode==="preacher"?<path d="M42 117 L118 102 L123 115 L48 130Z" fill="#64748b"/>:null}
  {mode==="pushdown"||mode==="singlepush"||mode==="cablecurl"?<><line x1="133" y1="36" x2="133" y2="190" stroke="#94a3b8" strokeWidth="3"/><circle cx="133" cy="50" r="8" fill="#475569"/><line x1="133" y1="58" x2="108" y2={mode==="cablecurl"?172:92} stroke="#64748b" strokeWidth="2"/></>:null}
  <circle cx="80" cy="48" r="13" fill="#d59a70" stroke="#0f172a" strokeWidth="2"/><path d="M69 41 Q80 25 92 42" fill="#111827"/>
  <line x1="80" y1={shoulderY} x2="80" y2={hipY} stroke="#111827" strokeWidth="21" strokeLinecap="round"/>
  <line x1="80" y1={hipY} x2="61" y2={kneeY} stroke="#d59a70" strokeWidth="10" strokeLinecap="round"/><line x1="61" y1={kneeY} x2="53" y2={footY} stroke="#d59a70" strokeWidth="9" strokeLinecap="round"/>
  <line x1="80" y1={hipY} x2="99" y2={kneeY} stroke="#d59a70" strokeWidth="10" strokeLinecap="round"/><line x1="99" y1={kneeY} x2="107" y2={footY} stroke="#d59a70" strokeWidth="9" strokeLinecap="round"/>
  <line x1="45" y1={footY} x2="61" y2={footY} stroke="#111827" strokeWidth="8" strokeLinecap="round"/><line x1="99" y1={footY} x2="115" y2={footY} stroke="#111827" strokeWidth="8" strokeLinecap="round"/>
  <Arms mode={mode} phase={phase} triceps={triceps}/>
  <text x="80" y="238" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">{label}</text>
 </svg></div>
}

function Arms({mode,phase,triceps}:{mode:Mode;phase:"start"|"end";triceps:boolean}){
 const skin="#d59a70", dark="#111827";
 if(mode==="overhead") return <><line x1="68" y1="82" x2="68" y2="50" stroke={skin} strokeWidth="9" strokeLinecap="round"/><line x1="92" y1="82" x2="92" y2="50" stroke={skin} strokeWidth="9" strokeLinecap="round"/><line x1="68" y1="50" x2={phase==="start"?80:68} y2={phase==="start"?72:20} stroke={skin} strokeWidth="8" strokeLinecap="round"/><line x1="92" y1="50" x2={phase==="start"?80:92} y2={phase==="start"?72:20} stroke={skin} strokeWidth="8" strokeLinecap="round"/><circle cx="80" cy={phase==="start"?72:18} r="9" fill={dark}/></>;
 if(mode==="pushdown"||mode==="singlepush") {const y=phase==="start"?112:151;return <><line x1="69" y1="82" x2="69" y2="110" stroke={skin} strokeWidth="9" strokeLinecap="round"/><line x1="91" y1="82" x2="91" y2="110" stroke={skin} strokeWidth="9" strokeLinecap="round"/><line x1="69" y1="110" x2="69" y2={y} stroke={skin} strokeWidth="8" strokeLinecap="round"/>{mode!=="singlepush"?<line x1="91" y1="110" x2="91" y2={y} stroke={skin} strokeWidth="8" strokeLinecap="round"/>:null}<line x1="58" y1={y} x2="102" y2={y} stroke={dark} strokeWidth="5"/></>}
 if(mode==="benchdip") {const elbowY=phase==="start"?112:133;return <><line x1="68" y1="82" x2="52" y2={elbowY} stroke={skin} strokeWidth="9" strokeLinecap="round"/><line x1="92" y1="82" x2="108" y2={elbowY} stroke={skin} strokeWidth="9" strokeLinecap="round"/><line x1="52" y1={elbowY} x2="42" y2="157" stroke={skin} strokeWidth="8" strokeLinecap="round"/><line x1="108" y1={elbowY} x2="118" y2="157" stroke={skin} strokeWidth="8" strokeLinecap="round"/></>}
 if(mode==="skull"||mode==="closepress") {const end=phase==="start"?105:55;return <><line x1="67" y1="85" x2="55" y2="74" stroke={skin} strokeWidth="8"/><line x1="93" y1="85" x2="105" y2="74" stroke={skin} strokeWidth="8"/><line x1="55" y1="74" x2="55" y2={end} stroke={skin} strokeWidth="8"/><line x1="105" y1="74" x2="105" y2={end} stroke={skin} strokeWidth="8"/><line x1="42" y1={end} x2="118" y2={end} stroke={dark} strokeWidth="5"/></>}
 const elbowY=110; const handY=phase==="start"?148:92;
 return <><line x1="68" y1="82" x2="65" y2={elbowY} stroke={skin} strokeWidth="9" strokeLinecap="round"/><line x1="92" y1="82" x2="95" y2={elbowY} stroke={skin} strokeWidth="9" strokeLinecap="round"/><line x1="65" y1={elbowY} x2="60" y2={handY} stroke={skin} strokeWidth="8" strokeLinecap="round"/><line x1="95" y1={elbowY} x2="100" y2={handY} stroke={skin} strokeWidth="8" strokeLinecap="round"/>{mode==="barcurl"||mode==="cablecurl"?<line x1="47" y1={handY} x2="113" y2={handY} stroke={dark} strokeWidth="5"/>:<><circle cx="58" cy={handY} r="8" fill={dark}/><circle cx="102" cy={handY} r="8" fill={dark}/></>}</>;
}
