"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ImageDown, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Candidate = { path: string; exerciseId: string; name: string; field: string; url: string };
type Result = {
  path: string; name?: string; field?: string; originalBytes?: number;
  optimizedBytes?: number; savingPct?: number; width?: number; height?: number;
  psnr?: number; passed: boolean; notes?: string; error?: string;
  originalUrl?: string; previewDataUrl?: string;
};

function mb(bytes?: number) {
  return bytes === undefined ? "—" : `${(bytes / 1048576).toFixed(2)} MiB`;
}

export default function OptimizationPage() {
  const [items, setItems] = useState<Candidate[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/ejercicios/optimizacion", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { ok: boolean; data?: Candidate[]; error?: string };
        if (!response.ok || !payload.ok) throw new Error(payload.error || "No se puede consultar el almacenamiento");
        setItems(payload.data || []);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Error de lectura"))
      .finally(() => setLoading(false));
  }, []);

  async function analyze(count: number) {
    if (processing) return;
    const paths = [...new Set(items.map((i) => i.path))].slice(0, count);
    if (!paths.length) return toast.error("No hay imágenes de origen seleccionables");
    setProcessing(true);
    setResults([]);
    try {
      const response = await fetch("/api/ejercicios/optimizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", paths }),
      });
      const payload = await response.json() as { ok: boolean; data?: Result[]; error?: string; passed?: number };
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Error al analizar las imágenes");
      setResults(payload.data || []);
      toast.success(`Analizadas ${paths.length} imágenes; ${payload.passed || 0} superan la comprobación automática.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo completar el análisis");
    } finally {
      setProcessing(false);
    }
  }

  const chosen = [...new Set(items.map((i) => i.path))];
  return (
    <AppSidebar>
      <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
        <Link href="/ejercicios" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Biblioteca de ejercicios
        </Link>
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold"><ImageDown className="h-8 w-8 text-primary" /> Mantenimiento de imágenes</h1>
          <p className="mt-2 text-muted-foreground">Prueba protegida para el administrador · WebP calidad 92 · Sin alteraciones de Storage</p>
        </div>
        <Card><CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-emerald-600" />
            <div><h2 className="font-semibold">Modo diagnóstico: solo lectura</h2>
              <p className="text-sm text-muted-foreground">Descarga la imagen original al servidor, calcula una versión WebP temporal y compara la resolución, el ahorro y la similitud PSNR. No sube archivos, no actualiza referencias y no borra originales.</p>
            </div>
          </div>
          {loading ? <p>Cargando imágenes vinculadas...</p> : error ? <p role="alert" className="text-red-700">{error}</p> : <>
            <p className="text-sm">{chosen.length} archivos PNG/JPG referenciados en la biblioteca. Se analizan por nombre en orden alfabético.</p>
            <div className="flex flex-wrap gap-3">
              <Button disabled={processing || chosen.length < 1} onClick={() => analyze(1)}>{processing ? "Analizando..." : "Analizar una imagen"}</Button>
              <Button variant="outline" disabled={processing || chosen.length < 2} onClick={() => analyze(20)}>{processing ? "Analizando..." : "Analizar lote (hasta 20)"}</Button>
            </div>
          </>}
        </CardContent></Card>
        {results.length > 0 && <Card><CardContent className="space-y-4 p-5">
          <h2 className="text-xl font-semibold">Resultados del análisis</h2>
          <p className="text-sm text-muted-foreground">La prueba automática es un filtro inicial; el texto pequeño y las etiquetas anatómicas requieren revisión visual antes de publicar las versiones WebP.</p>
          <div className="space-y-3">
            {results.map((result) => <div key={result.path} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{result.name || result.path}</p>
                <Badge className={result.passed ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>{result.passed ? "Apta para revisión" : "Revisar"}</Badge>
              </div>
              <p className="mt-1 break-all text-xs text-muted-foreground">{result.path}</p>
              {result.error ? <p className="mt-2 text-sm text-red-700">{result.error}</p> :
                <p className="mt-2 text-sm">Original: {mb(result.originalBytes)} · WebP: {mb(result.optimizedBytes)} · Ahorro: {result.savingPct}% · {result.width} × {result.height} px · PSNR: {result.psnr} dB</p>}
              {result.previewDataUrl && result.originalUrl ? <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div><p className="mb-2 text-sm font-medium">Original en Supabase</p><img src={result.originalUrl} alt={`Original: ${result.name}`} className="w-full rounded-lg border bg-white object-contain" /></div>
                <div><p className="mb-2 text-sm font-medium">WebP optimizado · calidad 92</p><img src={result.previewDataUrl} alt={`Optimizada: ${result.name}`} className="w-full rounded-lg border bg-white object-contain" /></div>
              </div> : null}
            </div>)}
          </div>
        </CardContent></Card>}
      </div>
    </AppSidebar>
  );
}
