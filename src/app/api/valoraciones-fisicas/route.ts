import { NextRequest, NextResponse } from "next/server";
import { getPrivacyUser, privacyServiceRequest, requireConsent, privacyErrorStatus } from "@/lib/privacy-server";

type Row = { id: string; cliente_id: string; fecha: string; fase: string; resultados: Record<string, number>; observaciones_profesional: string | null };
const pruebas = ["sentadilla_silla_30s","flexiones_inclinadas","wall_sit_seg","step_up_30s","elevaciones_talones_30s","plancha_seg","bird_dog_30s","caminata_6min_m","apoyo_pierna_d_seg","apoyo_pierna_i_seg","sit_and_reach_cm","movilidad_hombros_cm","timed_up_go_seg","pasos_laterales_30s","pulso_reposo_lpm","cintura_cm"];
const fases = ["inicio","semana_4","semana_8","semana_12","seguimiento"];

async function authorize(clienteId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clienteId)) throw new Error("Cliente no válido");
  const user = await getPrivacyUser();
  const profiles = await privacyServiceRequest<Array<{role:string;activo:boolean}>>(`profiles?id=eq.${encodeURIComponent(user.id)}&select=role,activo&limit=1`);
  if (!profiles[0]?.activo || !["administrador","profesional"].includes(profiles[0].role)) throw new Error("No autorizado");
  await requireConsent(clienteId,"health_data");
  return user.id;
}
function responseError(error: unknown) {
 const message = error instanceof Error ? error.message : "Error desconocido";
 const status = /No autorizado|No autenticado|Sesión no válida/.test(message) ? 403 : privacyErrorStatus(message);
 return NextResponse.json({ok:false,error:message},{status});
}
export async function GET(request:NextRequest) {
 try {
  const clienteId=request.nextUrl.searchParams.get("cliente_id")||"";
  await authorize(clienteId);
  const rows=await privacyServiceRequest<Row[]>(`valoraciones_fisicas?cliente_id=eq.${encodeURIComponent(clienteId)}&select=id,cliente_id,fecha,fase,resultados,observaciones_profesional&order=fecha.asc,created_at.asc`);
  return NextResponse.json({ok:true,data:rows});
 } catch(error) {return responseError(error);}
}
export async function POST(request:NextRequest) {
 try {
  const body=await request.json() as Record<string,unknown>;
  const clienteId=String(body.cliente_id||"");
  const userId=await authorize(clienteId);
  const fecha=String(body.fecha||"");
  const fase=String(body.fase||"");
  if(!/^\d{4}-\d{2}-\d{2}$/.test(fecha)|| !fases.includes(fase)) return NextResponse.json({ok:false,error:"Fecha o fase incorrecta"},{status:400});
  const input=(body.resultados && typeof body.resultados==="object" && !Array.isArray(body.resultados)) ? body.resultados as Record<string,unknown> : {};
  const resultados:Record<string,number>={};
  for (const key of pruebas) {
   const raw=input[key];
   if(raw===null || raw===undefined || raw==="") continue;
   const value=Number(raw);
   if(!Number.isFinite(value)||value<0||value>100000) return NextResponse.json({ok:false,error:`Valor no válido: ${key}`},{status:400});
   resultados[key]=value;
  }
  if(Object.keys(resultados).length===0) return NextResponse.json({ok:false,error:"Introduce al menos una prueba"},{status:400});
  const obs=String(body.observaciones_profesional||"").trim().slice(0,2000);
  const rows=await privacyServiceRequest<Row[]>("valoraciones_fisicas",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({cliente_id:clienteId,fecha,fase,resultados,observaciones_profesional:obs||null,created_by:userId})});
  return NextResponse.json({ok:true,data:rows[0]||null});
 } catch(error) {return responseError(error);}
}
