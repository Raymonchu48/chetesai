import { NextResponse } from "next/server";
import { getClientFromSession, serviceRequest } from "@/lib/events-server";
export const runtime="nodejs";
type Row={id:string;endpoint:string;bonos:boolean;eventos:boolean;sesiones:boolean;activa:boolean};
export async function GET() {
 try {const c=await getClientFromSession();const rows=await serviceRequest<Row[]>(`coach_push_suscripciones?cliente_id=eq.${encodeURIComponent(c.id)}&select=id,endpoint,bonos,eventos,sesiones,activa&limit=20`);
 return NextResponse.json({ok:true,items:rows,vapidPublicKey:process.env.NEXT_PUBLIC_COACH_VAPID_PUBLIC_KEY||null});}
 catch{return NextResponse.json({ok:false,error:"No se pudo consultar la configuración"},{status:401});}
}
export async function POST(req:Request) {
 try {const c=await getClientFromSession();const b=await req.json() as {subscription?:{endpoint?:string;keys?:{p256dh?:string;auth?:string}};bonos?:boolean;eventos?:boolean;sesiones?:boolean};
 const endpoint=b.subscription?.endpoint||"";
 if(!endpoint.startsWith("https://")||endpoint.length>2048||!b.subscription?.keys?.p256dh||!b.subscription?.keys?.auth) return NextResponse.json({ok:false,error:"Suscripción inválida"},{status:400});
 const domains=["fcm.googleapis.com","updates.push.services.mozilla.com","web.push.apple.com","push.services.mozilla.com","fcmregistrations.googleapis.com"];
 const host=new URL(endpoint).hostname;
 if(!domains.some(d=>host===d||host.endsWith("."+d)))return NextResponse.json({ok:false,error:"Proveedor push no admitido"},{status:400});
 const owners=await serviceRequest<Array<{cliente_id:string}>>(`coach_push_suscripciones?endpoint=eq.${encodeURIComponent(endpoint)}&select=cliente_id&limit=1`);
 if(owners[0]&&owners[0].cliente_id!==c.id) return NextResponse.json({ok:false,error:"Suscripción asociada a otra cuenta"},{status:409});
 await serviceRequest("coach_push_suscripciones?on_conflict=endpoint",{method:"POST",headers:{Prefer:"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({cliente_id:c.id,endpoint,p256dh:b.subscription.keys.p256dh,auth:b.subscription.keys.auth,bonos:b.bonos===true,eventos:b.eventos===true,sesiones:b.sesiones===true,activa:true,updated_at:new Date().toISOString()})});
 return NextResponse.json({ok:true});
 }catch{return NextResponse.json({ok:false,error:"No se pudo guardar la suscripción"},{status:500});}
}
export async function DELETE(req:Request) {
 try {const c=await getClientFromSession();const b=await req.json() as {endpoint?:string};
 if(!b.endpoint) return NextResponse.json({ok:false},{status:400});
 await serviceRequest(`coach_push_suscripciones?cliente_id=eq.${encodeURIComponent(c.id)}&endpoint=eq.${encodeURIComponent(b.endpoint)}`,{method:"DELETE",headers:{Prefer:"return=minimal"}});
 return NextResponse.json({ok:true});}catch{return NextResponse.json({ok:false},{status:500});}
}
