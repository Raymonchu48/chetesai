"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PrivacyConsentForm from "@/components/privacy/PrivacyConsentForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EMPTY_CONSENT_STATE, type ConsentState } from "@/lib/privacy-contract";
import { ArrowLeft, Download, FileJson, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

type RequestRow = { id: string; request_type: string; status: string; requested_at: string; resolved_at: string | null };
type PrivacyData = { client: { nombre: string }; consents: ConsentState; requests: RequestRow[] };

export default function ClientPrivacyPage() {
  const [data, setData] = useState<PrivacyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/portal/privacy", { cache: "no-store" });
      const result = (await response.json()) as { ok: boolean; data?: PrivacyData; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudo cargar tu privacidad");
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function requestErasure() {
    setRequesting(true);
    try {
      const response = await fetch("/api/portal/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request_erasure" }),
      });
      const result = (await response.json()) as { ok: boolean; data?: { alreadyOpen?: boolean }; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo registrar la solicitud");
      toast.success(result.data?.alreadyOpen ? "Ya existe una solicitud abierta" : "Solicitud registrada correctamente");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al solicitar la supresión");
    } finally {
      setRequesting(false);
    }
  }

  const openErasure = data?.requests.find((item) => item.request_type === "erasure" && ["pending", "in_progress"].includes(item.status));

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-4 py-7 text-[#202724] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 rounded-[30px] border border-[#d7b86b]/30 bg-[#111a15] p-6 text-white shadow-xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d7b86b]">Chetesaí Fitness+</p>
          <h1 className="mt-3 flex items-center gap-3 text-3xl font-black sm:text-4xl"><ShieldCheck className="h-9 w-9 text-[#8cdb78]" />Privacidad y mis datos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">Decide qué información autorizas, descarga tus datos y ejerce tus derechos desde un espacio autenticado.</p>
          <Button asChild variant="outline" className="mt-5 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href="/portal"><ArrowLeft className="mr-2 h-4 w-4" />Volver al portal</Link></Button>
        </header>

        {loading ? <Card><CardContent className="py-16 text-center text-[#67706b]">Cargando tus preferencias...</CardContent></Card> : (
          <>
            <Card className="mb-6 border-[#ded8cd] bg-[#fffdf9]"><CardContent className="p-6 sm:p-8"><h2 className="text-2xl font-black">Consentimientos específicos</h2><p className="mt-2 text-sm leading-6 text-[#67706b]">Ninguna opción aparece marcada por defecto. Puedes cambiarla cuando quieras y cada decisión queda registrada con su fecha y versión legal.</p><div className="mt-6"><PrivacyConsentForm initialConsents={data?.consents || EMPTY_CONSENT_STATE} onSaved={(consents) => setData((current) => current ? { ...current, consents } : current)} /></div></CardContent></Card>

            <div className="grid gap-5 md:grid-cols-2">
              <Card className="border-[#ded8cd] bg-[#fffdf9]"><CardContent className="p-6"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#eaf5e8] text-[#2f9e24]"><FileJson className="h-6 w-6" /></span><h2 className="mt-4 text-xl font-black">Exportar mis datos</h2><p className="mt-2 text-sm leading-6 text-[#67706b]">Descarga inmediatamente una copia estructurada en JSON con los datos asociados a tu cuenta, consentimientos y actividad.</p><Button asChild className="mt-5 w-full bg-[#2f9e24] hover:bg-[#27891e]"><a href="/api/portal/privacy/export" download><Download className="mr-2 h-4 w-4" />Descargar mis datos</a></Button></CardContent></Card>

              <Card className="border-red-200 bg-red-50/50"><CardContent className="p-6"><span className="grid h-12 w-12 place-items-center rounded-xl bg-red-100 text-red-700"><Trash2 className="h-6 w-6" /></span><h2 className="mt-4 text-xl font-black">Solicitar eliminación</h2><p className="mt-2 text-sm leading-6 text-[#67706b]">Registraremos la solicitud, comprobaremos las obligaciones legales de conservación y eliminaremos o anonimizaremos la información que corresponda.</p>{openErasure ? <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-amber-800">Solicitud {openErasure.status === "in_progress" ? "en proceso" : "pendiente"} desde {formatDate(openErasure.requested_at)}.</div> : <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" className="mt-5 w-full" disabled={requesting}><Trash2 className="mr-2 h-4 w-4" />Solicitar eliminación</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>¿Registrar la solicitud de eliminación?</AlertDialogTitle><AlertDialogDescription>Tu cuenta no se borrará de forma inmediata. Primero se revisará qué información puede eliminarse y cuál debe conservarse bloqueada por obligación legal. Recibirás una confirmación al finalizar.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={requestErasure} className="bg-red-600 hover:bg-red-700">Confirmar solicitud</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}</CardContent></Card>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium" }).format(new Date(value));
}
