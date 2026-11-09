"use client";
import { useCallback, useEffect, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { AlertTriangle, CheckCircle2, MessageCircle } from "lucide-react";
type Alert={id:string;tipo:"consulta"|"molestias";mensaje:string;estado:string;created_at:string;clientes?:{nombre?:string}|null};
export default function CoachAlertsPage() {
 const [items,setItems]=useState<Alert[]>([]);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState("");
 const [error,setError]=useState("");
 const refresh=useCallback(async()=>{
  setLoading(true);try{const res=await fetch("/api/portal/coach-consulta",{cache:"no-store"});
  const data=(await res.json()) as {ok?:boolean;error?:string;avisos?:Alert[]};if(!res.ok||!data.ok)throw Error(data.error||"No autorizado");
  setItems(data.avisos||[]);setError("");}catch(e){setError(e instanceof Error?e.message:"Error");}finally{setLoading(false);}
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 async function mark(id:string) {setBusy(id);try{
  const res=await fetch("/api/portal/coach-consulta",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})});
  if(!res.ok)throw Error("No se pudo marcar");
  await refresh();
 }catch(e){setError(e instanceof Error?e.message:"Error");}finally{setBusy("");}}
 return <AppSidebar>
  <div className="mx-auto max-w-5xl space-y-6 p-5 md:p-8">
   <div><h1 className="text-2xl font-bold">Consultas del Coach IA</h1><p className="text-sm text-muted-foreground">Mensajes enviados expresamente por los clientes. La IA no modifica planes ni toma decisiones clínicas.</p></div>
   {loading?<p>Cargando avisos…</p>:error?<p role="alert" className="text-red-600">{error}</p>:!items.length?<p>No hay consultas pendientes.</p>:
   <div className="space-y-3">{items.map(a=><article key={a.id} className="rounded-xl border bg-card p-4 shadow-sm">
    <div className="flex items-center gap-2 font-semibold">{a.tipo==="molestias"?<AlertTriangle className="h-5 w-5 text-amber-600"/>:<MessageCircle className="h-5 w-5"/>}
      {a.clientes?.nombre||"Cliente"} · {a.tipo==="molestias"?"Aviso de molestias":"Consulta"}
    </div>
    <p className="mt-2 whitespace-pre-wrap text-sm">{a.mensaje}</p>
    <p className="mt-2 text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString("es-ES")} · {a.estado}</p>
    {a.estado==="pendiente"?<button type="button" disabled={busy===a.id} onClick={()=>void mark(a.id)} className="mt-3 flex items-center gap-2 rounded-lg bg-[#2f9e24] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4"/> Marcar revisado</button>:null}
   </article>)}</div>}
  </div>
 </AppSidebar>;
}