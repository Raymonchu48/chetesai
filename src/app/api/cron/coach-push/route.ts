import { NextResponse } from "next/server";
import { serviceRequest } from "@/lib/events-server";
import { pushSilentNotice, type PushEntry } from "@/lib/coach-push-server";
export const runtime="nodejs";
type Bono={cliente_id:string;sesiones_totales:number;sesiones_consumidas:number;fecha_fin:string|null};
type Evento={id:string;fecha_inicio:string};
type Registro={cliente_id:string;evento_id:string;estado:string};
type Agenda={cliente_id:string;inicio_at:string};
function dateMadrid(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}
function daySpan(iso:string,today:string){return Math.round((Date.parse(iso.slice(0,10)+"T00:00:00Z")-Date.parse(today+"T00:00:00Z"))/86400000);}
export async function GET(req:Request){
 if(!process.env.CRON_SECRET || req.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return NextResponse.json({error:"Unauthorized"},{status:401});
 if(!process.env.COACH_VAPID_PRIVATE_JWK)return NextResponse.json({error:"Faltan claves VAPID"},{status:503});
 const today=new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
 const part=(name:string)=>today.find(v=>v.type===name)?.value||"";
 const day=`${part("year")}-${part("month")}-${part("day")}`;
 try {
  const [subs,bonos,eventos,regs,agenda]=await Promise.all([
   serviceRequest<PushEntry[]>("coach_push_suscripciones?activa=eq.true&select=id,cliente_id,endpoint,bonos,eventos,sesiones,activa&limit=500"),
   serviceRequest<Bono[]>("bonos_cliente?estado=eq.activo&select=cliente_id,sesiones_totales,sesiones_consumidas,fecha_fin&limit=500"),
   serviceRequest<Evento[]>("eventos?estado=eq.publicado&select=id,fecha_inicio&limit=100"),
   serviceRequest<Registro[]>("inscripciones_eventos?select=cliente_id,evento_id,estado&limit=1000"),
   serviceRequest<Agenda[]>("sesiones_agenda?estado=eq.confirmada&select=cliente_id,inicio_at&limit=500"),
  ]);
  const upcoming=new Set(eventos.filter(e=>daySpan(e.fecha_inicio,day)>=0&&daySpan(e.fecha_inicio,day)<=7).map(e=>e.id));
  let sent=0,errors=0,skipped=0;
  for(const sub of subs){
   const categories:string[]=[];
   if(sub.bonos&&bonos.some(b=>b.cliente_id===sub.cliente_id&&(b.sesiones_totales-b.sesiones_consumidas<=2||!!b.fecha_fin&&(daySpan(b.fecha_fin,day)>=0&&daySpan(b.fecha_fin,day)<=7))))categories.push("bonos");
   if(sub.eventos&&regs.some(r=>r.cliente_id===sub.cliente_id&&["confirmada","lista_espera"].includes(r.estado)&&upcoming.has(r.evento_id)))categories.push("eventos");
   if(sub.sesiones&&agenda.some(s=>s.cliente_id===sub.cliente_id&&daySpan(s.inicio_at,day)===1))categories.push("sesiones");
   if(!categories.length){skipped++;continue;}
   const key=day; // At most one push per device per day, regardless of categories.
   const rows=await serviceRequest<Array<{id:string}>>(`coach_push_envios?suscripcion_id=eq.${sub.id}&clave=eq.${encodeURIComponent(key)}&select=id&limit=1`);
   if(rows.length){skipped++;continue;}
   try {
    const result=await pushSilentNotice(sub);
    if(result==="sent"){
     await serviceRequest("coach_push_envios",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({suscripcion_id:sub.id,clave:key})});
     sent++;
    }else errors++;
   }catch{errors++;}
  }
  return NextResponse.json({ok:true,sent,errors,skipped});
 }catch{return NextResponse.json({ok:false,error:"No se pudo comprobar el envío"},{status:500});}
}