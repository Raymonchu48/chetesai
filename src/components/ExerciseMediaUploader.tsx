"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Upload, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type MediaKind = "miniatura" | "imagen" | "gif" | "video";

type Props = {
  kind: MediaKind;
  label: string;
  exerciseName: string;
  value: string | null;
  onUploaded: (url: string) => void;
  exerciseId?: string;
  compact?: boolean;
};

type ApiResult = {
  ok: boolean;
  data?: {
    signedUrl?: string;
    path?: string;
    url?: string;
  };
  error?: string;
};

const acceptByKind: Record<MediaKind, string> = {
  miniatura: "image/jpeg,image/png,image/webp",
  imagen: "image/jpeg,image/png,image/webp",
  gif: "image/gif,image/webp",
  video: "video/mp4,video/webm,video/quicktime",
};

function maxSizeFor(kind: MediaKind) {
  return kind === "video" ? 50 * 1024 * 1024 : 12 * 1024 * 1024;
}

function formatUploadError(text: string, status: number, fallback: string) {
  if (status === 413 || /request entity too large|payload too large|function_payload_too_large/i.test(text)) {
    return "El archivo es demasiado grande para procesarlo. Elige otro archivo o reduce su tamaño.";
  }

  try {
    const parsed = JSON.parse(text) as { error?: string; message?: string };
    return parsed.error || parsed.message || fallback;
  } catch {
    return text.trim() || fallback;
  }
}

async function readApiResult(response: Response, fallback: string): Promise<ApiResult> {
  const text = await response.text();
  if (!text) return { ok: false, error: fallback };

  try {
    return JSON.parse(text) as ApiResult;
  } catch {
    return { ok: false, error: formatUploadError(text, response.status, fallback) };
  }
}

export default function ExerciseMediaUploader({ kind, label, exerciseName, value, onUploaded, exerciseId, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file?: File) {
    if (!file) return;

    if (file.size > maxSizeFor(kind)) {
      toast.error(kind === "video" ? "El vídeo supera el máximo de 50 MB" : "La imagen supera el máximo de 12 MB");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const signResponse = await fetch("/api/ejercicios/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sign",
          kind,
          exerciseName: exerciseName || "ejercicio",
          exerciseId: exerciseId || "",
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });
      const signResult = await readApiResult(signResponse, "No se pudo preparar la subida");
      const signedUrl = signResult.data?.signedUrl;
      const path = signResult.data?.path;

      if (!signResponse.ok || !signResult.ok || !signedUrl || !path) {
        throw new Error(signResult.error || "No se pudo preparar la subida");
      }

      const uploadBody = new FormData();
      uploadBody.append("cacheControl", "3600");
      uploadBody.append("", file);

      const storageResponse = await fetch(signedUrl, {
        method: "PUT",
        headers: { "x-upsert": "false" },
        body: uploadBody,
      });
      if (!storageResponse.ok) {
        const storageText = await storageResponse.text();
        throw new Error(formatUploadError(storageText, storageResponse.status, "No se pudo subir el archivo"));
      }

      const finalizeResponse = await fetch("/api/ejercicios/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize",
          kind,
          path,
          exerciseId: exerciseId || "",
        }),
      });
      const finalizeResult = await readApiResult(finalizeResponse, "No se pudo guardar la imagen");
      const url = finalizeResult.data?.url;

      if (!finalizeResponse.ok || !finalizeResult.ok || !url) {
        throw new Error(finalizeResult.error || "No se pudo guardar la imagen");
      }

      onUploaded(url);
      toast.success(label + " subida correctamente");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isVideo = kind === "video";
  const isAnimated = kind === "gif";

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={acceptByKind[kind]}
      className="hidden"
      onChange={(event) => upload(event.target.files?.[0])}
    />
  );

  if (compact) {
    return (
      <>
        {fileInput}
        <Button
          type="button"
          size="sm"
          className="w-full border border-white/70 bg-white/95 text-slate-900 shadow-lg hover:bg-white sm:w-auto"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {uploading ? "Subiendo..." : value ? "Cambiar imagen" : "Subir imagen"}
        </Button>
      </>
    );
  }

  return (
    <div className="space-y-2 rounded-2xl border border-dashed p-3">
      <Label>{label}</Label>
      {value ? (
        <div className="overflow-hidden rounded-xl bg-muted">
          {isVideo ? (
            <video src={value} controls preload="metadata" className="h-36 w-full object-cover" />
          ) : (
            <img src={value} alt={label} className="h-36 w-full object-cover" />
          )}
        </div>
      ) : (
        <div className="grid h-28 place-items-center rounded-xl bg-muted/60 text-muted-foreground">
          {isVideo ? <Video className="h-7 w-7" /> : <ImagePlus className="h-7 w-7" />}
        </div>
      )}

      {fileInput}

      <Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {uploading ? "Subiendo..." : value ? "Cambiar " + label.toLowerCase() : "Subir " + label.toLowerCase()}
      </Button>
      <p className="text-xs text-muted-foreground">
        {isVideo ? "MP4, WebM o MOV · máximo 50 MB" : isAnimated ? "GIF o WebP animado · máximo 12 MB" : "JPG, PNG o WebP · máximo 12 MB"}
      </p>
    </div>
  );
}
