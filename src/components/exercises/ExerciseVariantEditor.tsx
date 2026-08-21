"use client";

import { Plus, Trash2 } from "lucide-react";
import ExerciseMediaUploader from "@/components/ExerciseMediaUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ExerciseVisualVariant, ExerciseVariantLevel } from "@/lib/exercise-visual-variants";

type Props = {
  exerciseName: string;
  variants: ExerciseVisualVariant[];
  onChange: (variants: ExerciseVisualVariant[]) => void;
};

function newVariant(index: number): ExerciseVisualVariant {
  return {
    id: `variante-${Date.now()}-${index}`,
    nombre: `Variante ${index + 1}`,
    enfoque: "",
    musculos: [],
    indicacion: "",
    nivel: "principiante",
    video_url: null,
    imagen_url: null,
  };
}

export default function ExerciseVariantEditor({ exerciseName, variants, onChange }: Props) {
  function patch(index: number, value: Partial<ExerciseVisualVariant>) {
    onChange(variants.map((variant, current) => current === index ? { ...variant, ...value } : variant));
  }

  function remove(index: number) {
    onChange(variants.filter((_, current) => current !== index));
  }

  return (
    <section className="md:col-span-2 rounded-3xl border border-[#dce7d8] bg-[#f7faf4] p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#559900]">Experiencia audiovisual</p>
          <h3 className="mt-1 text-lg font-black">Variantes interactivas</h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Cada botón puede mostrar un vídeo en bucle, una imagen, el énfasis muscular y una indicación técnica diferente.</p>
        </div>
        <Button type="button" variant="outline" disabled={variants.length >= 8} onClick={() => onChange([...variants, newVariant(variants.length)])}>
          <Plus className="mr-2 h-4 w-4" /> Añadir variante
        </Button>
      </div>

      {variants.length ? (
        <div className="mt-5 space-y-4">
          {variants.map((variant, index) => (
            <article key={variant.id} className="rounded-2xl border bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div><p className="text-[10px] font-black uppercase tracking-wide text-[#c9653b]">Variante {index + 1}</p><p className="font-black">{variant.nombre || "Sin nombre"}</p></div>
                <Button type="button" size="icon" variant="ghost" aria-label={`Eliminar ${variant.nombre}`} className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nombre de la posición o variante"><Input value={variant.nombre} onChange={(event) => patch(index, { nombre: event.target.value })} placeholder="Pies altos" /></Field>
                <Field label="Nivel"><Select value={variant.nivel} onValueChange={(value) => patch(index, { nivel: value as ExerciseVariantLevel })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="principiante">Básico</SelectItem><SelectItem value="intermedio">Intermedio</SelectItem><SelectItem value="avanzado">Avanzado</SelectItem></SelectContent></Select></Field>
                <Field label="Énfasis"><Input value={variant.enfoque} onChange={(event) => patch(index, { enfoque: event.target.value })} placeholder="Mayor énfasis en la cadena posterior" /></Field>
                <Field label="Músculos destacados"><Input value={variant.musculos.join(", ")} onChange={(event) => patch(index, { musculos: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="Glúteos, isquiotibiales" /></Field>
                <div className="md:col-span-2"><Field label="Indicación técnica"><Textarea rows={3} value={variant.indicacion} onChange={(event) => patch(index, { indicacion: event.target.value })} placeholder="Qué debe hacer y qué debe controlar el cliente" /></Field></div>
                <div className="space-y-2"><ExerciseMediaUploader kind="video" label="Vídeo vertical" exerciseName={`${exerciseName}-${variant.nombre}`} value={variant.video_url} onUploaded={(url) => patch(index, { video_url: url })} /><Input value={variant.video_url || ""} onChange={(event) => patch(index, { video_url: event.target.value || null })} placeholder="O pega una URL de vídeo autorizada" /></div>
                <div className="space-y-2"><ExerciseMediaUploader kind="imagen" label="Imagen de apoyo" exerciseName={`${exerciseName}-${variant.nombre}`} value={variant.imagen_url} onUploaded={(url) => patch(index, { imagen_url: url })} /><Input value={variant.imagen_url || ""} onChange={(event) => patch(index, { imagen_url: event.target.value || null })} placeholder="O pega una URL de imagen autorizada" /></div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed bg-white p-8 text-center text-sm text-muted-foreground">Todavía no hay variantes personalizadas. La ficha seguirá mostrando la ejecución principal, la regresión y la progresión disponibles.</div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
