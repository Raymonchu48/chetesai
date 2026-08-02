"use client";

import { useEffect, useMemo, useState } from "react";
import { Camera, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export type ProgressPhotoMeasurement = {
  id: string;
  fecha: string;
  foto_frontal_path: string | null;
  foto_lateral_path: string | null;
  foto_posterior_path: string | null;
};

type Pose = "frontal" | "lateral" | "posterior";

type Props = {
  measurements: ProgressPhotoMeasurement[];
  mode: "professional" | "client";
  clienteId?: string;
  onChanged?: () => void | Promise<void>;
};

const poses: Array<{ key: Pose; label: string; field: keyof ProgressPhotoMeasurement }> = [
  { key: "frontal", label: "Frontal", field: "foto_frontal_path" },
  { key: "lateral", label: "Lateral", field: "foto_lateral_path" },
  { key: "posterior", label: "Posterior", field: "foto_posterior_path" },
];

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function ProgressPhotoGallery({ measurements, mode, clienteId, onChanged }: Props) {
  const [uploadMeasurementId, setUploadMeasurementId] = useState("");
  const [beforeId, setBeforeId] = useState("");
  const [afterId, setAfterId] = useState("");
  const [uploading, setUploading] = useState<Pose | null>(null);

  const photoMeasurements = useMemo(
    () => measurements.filter((item) => poses.some((pose) => Boolean(item[pose.field]))),
    [measurements]
  );

  useEffect(() => {
    if (!uploadMeasurementId && measurements[0]) setUploadMeasurementId(measurements[0].id);
    if (!afterId && photoMeasurements[0]) setAfterId(photoMeasurements[0].id);
    if (!beforeId && photoMeasurements.length > 1) setBeforeId(photoMeasurements[photoMeasurements.length - 1].id);
    else if (!beforeId && photoMeasurements[0]) setBeforeId(photoMeasurements[0].id);
  }, [measurements, photoMeasurements, uploadMeasurementId, beforeId, afterId]);

  const before = photoMeasurements.find((item) => item.id === beforeId) || photoMeasurements[0];
  const after = photoMeasurements.find((item) => item.id === afterId) || photoMeasurements[0];

  function imageUrl(path: string | null) {
    if (!path) return "";
    const base = mode === "professional" ? "/api/progreso/fotos" : "/api/portal/progreso/foto";
    return `${base}?path=${encodeURIComponent(path)}`;
  }

  async function upload(pose: Pose, file?: File) {
    if (!file || !clienteId || !uploadMeasurementId) return;
    setUploading(pose);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("pose", pose);
      body.append("cliente_id", clienteId);
      body.append("medicion_id", uploadMeasurementId);

      const response = await fetch("/api/progreso/fotos", { method: "POST", body });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo subir la fotografía");
      toast.success(`Fotografía ${pose} guardada`);
      await onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir la fotografía");
    } finally {
      setUploading(null);
    }
  }

  if (!measurements.length) return null;

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Fotografías de progreso</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Imágenes privadas para observar cambios posturales y corporales entre valoraciones.
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Acceso privado
          </span>
        </div>

        {mode === "professional" ? (
          <div className="mt-6 rounded-2xl border border-dashed p-4">
            <div className="mb-4 max-w-sm">
              <Label>Valoración asociada</Label>
              <Select value={uploadMeasurementId} onValueChange={setUploadMeasurementId}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {measurements.map((item) => <SelectItem key={item.id} value={item.id}>{formatDate(item.fecha)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {poses.map((pose) => (
                <label key={pose.key} className="cursor-pointer rounded-2xl border bg-muted/30 p-4 text-center transition hover:border-primary/40 hover:bg-primary/5">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploading !== null}
                    onChange={(event) => {
                      void upload(pose.key, event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                  {uploading === pose.key ? <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /> : <ImagePlus className="mx-auto h-7 w-7 text-primary" />}
                  <p className="mt-2 font-semibold">{uploading === pose.key ? "Subiendo..." : `Subir ${pose.label.toLowerCase()}`}</p>
                  <p className="mt-1 text-xs text-muted-foreground">JPG, PNG o WebP · máximo 12 MB</p>
                </label>
              ))}
            </div>
          </div>
        ) : null}

        {photoMeasurements.length ? (
          <div className="mt-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>Antes</Label><Select value={before?.id || ""} onValueChange={setBeforeId}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{photoMeasurements.map((item) => <SelectItem key={item.id} value={item.id}>{formatDate(item.fecha)}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>Después</Label><Select value={after?.id || ""} onValueChange={setAfterId}><SelectTrigger className="mt-2"><SelectValue /></SelectTrigger><SelectContent>{photoMeasurements.map((item) => <SelectItem key={item.id} value={item.id}>{formatDate(item.fecha)}</SelectItem>)}</SelectContent></Select></div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-3">
              {poses.map((pose) => {
                const beforePath = before ? (before[pose.field] as string | null) : null;
                const afterPath = after ? (after[pose.field] as string | null) : null;
                return (
                  <section key={pose.key} className="overflow-hidden rounded-2xl border">
                    <div className="border-b bg-muted/40 px-4 py-3 font-semibold">Vista {pose.label.toLowerCase()}</div>
                    <div className="grid grid-cols-2">
                      <PhotoCell label="Antes" date={before?.fecha} src={imageUrl(beforePath)} />
                      <PhotoCell label="Después" date={after?.fecha} src={imageUrl(afterPath)} bordered />
                    </div>
                  </section>
                );
              })}
            </div>
            {photoMeasurements.length < 2 ? <p className="mt-4 text-center text-sm text-muted-foreground">Añade fotografías en otra fecha para disponer de una comparación real.</p> : null}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-muted/40 px-5 py-10 text-center">
            <Camera className="mx-auto h-9 w-9 text-muted-foreground" />
            <p className="mt-3 font-semibold">Todavía no hay fotografías asociadas</p>
            <p className="mt-1 text-sm text-muted-foreground">Las imágenes aparecerán aquí cuando se añadan a una valoración.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PhotoCell({ label, date, src, bordered = false }: { label: string; date?: string; src: string; bordered?: boolean }) {
  return (
    <div className={bordered ? "border-l" : ""}>
      <div className="aspect-[3/4] bg-muted/50">
        {src ? <img src={src} alt={`${label} ${date || ""}`} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center px-3 text-center text-xs text-muted-foreground">Sin fotografía</div>}
      </div>
      <div className="p-3 text-center"><p className="text-xs font-bold uppercase tracking-wide">{label}</p><p className="mt-1 text-xs text-muted-foreground">{date ? formatDate(date) : "—"}</p></div>
    </div>
  );
}
