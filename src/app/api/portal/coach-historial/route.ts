import { NextResponse } from "next/server";
import { getClientFromSession, serviceRequest } from "@/lib/events-server";
import { requireConsent, privacyErrorStatus } from "@/lib/privacy-server";
export const runtime = "nodejs";
async function client() { const c = await getClientFromSession(); await requireConsent(c.id, "health_data"); return c; }
const fail = (e: unknown) => { const msg = e instanceof Error ? e.message : "Error de historial"; return NextResponse.json({ok:false,error:msg},{status:privacyErrorStatus(msg)}); };
export async function GET() {
 try { const c=await client();
  const rows=await serviceRequest<Array<{id:string;rol:string;contenido:string;created_at:string}>>(
    `coach_mensajes?cliente_id=eq.${encodeURIComponent(c.id)}&select=id,rol,contenido,created_at&order=created_at.desc&limit=40`);
  return NextResponse.json({ok:true,mensajes:rows.reverse()});
 } catch(e) {return fail(e);}
}
export async function POST(req:Request) {
 try {const c=await client();const b=await req.json() as {rol?:string;contenido?:string};
  if(!["user","assistant"].includes(b.rol||"")||typeof b.contenido!=="string"||!b.contenido.trim()||b.contenido.length>3000)
   return NextResponse.json({ok:false,error:"Mensaje no válido"},{status:400});
  await serviceRequest("coach_mensajes", {method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({cliente_id:c.id,rol:b.rol,contenido:b.contenido.trim()})});
  return NextResponse.json({ok:true});
 } catch(e){return fail(e);}
}
export async function DELETE() {
 try {const c=await client();await serviceRequest(`coach_mensajes?cliente_id=eq.${encodeURIComponent(c.id)}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
 return NextResponse.json({ok:true});}catch(e){return fail(e);}
}