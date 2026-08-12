type Mode="bandrow"|"onerow"|"pulldown"|"pullup"|"barrow"|"cablerow"|"machinerow"|"neutralpull"|"chinup"|"pullover"|"facepull"|"inverted"|"scapular";

const modes:Record<string,Mode>={
  "CHE-ESP-001":"bandrow","CHE-ESP-002":"onerow","CHE-ESP-003":"pulldown","CHE-ESP-004":"pullup",
  "CHE-ESP-005":"barrow","CHE-ESP-006":"cablerow","CHE-ESP-007":"machinerow","CHE-ESP-008":"neutralpull",
  "CHE-ESP-009":"chinup","CHE-ESP-010":"pullover","CHE-ESP-011":"facepull","CHE-ESP-012":"inverted","CHE-ESP-013":"scapular"
};

export default function BackExerciseVisual({code,name}:{code?:string|null;name:string}){
 const mode=(code&&modes[code])||"bandrow";
 return <div className="relative h-full w-full overflow-hidden bg-[#f7f4ed]">
  <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-white"><span>Chetesaí Fitness+</span><span className="text-lime-400">Espalda</span></div>
  <div className="grid h-full grid-cols-2 pt-8"><Frame mode={mode} phase="start" label="Inicio"/><Frame mode={mode} phase="end" label="Ejecución" right/></div>
  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#f7f4ed] via-[#f7f4ed]/95 to-transparent px-4 pb-2 pt-5 text-center text-[10px] font-bold text-slate-700">{name}</div>
 </div>
}

function Frame({mode,phase,label,right=false}:{mode:Mode;phase:"start"|"end";label:string;right?:boolean}){
 const vertical=["pulldown","pullup","neutralpull","chinup","scapular"].includes(mode);
 const seated=["cablerow","machinerow"].includes(mode);
 return <div className={right?"border-l border-slate-300/70":""}><svg viewBox="0 0 160 240" className="h-full w-full" aria-label={label}>
  <ellipse cx="80" cy="222" rx="42" ry="7" fill="#d8d3c8" opacity=".7"/>
  {vertical?<><line x1="34" y1="28" x2="126" y2="28" stroke="#475569" strokeWidth="5"/><line x1="40" y1="28" x2="40" y2="220" stroke="#cbd5e1" strokeWidth="2"/><line x1="120" y1="28" x2="120" y2="220" stroke="#cbd5e1" strokeWidth="2"/></>:null}
  {seated?<><rect x="45" y="160" width="70" height="10" rx="5" fill="#475569"/><rect x="54" y="170" width="6" height="42" fill="#64748b"/><rect x="100" y="170" width="6" height="42" fill="#64748b"/></>:null}
  {mode==="onerow"?<rect x="102" y="128" width="42" height="9" rx="4" fill="#64748b"/>:null}
  {mode==="inverted"?<><line x1="22" y1="105" x2="138" y2="105" stroke="#475569" strokeWidth="5"/><line x1="30" y1="105" x2="30" y2="220" stroke="#94a3b8" strokeWidth="3"/><line x1="130" y1="105" x2="130" y2="220" stroke="#94a3b8" strokeWidth="3"/></>:null}
  {mode==="facepull"||mode==="pullover"||mode==="bandrow"||mode==="cablerow"?<><line x1="140" y1="45" x2="140" y2="205" stroke="#94a3b8" strokeWidth="3"/><circle cx="140" cy={mode==="cablerow"||mode==="bandrow"?145:58} r="7" fill="#475569"/></>:null}
  <Body mode={mode} phase={phase}/>
  <text x="80" y="238" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">{label}</text>
 </svg></div>
}

