import { NextResponse } from "next/server";
import { assertProfessional, getClientFromSession, serviceRequest } from "@/lib/events-server";
import { requireConsent, privacyErrorStatus } from "@/lib/privacy-server";
export const runtime="nodejs";
export async function POST(req:Request) {
 try {const c=await getClientFromSession();await requireConsent(c.id,"health_data");
  const b=await req.json() as {tipo?:string;mensaje?:string};
  if(!["consulta","molestias"].includes(b.tipo||"")||typeof b.mensaje!=="string"||b.mensaje.trim().length<5||b.mensaje.length>1000)
    return NextResponse.json({ok:false,error:"Escribe un mensaje válido"},{status:400});
  await serviceRequest("coach_avisos_profesional",{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({cliente_id:c.id,tipo:b.tipo,mensaje:b.mensaje.trim()})});
  return NextResponse.json({ok:true});
 }catch(e){const m=e instanceof Error?e.message:"No se pudo enviar";return NextResponse.json({ok:false,error:m},{status:privacyErrorStatus(m)});}
}
export async function GET() {
 try {await assertProfessional();const rows=await serviceRequest<Array<Record<string,unknown>>>("coach_avisos_profesional?select=id,cliente_id,tipo,mensaje,estado,created_at,clientes(nombre)&order=created_at.desc&limit=100");
 return NextResponse.json({ok:true,avisos:rows});}catch{return NextResponse.json({ok:false,error:"Acceso no autorizado"},{status:403});}
}
export async function PATCH(req:Request) {
 try {await assertProfessional();const b=await req.json() as {id?:string};
 if(!b.id||!/^[a-f\d-]{36}$/i.test(b.id)) return NextResponse.json({ok:false},{status:400});
 await serviceRequest(`coach_avisos_profesional?id=eq.${encodeURIComponent(b.id)}`,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({estado:"revisado"})});
 return NextResponse.json({ok:true});}catch{return NextResponse.json({ok:false,error:"No autorizado"},{status:403});}
}