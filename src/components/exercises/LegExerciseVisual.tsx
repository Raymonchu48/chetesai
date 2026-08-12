type Pose={hip:number;knee:number;torso:number;arms?:"front"|"down"|"bar";box?:boolean;bench?:boolean;wide?:boolean;seated?:boolean;machine?:"press"|"extension"|"curl"};

const poses:Record<string,[Pose,Pose]>={
"CHE-PIE-001":[{hip:118,knee:194,torso:0,arms:"front",box:true},{hip:154,knee:164,torso:8,arms:"front",box:true}],
"CHE-PIE-002":[{hip:118,knee:194,torso:0,arms:"bar"},{hip:154,knee:164,torso:8,arms:"bar"}],
"CHE-PIE-003":[{hip:122,knee:192,torso:0,arms:"down"},{hip:150,knee:166,torso:3,arms:"down"}],
"CHE-PIE-004":[{hip:118,knee:194,torso:0,arms:"bar"},{hip:142,knee:188,torso:42,arms:"bar"}],
"CHE-PIE-006":[{hip:126,knee:192,torso:0,arms:"down",box:true},{hip:108,knee:174,torso:0,arms:"down",box:true}],
"CHE-PIE-007":[{hip:118,knee:194,torso:0,arms:"front"},{hip:158,knee:164,torso:10,arms:"front"}],
"CHE-PIE-008":[{hip:118,knee:194,torso:0,arms:"bar"},{hip:158,knee:164,torso:10,arms:"bar"}],
"CHE-PIE-009":[{hip:118,knee:194,torso:0,arms:"bar"},{hip:156,knee:165,torso:7,arms:"bar"}],
"CHE-PIE-010":[{hip:145,knee:166,torso:-18,arms:"down",seated:true,machine:"press"},{hip:145,knee:188,torso:-18,arms:"down",seated:true,machine:"press"}],
"CHE-PIE-011":[{hip:142,knee:176,torso:0,arms:"down",seated:true,machine:"extension"},{hip:142,knee:162,torso:0,arms:"down",seated:true,machine:"extension"}],
"CHE-PIE-012":[{hip:142,knee:182,torso:18,arms:"down",seated:true,machine:"curl"},{hip:142,knee:166,torso:18,arms:"down",seated:true,machine:"curl"}],
"CHE-PIE-013":[{hip:142,knee:180,torso:0,arms:"down",seated:true,machine:"curl"},{hip:142,knee:164,torso:0,arms:"down",seated:true,machine:"curl"}],
"CHE-PIE-014":[{hip:142,knee:188,torso:42,arms:"bar"},{hip:118,knee:194,torso:0,arms:"bar"}],
"CHE-PIE-015":[{hip:142,knee:184,torso:38,arms:"bar",wide:true},{hip:118,knee:192,torso:0,arms:"bar",wide:true}],
"CHE-PIE-016":[{hip:122,knee:192,torso:0,arms:"down"},{hip:150,knee:166,torso:2,arms:"down"}],
"CHE-PIE-017":[{hip:120,knee:194,torso:0,arms:"front",wide:true},{hip:146,knee:174,torso:4,arms:"front",wide:true}],
"CHE-PIE-018":[{hip:124,knee:192,torso:0,arms:"down",bench:true},{hip:150,knee:165,torso:3,arms:"down",bench:true}],
"CHE-PIE-019":[{hip:118,knee:194,torso:0,arms:"bar"},{hip:138,knee:190,torso:38,arms:"bar"}],
"CHE-PIE-020":[{hip:118,knee:194,torso:0,arms:"down"},{hip:108,knee:184,torso:0,arms:"down"}],
"CHE-PIE-021":[{hip:145,knee:180,torso:0,arms:"down",bench:true,seated:true},{hip:137,knee:172,torso:0,arms:"down",bench:true,seated:true}],
};

