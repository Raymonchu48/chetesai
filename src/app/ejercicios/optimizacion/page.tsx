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
type Published = { path: string; optimizedPath?: string; savingPct?: number; psnr?: number; referencesUpdated?: number; originalPreserved?: boolean; error?: string };

type Result = {
  path: string; name?: string; field?: string; originalBytes?: number;
  optimizedBytes?: number; savingPct?: number; width?: number; height?: number;
  psnr?: number; passed: boolean; notes?: string; error?: string;
  originalUrl?: string; previewDataUrl?: string; previewUrl?: string;
};

function mb(bytes?: number) {
  return bytes === undefined ? "—" : `${(bytes / 1048576).toFixed(2)} MiB`;
}

export default function OptimizationPage() {
  const [items, setItems] = useState<Candidate[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<Published[]>([]);
  const [publishProgress, setPublishProgress] = useState(0);
  const [alreadyPublished, setAlreadyPublished] = useState(0);
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

  useEffect(() => {
    fetch("/api/ejercicios/optimizacion/publicar", { cache: "no-store" })
      .then(async (r) => { if (!r.ok) return; const j = await r.json() as { data?: unknown[] }; setAlreadyPublished(j.data?.length || 0); })
      .catch(() => {});
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

  async function publishBatch() {
    if (publishing || processing || chosen.length === 0) return;
    const selected = chosen.slice(0, firstBatchRemaining);
    if (!window.confirm(`¿Publicar hasta ${selected.length} imágenes WebP? Se conservarán los originales, se actualizarán las referencias y se registrarán los resultados. Solo continuar si ya has revisado la calidad.`)) return;
    setPublishing(true);
    setPublished([]);
    setPublishProgress(0);
    const results: Published[] = [];
    for (const path of selected) {
      try {
        const response = await fetch("/api/ejercicios/optimizacion/publicar", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "publish", path }),
        });
        const data = await response.json() as { ok: boolean; error?: string; data?: Published };
        if (!response.ok || !data.ok || !data.data) throw new Error(data.error || "Fallo de publicación");
        results.push(data.data);
      } catch (error) {
        results.push({ path, error: error instanceof Error ? error.message : "Error" });
      }
      setPublished([...results]);
      setPublishProgress(results.length);
    }
    setItems((prev) => prev.filter((entry) => !results.some((r) => r.path === entry.path && !r.error)));
    setAlreadyPublished((prev) => prev + results.filter((r) => !r.error).length);
    setPublishing(false);
    const good = results.filter((r) => !r.error).length;
    toast[good === results.length ? "success" : "warning"](`Lote terminado: ${good} imágenes publicadas, ${results.length - good} pendientes. Ningún original eliminado.`);
  }

  const chosen = [...new Set(items.map((i) => i.path))];
  const firstBatchRemaining = alreadyPublished > 0 && alreadyPublished < 20 ? 20 - alreadyPublished : 20;
  return (
    <AppSidebar>
      <div className="mx-auto max-w-6xl space-y-6 p-6 md:p-8">
        <Link href="/ejercicios" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Biblioteca de ejercicios
        </Link>
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold"><ImageDown className="h-8 w-8 text-primary" /> Mantenimiento de imágenes</h1>
          <p className="mt-2 text-muted-foreground">Herramienta protegida para el administrador · WebP calidad 92 · Originales conservados</p>
        </div>
        <Card><CardContent className="space-y-4 p-5">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-6 w-6 shrink-0 text-emerald-600" />
            <div><h2 className="font-semibold">Análisis y publicación controlada</h2>
              <p className="text-sm text-muted-foreground">Puedes analizar imágenes sin alterar nada. El botón de publicación sube cada WebP, verifica la nueva ruta y actualiza únicamente los ejercicios vinculados. Los originales no se eliminan y se conserva un historial para revertir.</p>
            </div>
          </div>
          {loading ? <p>Cargando imágenes vinculadas...</p> : error ? <p role="alert" className="text-red-700">{error}</p> : <>
            <p className="text-sm">{chosen.length} archivos PNG/JPG referenciados en la biblioteca. Se analizan por nombre en orden alfabético.</p>
            <div className="flex flex-wrap gap-3">
              <Button disabled={processing || chosen.length < 1} onClick={() => analyze(1)}>{processing ? "Analizando..." : "Analizar una imagen"}</Button>
              <Button variant="outline" disabled={processing || publishing || chosen.length < 2} onClick={() => analyze(20)}>{processing ? "Analizando..." : "Analizar lote (hasta 20)"}</Button>
              <Button variant="outline" disabled={processing || publishing || chosen.length === 0} onClick={publishBatch}>{publishing ? `Publicando ${publishProgress}/${Math.min(chosen.length, firstBatchRemaining)}...` : `Publicar ${Math.min(chosen.length, firstBatchRemaining)} imágenes · conservar originales`}</Button>
            </div>
          </>}
        </CardContent></Card>
        {published.length > 0 && <Card><CardContent className="space-y-3 p-5"><h2 className="text-xl font-semibold">Resultado de publicación</h2><p className="text-sm text-muted-foreground">Publicadas {published.filter((r) => !r.error).length} de {published.length}. Los originales se mantienen.</p>{published.map((r) => <div key={r.path} className="rounded-lg border p-3 text-sm"><p className="break-all font-medium">{r.path}</p>{r.error ? <p className="text-red-700">{r.error}</p> : <p className="text-emerald-700">WebP publicado · ahorro {r.savingPct}% · PSNR {r.psnr} dB · referencias actualizadas {r.referencesUpdated}</p>}</div>)}</CardContent></Card>}
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
              {(result.previewUrl || result.previewDataUrl) && result.originalUrl ? <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div><p className="mb-2 text-sm font-medium">Original en Supabase</p><img src={result.originalUrl} alt={`Original: ${result.name}`} loading="lazy" decoding="async" className="w-full rounded-lg border bg-white object-contain" /></div>
                <div><p className="mb-2 text-sm font-medium">WebP optimizado · calidad 92</p><img src={result.previewUrl || result.previewDataUrl} alt={`Optimizada: ${result.name}`} loading="lazy" decoding="async" className="w-full rounded-lg border bg-white object-contain" /></div>
              </div> : null}
            </div>)}
          </div>
        </CardContent></Card>}
      </div>
    </AppSidebar>
  );
}