function Body({mode,phase}:{mode:Mode;phase:"start"|"end"}){
 const skin="#d59a70",dark="#111827",muscle="#84cc16";
 if(mode==="inverted"){const chestY=phase==="start"?150:118;return <><circle cx="62" cy={chestY-28} r="11" fill={skin} stroke={dark} strokeWidth="2"/><line x1="68" y1={chestY-12} x2="100" y2={chestY+14} stroke={dark} strokeWidth="18" strokeLinecap="round"/><line x1="100" y1={chestY+14} x2="132" y2={chestY+48} stroke={skin} strokeWidth="9"/><line x1="68" y1={chestY-5} x2="50" y2="105" stroke={skin} strokeWidth="8"/><line x1="86" y1={chestY+4} x2="105" y2="105" stroke={skin} strokeWidth="8"/><line x1="78" y1={chestY-4} x2="96" y2={chestY+8} stroke={muscle} strokeWidth="8" strokeLinecap="round"/></>}
 const vertical=["pulldown","pullup","neutralpull","chinup","scapular"].includes(mode); const seated=["cablerow","machinerow"].includes(mode); const bent=["barrow","onerow"].includes(mode);
 const headY=seated?66:48, shoulderY=seated?96:78, hipY=seated?155:146;
 const torsoEnd=bent?128:hipY; const torsoX=bent?102:80;
 return <>
  <circle cx={bent?62:80} cy={headY} r="13" fill={skin} stroke={dark} strokeWidth="2"/><path d={bent?"M51 41 Q62 26 74 42":"M69 41 Q80 25 92 42"} fill={dark}/>
  {bent?<line x1="72" y1="72" x2={torsoX} y2={torsoEnd} stroke={dark} strokeWidth="21" strokeLinecap="round"/>:<line x1="80" y1={shoulderY} x2="80" y2={torsoEnd} stroke={dark} strokeWidth="21" strokeLinecap="round"/>}
  {!bent?<><path d={`M66 ${shoulderY+8} Q80 ${shoulderY+22} 94 ${shoulderY+8} L91 ${shoulderY+58} Q80 ${shoulderY+68} 69 ${shoulderY+58}Z`} fill={muscle} opacity=".65"/>{seated?<><line x1="80" y1={hipY} x2="58" y2="192" stroke={skin} strokeWidth="9"/><line x1="80" y1={hipY} x2="102" y2="192" stroke={skin} strokeWidth="9"/><line x1="58" y1="192" x2="48" y2="220" stroke={skin} strokeWidth="8"/><line x1="102" y1="192" x2="112" y2="220" stroke={skin} strokeWidth="8"/></>:<><line x1="80" y1={hipY} x2="62" y2="184" stroke={skin} strokeWidth="10"/><line x1="80" y1={hipY} x2="98" y2="184" stroke={skin} strokeWidth="10"/><line x1="62" y1="184" x2="54" y2="220" stroke={skin} strokeWidth="9"/><line x1="98" y1="184" x2="106" y2="220" stroke={skin} strokeWidth="9"/></>}</>:<><line x1={torsoX} y1={torsoEnd} x2="93" y2="170" stroke={skin} strokeWidth="10"/><line x1={torsoX} y1={torsoEnd} x2="117" y2="170" stroke={skin} strokeWidth="10"/><line x1="93" y1="170" x2="87" y2="218" stroke={skin} strokeWidth="9"/><line x1="117" y1="170" x2="125" y2="218" stroke={skin} strokeWidth="9"/><path d="M76 77 L99 112" stroke={muscle} strokeWidth="10" strokeLinecap="round"/></>}
  <Arms mode={mode} phase={phase} shoulderY={shoulderY}/>
 </>
}

function Arms({mode,phase,shoulderY}:{mode:Mode;phase:"start"|"end";shoulderY:number}){
 const skin="#d59a70",dark="#111827";
 if(["pulldown","pullup","neutralpull","chinup","scapular"].includes(mode)){const handY=28;const elbowY=phase==="start"?52:86;return <><line x1="68" y1={shoulderY} x2="53" y2={elbowY} stroke={skin} strokeWidth="9" strokeLinecap="round"/><line x1="92" y1={shoulderY} x2="107" y2={elbowY} stroke={skin} strokeWidth="9" strokeLinecap="round"/><line x1="53" y1={elbowY} x2="50" y2={handY} stroke={skin} strokeWidth="8"/><line x1="107" y1={elbowY} x2="110" y2={handY} stroke={skin} strokeWidth="8"/></>}
 if(mode==="pullover"){const handY=phase==="start"?70:120;return <><line x1="68" y1={shoulderY} x2="54" y2="92" stroke={skin} strokeWidth="8"/><line x1="92" y1={shoulderY} x2="106" y2="92" stroke={skin} strokeWidth="8"/><line x1="54" y1="92" x2="52" y2={handY} stroke={skin} strokeWidth="8"/><line x1="106" y1="92" x2="108" y2={handY} stroke={skin} strokeWidth="8"/><line x1="48" y1={handY} x2="112" y2={handY} stroke={dark} strokeWidth="4"/></>}
 if(mode==="facepull"){const handX=phase==="start"?116:92;return <><line x1="68" y1={shoulderY} x2="60" y2="102" stroke={skin} strokeWidth="8"/><line x1="92" y1={shoulderY} x2="100" y2="102" stroke={skin} strokeWidth="8"/><line x1="60" y1="102" x2={handX-8} y2="82" stroke={skin} strokeWidth="8"/><line x1="100" y1="102" x2={handX+8} y2="82" stroke={skin} strokeWidth="8"/></>}
 const handX=phase==="start"?128:94;const elbowX=phase==="start"?102:88;return <><line x1="70" y1={shoulderY} x2={elbowX} y2={shoulderY+22} stroke={skin} strokeWidth="9" strokeLinecap="round"/><line x1={elbowX} y1={shoulderY+22} x2={handX} y2={shoulderY+28} stroke={skin} strokeWidth="8" strokeLinecap="round"/><circle cx={handX+4} cy={shoulderY+28} r="7" fill={dark}/></>
}
