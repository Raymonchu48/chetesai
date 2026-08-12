type Pose = { hip:number; knee:number; torso:number; arms?:"front"|"down"|"bar"; box?:boolean; bench?:boolean };

const poses: Record<string,[Pose,Pose]> = {
  "CHE-PIE-001":[{hip:118,knee:194,torso:0,arms:"front",box:true},{hip:154,knee:164,torso:8,arms:"front",box:true}],
  "CHE-PIE-002":[{hip:118,knee:194,torso:0,arms:"bar"},{hip:154,knee:164,torso:8,arms:"bar"}],
  "CHE-PIE-003":[{hip:122,knee:192,torso:0,arms:"down"},{hip:150,knee:166,torso:3,arms:"down"}],
  "CHE-PIE-004":[{hip:118,knee:194,torso:0,arms:"bar"},{hip:142,knee:188,torso:42,arms:"bar"}],
  "CHE-PIE-006":[{hip:126,knee:192,torso:0,arms:"down",box:true},{hip:108,knee:174,torso:0,arms:"down",box:true}],
  "CHE-PIE-007":[{hip:118,knee:194,torso:0,arms:"front"},{hip:158,knee:164,torso:10,arms:"front"}],
  "CHE-PIE-008":[{hip:118,knee:194,torso:0,arms:"bar"},{hip:158,knee:164,torso:10,arms:"bar"}],
  "CHE-PIE-009":[{hip:118,knee:194,torso:0,arms:"bar"},{hip:156,knee:165,torso:7,arms:"bar"}],
  "CHE-PIE-014":[{hip:142,knee:188,torso:42,arms:"bar"},{hip:118,knee:194,torso:0,arms:"bar"}],
  "CHE-PIE-016":[{hip:122,knee:192,torso:0,arms:"down"},{hip:150,knee:166,torso:2,arms:"down"}],
  "CHE-PIE-017":[{hip:120,knee:194,torso:0,arms:"front"},{hip:146,knee:174,torso:4,arms:"front"}],
  "CHE-PIE-018":[{hip:124,knee:192,torso:0,arms:"down",bench:true},{hip:150,knee:165,torso:3,arms:"down",bench:true}],
  "CHE-PIE-019":[{hip:118,knee:194,torso:0,arms:"bar"},{hip:138,knee:190,torso:38,arms:"bar"}],
  "CHE-PIE-020":[{hip:118,knee:194,torso:0,arms:"down"},{hip:108,knee:184,torso:0,arms:"down"}],
  "CHE-PIE-021":[{hip:145,knee:180,torso:0,arms:"down",bench:true},{hip:137,knee:172,torso:0,arms:"down",bench:true}],
};

export default function LegExerciseVisual({code,name}:{code?:string|null;name:string}){
 const pair=(code&&poses[code])||poses["CHE-PIE-007"];
 return <div className="relative h-full w-full overflow-hidden bg-[#f7f4ed]">
   <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-slate-950 px-4 py-2 text-[10px] font-black uppercase tracking-[.18em] text-white"><span>Chetesaí Fitness+</span><span className="text-lime-400">Piernas</span></div>
   <div className="grid h-full grid-cols-2 pt-8">
     <Frame pose={pair[0]} label="Inicio" />
     <Frame pose={pair[1]} label="Ejecución" right />
   </div>
   <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#f7f4ed] via-[#f7f4ed]/95 to-transparent px-4 pb-2 pt-5 text-center text-[10px] font-bold text-slate-700">{name}</div>
 </div>
}

function Frame({pose,label,right=false}:{pose:Pose;label:string;right?:boolean}){
 const cx=right?238:82; const shoulderY=pose.hip-58; const headY=shoulderY-25; const angle=pose.torso;
 const rad=angle*Math.PI/180; const shoulderX=cx-Math.sin(rad)*38; const torsoBottomX=cx; const hipY=pose.hip;
 const kneeY=pose.knee; const footY=218;
 return <div className={`relative flex items-end justify-center ${right?"border-l border-slate-300/70":""}`}>
   <svg viewBox="0 0 160 240" className="h-full w-full" aria-label={label}>
     <ellipse cx="80" cy="220" rx="42" ry="7" fill="#d8d3c8" opacity=".7"/>
     {pose.box?<rect x="105" y="176" width="42" height="35" rx="5" fill="#d7d2c8" stroke="#94a3b8"/>:null}
     {pose.bench?<rect x="105" y="166" width="47" height="12" rx="5" fill="#cbd5e1"/>:null}
     <g transform={`translate(${cx-80} 0)`}>
       <circle cx={shoulderX} cy={headY} r="12" fill="#d59a70" stroke="#0f172a" strokeWidth="2"/>
       <path d={`M${shoulderX-8} ${headY-8} Q${shoulderX} ${headY-18} ${shoulderX+10} ${headY-7}`} fill="#111827"/>
       <line x1={shoulderX} y1={shoulderY} x2={torsoBottomX} y2={hipY} stroke="#111827" strokeWidth="19" strokeLinecap="round"/>
       <line x1={torsoBottomX} y1={hipY} x2={62} y2={kneeY} stroke="#d59a70" strokeWidth="10" strokeLinecap="round"/>
       <line x1={62} y1={kneeY} x2={52} y2={footY} stroke="#d59a70" strokeWidth="9" strokeLinecap="round"/>
       <line x1={torsoBottomX} y1={hipY} x2={98} y2={kneeY} stroke="#d59a70" strokeWidth="10" strokeLinecap="round"/>
       <line x1={98} y1={kneeY} x2={108} y2={footY} stroke="#d59a70" strokeWidth="9" strokeLinecap="round"/>
       <line x1="43" y1={footY} x2="60" y2={footY} stroke="#111827" strokeWidth="8" strokeLinecap="round"/>
       <line x1="100" y1={footY} x2="117" y2={footY} stroke="#111827" strokeWidth="8" strokeLinecap="round"/>
       <Arms mode={pose.arms||"front"} shoulderX={shoulderX} shoulderY={shoulderY}/>
     </g>
     <text x="80" y="238" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">{label}</text>
   </svg>
 </div>
}

function Arms({mode,shoulderX,shoulderY}:{mode:string;shoulderX:number;shoulderY:number}){
 if(mode==="down") return <><line x1={shoulderX-6} y1={shoulderY+4} x2={shoulderX-15} y2={shoulderY+48} stroke="#d59a70" strokeWidth="8" strokeLinecap="round"/><line x1={shoulderX+6} y1={shoulderY+4} x2={shoulderX+15} y2={shoulderY+48} stroke="#d59a70" strokeWidth="8" strokeLinecap="round"/></>;
 if(mode==="bar") return <><line x1="24" y1={shoulderY+4} x2="136" y2={shoulderY+4} stroke="#111827" strokeWidth="5"/><circle cx="30" cy={shoulderY+4} r="10" fill="#334155"/><circle cx="130" cy={shoulderY+4} r="10" fill="#334155"/><line x1={shoulderX-5} y1={shoulderY+3} x2="60" y2={shoulderY+7} stroke="#d59a70" strokeWidth="7"/><line x1={shoulderX+5} y1={shoulderY+3} x2="100" y2={shoulderY+7} stroke="#d59a70" strokeWidth="7"/></>;
 return <><line x1={shoulderX-4} y1={shoulderY+4} x2="34" y2={shoulderY+12} stroke="#d59a70" strokeWidth="8" strokeLinecap="round"/><line x1={shoulderX+4} y1={shoulderY+4} x2="126" y2={shoulderY+12} stroke="#d59a70" strokeWidth="8" strokeLinecap="round"/></>;
}
