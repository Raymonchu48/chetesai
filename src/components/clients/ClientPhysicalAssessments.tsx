"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type RecordRow={id:string;fecha:string;fase:string;resultados:Record<string,number>;observaciones_profesional:string|null};
type Test={key:string;label:string;unit:string;category:string;lower?:boolean;description:string};
const tests:Test[]=[
{key:"sentadilla_silla_30s",label:"Sentarse y levantarse (30 s)",unit:"rep",category:"Fuerza y resistencia",description:"Repeticiones completas sin impulso de brazos"},
{key:"flexiones_inclinadas",label:"Flexiones inclinadas",unit:"rep",category:"Fuerza y resistencia",description:"Máximo con buena técnica y altura de apoyo constante"},
{key:"wall_sit_seg",label:"Sentadilla isométrica contra pared",unit:"s",category:"Fuerza y resistencia",description:"Tiempo hasta perder posición segura y estable"},
{key:"step_up_30s",label:"Subidas a escalón (30 s)",unit:"rep",category:"Fuerza y resistencia",description:"Misma altura de escalón en todas las visitas"},
{key:"elevaciones_talones_30s",label:"Elevaciones de talones (30 s)",unit:"rep",category:"Fuerza y resistencia",description:"Subidas controladas sin rebotes"},
{key:"plancha_seg",label:"Plancha abdominal",unit:"s",category:"Estabilidad central",description:"Máximo mientras mantenga alineación"},
{key:"bird_dog_30s",label:"Bird-dog controlado (30 s)",unit:"rep",category:"Estabilidad central",description:"Alternancias completas sin perder control"},
{key:"caminata_6min_m",label:"Caminata de 6 minutos",unit:"m",category:"Cardiorrespiratorio",description:"Distancia total sobre recorrido medido"},
{key:"apoyo_pierna_d_seg",label:"Equilibrio pierna derecha",unit:"s",category:"Equilibrio",description:"Sin apoyos; proteger de caídas"},
{key:"apoyo_pierna_i_seg",label:"Equilibrio pierna izquierda",unit:"s",category:"Equilibrio",description:"Mismas condiciones en cada evaluación"},
{key:"sit_and_reach_cm",label:"Flexibilidad cadena posterior",unit:"cm",category:"Movilidad",description:"Distancia alcanzada en prueba estandarizada"},
{key:"movilidad_hombros_cm",label:"Movilidad de hombros",unit:"cm",category:"Movilidad",description:"Distancia entre manos, protocolo constante",lower:true},
{key:"timed_up_go_seg",label:"Timed Up and Go",unit:"s",category:"Agilidad funcional",description:"Levantar, caminar 3 m, girar y sentarse",lower:true},
{key:"pasos_laterales_30s",label:"Pasos laterales (30 s)",unit:"rep",category:"Coordinación",description:"Pasos completos en marcas constantes"},
{key:"pulso_reposo_lpm",label:"Pulso en reposo",unit:"lpm",category:"Indicadores",description:"Medición en reposo; no es diagnóstico",lower:true},
{key:"cintura_cm",label:"Perímetro de cintura",unit:"cm",category:"Indicadores",description:"Siempre en el mismo punto anatómico",lower:true}
];
const phases=[["inicio","Valoración inicial"],["semana_4","Semana 4"],["semana_8","Semana 8"],["semana_12","Semana 12"],["seguimiento","Seguimiento adicional"]];
export default function ClientPhysicalAssessments({clientId}:{clientId:string}) {
 const [rows,setRows]=useState<RecordRow[]>([]);
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [date,setDate]=useState(new Date().toISOString().slice(0,10));
 const [phase,setPhase]=useState("inicio");
 const [values,setValues]=useState<Record<string,string>>({});
 const [notes,setNotes]=useState("");
 const load=useCallback(async()=>{
  setLoading(true);
  try{
   const r=await fetch(`/api/valoraciones-fisicas?cliente_id=${encodeURIComponent(clientId)}`,{cache:"no-store"});
   const j=await r.json() as {ok:boolean;data?:RecordRow[];error?:string};
   if(!r.ok||!j.ok) throw new Error(j.error||"No se pudieron cargar los datos");
   setRows(j.data||[]);
  }catch(e){toast.error(e instanceof Error?e.message:"Error de carga")}finally{setLoading(false)}
 },[clientId]);
 useEffect(()=>{void load()},[load]);
 const baseline=useMemo(()=>rows.find(r=>r.fase==="inicio")||rows[0],[rows]);
 const latest=rows[rows.length-1];
 const groups=Array.from(new Set(tests.map(t=>t.category)));
 async function save(){
  setSaving(true);
  try{
   const result=Object.fromEntries(Object.entries(values).filter(([,v])=>v.trim()!=="").map(([k,v])=>[k,Number(v)]));
   if(!Object.keys(result).length) throw new Error("Introduce al menos un resultado");
   const r=await fetch("/api/valoraciones-fisicas",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({cliente_id:clientId,fecha:date,fase:phase,resultados:result,observaciones_profesional:notes})});
   const j=await r.json() as {ok:boolean;error?:string};
   if(!r.ok||!j.ok) throw new Error(j.error||"No se pudo guardar");
   toast.success("Valoración registrada exclusivamente para profesionales");
   setValues({});setNotes("");await load();
  }catch(e){toast.error(e instanceof Error?e.message:"Error al guardar")}finally{setSaving(false)}
 }
 return <div className="space-y-5">
  <Card className="border-[#dbe6dc] bg-[#f9fbf8]"><CardContent className="space-y-2 p-5">
   <p className="text-xs font-bold uppercase tracking-widest text-[#46624f]">Uso profesional · Datos privados</p>
   <h3 className="text-xl font-bold text-[#253e31]">Evaluación de condición física</h3>
   <p className="text-sm text-[#506354]">Valoración inicial y seguimiento a las 4, 8 y 12 semanas. Los registros no se publican en el portal del cliente. Antes de cada sesión, comprobar aptitud, condiciones de seguridad y consentimiento vigente.</p>
  </CardContent></Card>
  <Card><CardContent className="space-y-5 p-5">
   <h4 className="text-lg font-bold">Registrar una valoración</h4>
   <div className="grid gap-3 sm:grid-cols-2">
    <label className="space-y-1 text-sm font-semibold">Fecha <Input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
    <label className="space-y-1 text-sm font-semibold">Fase <select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={phase} onChange={e=>setPhase(e.target.value)}>{phases.map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label>
   </div>
   {groups.map(group=><section key={group} className="space-y-3">
    <h5 className="border-b pb-2 font-bold text-[#35533f]">{group}</h5>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
     {tests.filter(t=>t.category===group).map(t=><label key={t.key} className="space-y-1 rounded-xl border border-[#e0e9df] bg-white p-3">
      <span className="block text-sm font-semibold text-[#263f31]">{t.label}</span>
      <span className="block text-xs text-[#647268]">{t.description}</span>
      <div className="flex items-center gap-2"><Input inputMode="decimal" type="number" min="0" step="any" placeholder="Sin medir" value={values[t.key]??""} onChange={e=>setValues(v=>({...v,[t.key]:e.target.value}))}/><span className="text-sm text-[#516455]">{t.unit}</span></div>
     </label>)}
    </div>
   </section>)}
   <label className="block space-y-1 text-sm font-semibold">Observaciones del profesional<textarea className="min-h-20 w-full rounded-md border bg-background p-3 text-sm" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={2000} placeholder="Técnica, molestias, adaptaciones, condiciones de la prueba..."/></label>
   <Button type="button" disabled={saving} onClick={()=>void save()}>{saving?"Guardando...":"Guardar valoración profesional"}</Button>
  </CardContent></Card>
  <Card><CardContent className="space-y-3 p-5">
   <h4 className="text-lg font-bold">Historial y evolución</h4>
   {loading?<p className="text-sm text-muted-foreground">Cargando historial...</p>:!rows.length?<p className="text-sm text-muted-foreground">Sin valoraciones todavía. Registra la evaluación inicial para iniciar el seguimiento.</p>:<>
    <div className="flex flex-wrap gap-2">{rows.map(r=><span key={r.id} className="rounded-full bg-[#e9f2e9] px-3 py-1 text-xs font-semibold text-[#34513d]">{phases.find(x=>x[0]===r.fase)?.[1]||r.fase} · {r.fecha}</span>)}</div>
    <div className="overflow-x-auto"><table className="w-full min-w-[570px] text-left text-sm"><thead><tr className="border-b"><th className="py-2">Prueba</th><th>Inicio</th><th>Última</th><th>Evolución</th></tr></thead><tbody>{tests.map(t=>{const a=baseline?.resultados?.[t.key];const b=latest?.resultados?.[t.key];const delta=(a!==undefined&&b!==undefined)?b-a:null;return <tr key={t.key} className="border-b border-[#e5ece3]"><td className="py-2 font-medium">{t.label}</td><td>{a===undefined?"—":`${a} ${t.unit}`}</td><td>{b===undefined?"—":`${b} ${t.unit}`}</td><td className={delta===null?"text-muted-foreground":(t.lower?delta<0:delta>0)?"font-semibold text-emerald-700":"text-[#6a6452]"}>{delta===null?"—":`${delta>0?"+":""}${Math.round(delta*100)/100} ${t.unit}`}</td></tr>})}</tbody></table></div>
    <p className="text-xs text-muted-foreground">Las diferencias son descriptivas, no diagnósticos. Las pruebas deben repetirse con el mismo protocolo y sin dolor.</p>
   </>}
  </CardContent></Card>
 </div>
}
