"use client";
import { useEffect, useState } from "react";
import { BellRing, BellOff } from "lucide-react";

type Preferences = { bonos: boolean; eventos: boolean; sesiones: boolean };
const defaults: Preferences = { bonos: false, eventos: false, sesiones: false };
function applicationKey(value: string) {
 const padded = value + "=".repeat((4 - value.length % 4) % 4);
 const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
 return Uint8Array.from(raw, char => char.charCodeAt(0));
}
export function CoachPushSettings() {
 const [supported, setSupported] = useState(false);
 const [enabled, setEnabled] = useState(false);
 const [prefs, setPrefs] = useState<Preferences>(defaults);
 const [key, setKey] = useState("");
 const [working, setWorking] = useState(false);
 const [message, setMessage] = useState("");
 useEffect(() => {
  let alive = true;
  const available = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  setSupported(available);
  if (!available) return;
  void fetch("/api/portal/coach-push", { cache: "no-store" }).then(r=>r.json()).then(async data=>{
   if (!alive) return;
   setKey(data.vapidPublicKey || "");
   const registration = await navigator.serviceWorker.ready;
   const subscription = await registration.pushManager.getSubscription();
   if (!alive || !subscription) return;
   const row = (data.items || []).find((x:{endpoint:string})=>x.endpoint===subscription.endpoint);
   setEnabled(Boolean(row?.activa));
   if (row) setPrefs({ bonos: Boolean(row.bonos), eventos: Boolean(row.eventos), sesiones: Boolean(row.sesiones) });
  }).catch(()=>{});
  return () => {alive=false;};
 },[]);
 async function activate() {
  if (!supported || !key) return;
  setWorking(true);setMessage("");
  try {
   if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {setMessage("Permiso de notificaciones no concedido.");return;}
   }
   const reg = await navigator.serviceWorker.ready;
   const current = await reg.pushManager.getSubscription();
   const sub = current || await reg.pushManager.subscribe({userVisibleOnly:true, applicationServerKey:applicationKey(key)});
   const res = await fetch("/api/portal/coach-push",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subscription:sub.toJSON(),...prefs})});
   if (!res.ok) throw Error("No se pudo guardar la suscripción");
   setEnabled(true);setMessage("Notificaciones activadas en este dispositivo.");
  }catch(e){setMessage(e instanceof Error?e.message:"No se pudo activar");}
  finally{setWorking(false);}
 }
 async function disable() {
  setWorking(true);setMessage("");
  try {
   const reg=await navigator.serviceWorker.ready;
   const sub=await reg.pushManager.getSubscription();
   if(sub){
    const res=await fetch("/api/portal/coach-push",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({endpoint:sub.endpoint})});
    if(!res.ok)throw Error("No se pudo guardar la baja");
    await sub.unsubscribe();
   }
   setEnabled(false);setMessage("Notificaciones desactivadas en este dispositivo.");
  }catch(e){setMessage(e instanceof Error?e.message:"Error al desactivar");}
  finally{setWorking(false);}
 }
 async function changePreference(name:keyof Preferences, value:boolean) {
  const next={...prefs,[name]:value};setPrefs(next);
  if (!enabled) return;
  try {
   const reg=await navigator.serviceWorker.ready;const sub=await reg.pushManager.getSubscription();
   if (!sub) return;
   const res=await fetch("/api/portal/coach-push",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subscription:sub.toJSON(),...next})});
   if(!res.ok) throw Error("No se guardaron las preferencias");
   setMessage("Preferencias guardadas.");
  }catch{setMessage("No se pudieron guardar las preferencias. Revisa tu conexión.");}
 }
 return <div className="rounded-xl border border-[#c6dbc1] bg-[#f0f8ed] p-3 text-xs text-[#244528]">
  <p className="mb-2 flex items-center gap-2 font-bold"><BellRing className="h-4 w-4"/> Notificaciones PWA</p>
  {!supported?<p>Este navegador no admite notificaciones push para esta instalación. En iPhone/iPad, instala primero la PWA en la pantalla de inicio.</p>:!key?<p>La configuración de notificaciones aún no está disponible.</p>:<>
   <p className="mb-2 text-[#46624f]">Elige qué recordatorios quieres recibir, incluso con la aplicación cerrada.</p>
   {([["bonos","Renovación de bonos"],["eventos","Mis eventos"],["sesiones","Citas y sesiones"]] as const).map(([name,label])=>
    <label key={name} className="mb-2 flex items-center gap-2">
     <input type="checkbox" checked={prefs[name]} onChange={e=>void changePreference(name,e.target.checked)} className="accent-[#2f9e24]"/>{label}
    </label>
   )}
   <button type="button" disabled={working} onClick={()=>void (enabled?disable():activate())}
    className="mt-1 flex items-center gap-2 rounded-lg bg-[#2f9e24] px-3 py-2 font-bold text-white disabled:opacity-50">
    {enabled?<BellOff className="h-4 w-4"/>:<BellRing className="h-4 w-4"/>}
    {working?"Guardando…":enabled?"Desactivar en este dispositivo":"Activar notificaciones"}
   </button>
  </>}
  {message?<p role="status" className="mt-2">{message}</p>:null}
  <p className="mt-2 text-[10px] text-[#697a68]">Un aviso general al día cuando haya novedades; los detalles privados se consultan al entrar en el portal. Puedes cambiarlo o desactivarlo cuando quieras.</p>
 </div>;
}
