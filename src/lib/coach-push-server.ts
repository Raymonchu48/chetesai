import { createPrivateKey, sign } from "node:crypto";
import { serviceRequest } from "@/lib/events-server";
export type PushEntry={id:string;cliente_id:string;endpoint:string;bonos:boolean;eventos:boolean;sesiones:boolean;activa:boolean};
function encodeBase64Url(value:string|Buffer){return Buffer.from(value).toString("base64url");}
export async function pushSilentNotice(entry:PushEntry):Promise<"sent"|"expired"|"error">{
 const raw=process.env.COACH_VAPID_PRIVATE_JWK;
 const pub=process.env.NEXT_PUBLIC_COACH_VAPID_PUBLIC_KEY;
 if(!raw||!pub)throw new Error("Las claves VAPID no están configuradas");
 const origin=new URL(entry.endpoint).origin;
 const now=Math.floor(Date.now()/1000);
 const header=encodeBase64Url(JSON.stringify({typ:"JWT",alg:"ES256"}));
 const payload=encodeBase64Url(JSON.stringify({aud:origin,exp:now+3600,sub:"mailto:chetesaifitness@gmail.com"}));
 const data=header+"."+payload;
 const key=createPrivateKey({key:JSON.parse(raw),format:"jwk"});
 const signature=sign("sha256",Buffer.from(data),{key,dsaEncoding:"ieee-p1363"}).toString("base64url");
 const resp=await fetch(entry.endpoint,{method:"POST",headers:{
  Authorization:`vapid t=${data}.${signature}, k=${pub}`,
  TTL:"86400",
  Urgency:"normal",
  "Content-Length":"0"
 },cache:"no-store"});
 if([404,410].includes(resp.status)){await serviceRequest(`coach_push_suscripciones?id=eq.${entry.id}`,{method:"PATCH",body:JSON.stringify({activa:false}),headers:{Prefer:"return=minimal"}});return "expired";}
 return resp.ok?"sent":"error";
}