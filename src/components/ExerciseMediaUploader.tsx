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
};

const acceptByKind: Record<MediaKind, string> = {
  miniatura: "image/jpeg,image/png,image/webp",
  imagen: "image/jpeg,image/png,image/webp",
  gif: "image/gif,image/webp",
  video: "video/mp4,video/webm,video/quicktime",
};

export default function ExerciseMediaUploader({ kind, label, exerciseName, value, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      body.append("exerciseName", exerciseName || "ejercicio");

      const response = await fetch("/api/ejercicios/media", { method: "POST", body });
      const result = (await response.json()) as { ok: boolean; data?: { url: string }; error?: string };
      if (!response.ok || !result.ok || !result.data?.url) {
        throw new Error(result.error || "No se pudo subir el archivo");
      }
      onUploaded(result.data.url);
      toast.success(`${label} subida correctamente`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const isVideo = kind === "video";
  const isAnimated = kind === "gif";

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

      <input
        ref={inputRef}
        type="file"
        accept={acceptByKind[kind]}
        className="hidden"
        onChange={(event) => upload(event.target.files?.[0])}
      />

      <Button type="button" variant="outline" className="w-full" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        {uploading ? "Subiendo..." : value ? `Cambiar ${label.toLowerCase()}` : `Subir ${label.toLowerCase()}`}
      </Button>
      <p className="text-xs text-muted-foreground">
        {isVideo ? "MP4, WebM o MOV · máximo 50 MB" : isAnimated ? "GIF o WebP animado · máximo 12 MB" : "JPG, PNG o WebP · máximo 12 MB"}
      </p>
    </div>
  );
}