export default function LegExerciseVisual({code,name}:{code?:string|null;name:string}){
 const pair=(code&&poses[code])||poses["CHE-PIE-007"];
 return <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-white to-[#f6f7f4]">
  <div className="grid h-full grid-cols-2">
   <Frame pose={pair[0]} label="Inicio"/>
   <Frame pose={pair[1]} label="Ejecución" right/>
  </div>
  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/95 to-transparent px-3 pb-1.5 pt-5 text-center text-[9px] font-bold text-slate-700">{name}</div>
 </div>
}

function Frame({pose,label,right=false}:{pose:Pose;label:string;right?:boolean}){
 const cx=80;const shoulderY=pose.hip-58;const headY=shoulderY-26;const rad=pose.torso*Math.PI/180;const shoulderX=cx-Math.sin(rad)*35;const hipY=pose.hip;const kneeY=pose.knee;const footY=218;
 const leftKneeX=pose.wide?47:61,rightKneeX=pose.wide?113:99,leftFootX=pose.wide?34:51,rightFootX=pose.wide?126:109;
 return <div className={right?"border-l border-slate-200":""}><svg viewBox="0 0 160 240" className="h-full w-full" aria-label={label}>
  <defs><linearGradient id="skinLeg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#efb181"/><stop offset="1" stopColor="#c97a4d"/></linearGradient><linearGradient id="shirtLeg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#151a22"/><stop offset="1" stopColor="#252b35"/></linearGradient></defs>
  <ellipse cx="80" cy="220" rx="43" ry="6" fill="#d8d8d2" opacity=".55"/>
  <Equipment pose={pose}/>
  <g>
   <Head x={shoulderX} y={headY}/>
   <Torso x={shoulderX} y={shoulderY+24} hipX={cx} hipY={hipY}/>
   <Shorts x={cx} y={hipY}/>
   <Leg x1={cx-7} y1={hipY+4} x2={leftKneeX} y2={kneeY} x3={leftFootX} y3={footY}/>
   <Leg x1={cx+7} y1={hipY+4} x2={rightKneeX} y2={kneeY} x3={rightFootX} y3={footY} flip/>
   <Arms mode={pose.arms||"front"} shoulderX={shoulderX} shoulderY={shoulderY}/>
  </g>
  <text x="80" y="237" textAnchor="middle" fontSize="10" fontWeight="800" fill="#334155">{label}</text>
 </svg></div>
}

function Head({x,y}:{x:number;y:number}){return <g><ellipse cx={x} cy={y} rx="11" ry="13" fill="url(#skinLeg)"/><path d={`M${x-10} ${y-3} Q${x-8} ${y-14} ${x+2} ${y-14} Q${x+11} ${y-11} ${x+10} ${y-2} Q${x+2} ${y-6} ${x-4} ${y-5}Z`} fill="#101722"/><path d={`M${x+9} ${y} q5 2 1 5`} fill="none" stroke="#9d5f3d" strokeWidth="1.2"/><circle cx={x+4} cy={y-1} r="1" fill="#111827"/></g>}
function Torso({x,y,hipX,hipY}:{x:number;y:number;hipX:number;hipY:number}){return <g><path d={`M${x-16} ${y-20} Q${x} ${y-28} ${x+16} ${y-20} L${hipX+15} ${hipY-8} Q${hipX} ${hipY+2} ${hipX-15} ${hipY-8}Z`} fill="url(#shirtLeg)"/><path d={`M${x-11} ${y-8} Q${x} ${y-2} ${x+11} ${y-8}`} fill="none" stroke="#374151" strokeWidth="1.5"/><path d={`M${hipX-11} ${hipY-16} Q${hipX} ${hipY-10} ${hipX+11} ${hipY-16}`} fill="none" stroke="#0f766e" strokeWidth="2.2" opacity=".55"/></g>}
function Shorts({x,y}:{x:number;y:number}){return <path d={`M${x-16} ${y-7} L${x+16} ${y-7} L${x+13} ${y+15} L${x+2} ${y+12} L${x} ${y+4} L${x-2} ${y+12} L${x-13} ${y+15}Z`} fill="#171b22"/>}
function Leg({x1,y1,x2,y2,x3,y3,flip=false}:{x1:number;y1:number;x2:number;y2:number;x3:number;y3:number;flip?:boolean}){return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#skinLeg)" strokeWidth="10" strokeLinecap="round"/><line x1={x2} y1={y2} x2={x3} y2={y3-6} stroke="url(#skinLeg)" strokeWidth="8.5" strokeLinecap="round"/><ellipse cx={x2} cy={y2} rx="5.4" ry="5" fill="#d28a5c"/><Shoe x={x3} y={y3} flip={flip}/></g>}
function Shoe({x,y,flip=false}:{x:number;y:number;flip?:boolean}){return <path d={flip?`M${x+7} ${y-6} Q${x+1} ${y-8} ${x-10} ${y-2} Q${x-12} ${y+4} ${x+8} ${y+4}Z`:`M${x-7} ${y-6} Q${x-1} ${y-8} ${x+10} ${y-2} Q${x+12} ${y+4} ${x-8} ${y+4}Z`} fill="#111827" stroke="#334155" strokeWidth="1"/>}

function Arms({mode,shoulderX,shoulderY}:{mode:"front"|"down"|"bar";shoulderX:number;shoulderY:number}){
 if(mode==="down")return <><Arm x1={shoulderX-9} y1={shoulderY+8} x2={shoulderX-14} y2={shoulderY+30} x3={shoulderX-11} y3={shoulderY+48}/><Arm x1={shoulderX+9} y1={shoulderY+8} x2={shoulderX+14} y2={shoulderY+30} x3={shoulderX+11} y3={shoulderY+48}/></>;
 if(mode==="bar")return <><Barbell y={shoulderY+5}/><Arm x1={shoulderX-10} y1={shoulderY+8} x2={61} y2={shoulderY+10} x3={58} y3={shoulderY+5}/><Arm x1={shoulderX+10} y1={shoulderY+8} x2={99} y2={shoulderY+10} x3={102} y3={shoulderY+5}/></>;
 return <><Arm x1={shoulderX-9} y1={shoulderY+8} x2={52} y2={shoulderY+9} x3={34} y3={shoulderY+11}/><Arm x1={shoulderX+9} y1={shoulderY+8} x2={108} y2={shoulderY+9} x3={126} y3={shoulderY+11}/></>}
function Arm({x1,y1,x2,y2,x3,y3}:{x1:number;y1:number;x2:number;y2:number;x3:number;y3:number}){return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#skinLeg)" strokeWidth="7.5" strokeLinecap="round"/><line x1={x2} y1={y2} x2={x3} y2={y3} stroke="url(#skinLeg)" strokeWidth="6.5" strokeLinecap="round"/></g>}
function Barbell({y}:{y:number}){return <g><line x1="22" y1={y} x2="138" y2={y} stroke="#1f2937" strokeWidth="4"/><circle cx="31" cy={y} r="11" fill="#2d333c"/><circle cx="31" cy={y} r="5" fill="#151922"/><circle cx="129" cy={y} r="11" fill="#2d333c"/><circle cx="129" cy={y} r="5" fill="#151922"/></g>}

function Equipment({pose}:{pose:Pose}){return <>{pose.box?<><rect x="111" y="178" width="35" height="31" rx="3" fill="#2f3338"/><rect x="111" y="178" width="35" height="5" fill="#4b5563"/></>:null}{pose.bench?<><rect x="104" y="169" width="48" height="9" rx="4" fill="#30353c"/><rect x="111" y="178" width="6" height="33" fill="#59616d"/><rect x="140" y="178" width="6" height="33" fill="#59616d"/></>:null}{pose.seated?<><rect x="46" y="157" width="52" height="10" rx="4" fill="#2b3037"/><rect x="49" y="167" width="7" height="45" fill="#5d6672"/><rect x="88" y="167" width="7" height="45" fill="#5d6672"/></>:null}{pose.machine==="press"?<><path d="M100 94 L140 68 L149 79 L109 105Z" fill="#39414a"/><rect x="135" y="74" width="7" height="74" rx="3" fill="#68717e"/><circle cx="141" cy="63" r="12" fill="#252a31"/><circle cx="141" cy="63" r="5" fill="#111827"/></>:null}{pose.machine==="extension"?<><rect x="103" y="166" width="10" height="50" rx="4" fill="#5d6672"/><rect x="96" y="205" width="37" height="10" rx="5" fill="#2b3037"/><circle cx="126" cy="206" r="12" fill="#3b424b"/></>:null}{pose.machine==="curl"?<><rect x="99" y="179" width="10" height="37" rx="4" fill="#5d6672"/><rect x="91" y="207" width="38" height="9" rx="5" fill="#2b3037"/><circle cx="122" cy="206" r="11" fill="#3b424b"/></>:null}</>}
