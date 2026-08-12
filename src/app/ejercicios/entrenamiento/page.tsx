"use client";

import { useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Dumbbell, PlayCircle, Search, Target, TriangleAlert, TrendingUp, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Ejercicio = {
  _id: string;
  codigo_interno?: string | null;
  nombre: string;
  grupo_muscular: string;
  grupo_secundario?: string | null;
  categoria: string;
  dificultad: string;
  material?: string | null;
  descripcion?: string | null;
  tecnica?: string | null;
  errores_frecuentes?: string | null;
  consejos?: string | null;
  imagen_url?: string | null;
  gif_url?: string | null;
  miniatura_url?: string | null;
  video_url?: string | null;
  tipo_movimiento?: string | null;
  lateralidad?: string | null;
  plano_movimiento?: string | null;
  articulacion_principal?: string | null;
  variante_facil?: string | null;
  variante_avanzada?: string | null;
  regresion?: string | null;
  progresion?: string | null;
  etiquetas?: string[];
  objetivos?: string[];
  activo: boolean;
};

const labels: Record<string, string> = {
  pecho: "Pecho", espalda: "Espalda", hombros: "Hombros", biceps: "Bíceps", triceps: "Tríceps",
  piernas: "Piernas", gluteos: "Glúteos", core: "Core", cardio: "Cardio", cuerpo_completo: "Cuerpo completo",
  fuerza: "Fuerza", movilidad: "Movilidad", estiramiento: "Estiramiento", rehabilitacion: "Rehabilitación", tecnica: "Técnica",
  principiante: "Principiante", intermedio: "Intermedio", avanzado: "Avanzado",
  empuje: "Empuje", traccion: "Tracción", bisagra: "Bisagra", sentadilla: "Sentadilla", zancada: "Zancada",
  rotacion: "Rotación", anti_rotacion: "Anti-rotación", locomocion: "Locomoción", aislamiento: "Aislamiento",
};

const grupos = ["todos", "pecho", "espalda", "hombros", "biceps", "triceps", "piernas", "gluteos", "core", "cardio", "cuerpo_completo"];
const dificultades = ["todos", "principiante", "intermedio", "avanzado"];

function listFromText(value?: string | null) {
  return String(value || "").split(/;|\n/).map((item) => item.trim()).filter(Boolean);
}

function MediaHero({ item }: { item: Ejercicio }) {
  const visual = item.gif_url || item.imagen_url || item.miniatura_url;
  if (visual) return <img src={visual} alt={item.nombre} className="h-full w-full object-cover" />;
  return (
    <div className="flex h-full min-h-52 flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950 px-6 text-center text-white">
      <Dumbbell className="mb-4 h-12 w-12 opacity-90" />
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">Chetesaí Fitness+</p>
      <p className="mt-2 text-xl font-bold">{item.nombre}</p>
      <p className="mt-2 max-w-xs text-sm text-white/70">Contenido multimedia propio pendiente de incorporación</p>
    </div>
  );
}

export default function EntrenamientoVisualPage() {
  const [items, setItems] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [dificultad, setDificultad] = useState("todos");
  const [selected, setSelected] = useState<Ejercicio | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/ejercicios?activo=true");
        const data = await response.json() as { ok: boolean; data?: Ejercicio[]; error?: string };
        if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo cargar la biblioteca");
        setItems(data.data || []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al cargar ejercicios");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const searchable = [item.nombre, item.material, item.grupo_muscular, item.tipo_movimiento, ...(item.etiquetas || [])].filter(Boolean).join(" ").toLowerCase();
      return (!term || searchable.includes(term)) && (grupo === "todos" || item.grupo_muscular === grupo) && (dificultad === "todos" || item.dificultad === dificultad);
    });
  }, [items, search, grupo, dificultad]);

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-5 md:p-8">
        <section className="mb-7 overflow-hidden rounded-[2rem] border bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 p-6 text-white shadow-xl md:p-9">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100"><Sparkles className="h-3.5 w-3.5" /> Motor de entrenamiento</div>
            <h1 className="text-3xl font-black tracking-tight md:text-5xl">Biblioteca visual Chetesaí</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70 md:text-base">Explora ejercicios, consulta técnica, errores frecuentes, progresiones y material multimedia desde una vista diseñada para entrenar y prescribir.</p>
          </div>
        </section>

        <div className="mb-6 grid gap-3 md:grid-cols-[1fr_220px_220px]">
          <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ejercicio, material o patrón de movimiento" /></div>
          <Select value={grupo} onValueChange={setGrupo}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{grupos.map((g) => <SelectItem key={g} value={g}>{g === "todos" ? "Todos los grupos" : labels[g] || g}</SelectItem>)}</SelectContent></Select>
          <Select value={dificultad} onValueChange={setDificultad}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{dificultades.map((d) => <SelectItem key={d} value={d}>{d === "todos" ? "Todos los niveles" : labels[d] || d}</SelectItem>)}</SelectContent></Select>
        </div>

        <div className="mb-5 flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground"><strong className="text-foreground">{filtered.length}</strong> ejercicios disponibles</p><p className="hidden text-xs text-muted-foreground sm:block">Selecciona una ficha para abrir la ejecución completa</p></div>

        {loading ? <div className="py-20 text-center text-muted-foreground">Cargando biblioteca visual...</div> : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <Card key={item._id} className="group overflow-hidden rounded-[1.6rem] border-0 shadow-sm ring-1 ring-border transition hover:-translate-y-1 hover:shadow-xl">
                <button type="button" onClick={() => setSelected(item)} className="block w-full text-left">
                  <div className="relative h-52 overflow-hidden"><MediaHero item={item} /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-10"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-900">{labels[item.dificultad] || item.dificultad}</span><span className="rounded-full bg-emerald-500/90 px-2.5 py-1 text-[11px] font-bold text-white">{labels[item.grupo_muscular] || item.grupo_muscular}</span></div></div></div>
                  <CardContent className="p-5">
                    <h2 className="text-xl font-black tracking-tight">{item.nombre}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{item.material || "Sin material"}{item.tipo_movimiento ? ` · ${labels[item.tipo_movimiento] || item.tipo_movimiento}` : ""}</p>
                    <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{item.descripcion || item.tecnica || "Ficha técnica disponible"}</p>
                    <div className="mt-4 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">Ver ejecución</span><PlayCircle className="h-5 w-5 text-primary transition group-hover:scale-110" /></div>
                  </CardContent>
                </button>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-h-[94vh] max-w-5xl overflow-y-auto p-0">
            {selected ? <ExerciseDetail item={selected} /> : null}
          </DialogContent>
        </Dialog>
      </div>
    </AppSidebar>
  );
}

function ExerciseDetail({ item }: { item: Ejercicio }) {
  const errors = listFromText(item.errores_frecuentes);
  const tips = listFromText(item.consejos);
  return (
    <div>
      <div className="grid md:grid-cols-[1.08fr_.92fr]">
        <div className="min-h-72 overflow-hidden bg-slate-950 md:min-h-[420px]"><MediaHero item={item} /></div>
        <div className="p-6 md:p-8">
          <DialogHeader className="text-left"><DialogTitle className="text-3xl font-black tracking-tight">{item.nombre}</DialogTitle></DialogHeader>
          <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{labels[item.dificultad] || item.dificultad}</span><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{labels[item.grupo_muscular] || item.grupo_muscular}</span>{item.material ? <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">{item.material}</span> : null}</div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">{item.descripcion || item.tecnica}</p>
          {item.video_url ? <Button asChild className="mt-5 w-full"><a href={item.video_url} target="_blank" rel="noreferrer"><PlayCircle className="mr-2 h-4 w-4" />Ver vídeo de demostración</a></Button> : <div className="mt-5 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">Vídeo Chetesaí pendiente de incorporar para este ejercicio.</div>}
        </div>
      </div>

      <div className="grid gap-5 p-6 md:grid-cols-2 md:p-8">
        <InfoPanel icon={<Target className="h-5 w-5" />} title="Técnica de ejecución"><p>{item.tecnica || "Pendiente de completar."}</p></InfoPanel>
        <InfoPanel icon={<TriangleAlert className="h-5 w-5" />} title="Errores frecuentes">{errors.length ? <ul className="space-y-2">{errors.map((x) => <li key={x}>• {x}</li>)}</ul> : <p>Sin errores registrados.</p>}</InfoPanel>
        <InfoPanel icon={<TrendingUp className="h-5 w-5" />} title="Progresión"><p>{item.progresion || item.variante_avanzada || "Pendiente de definir."}</p></InfoPanel>
        <InfoPanel icon={<RotateCcw className="h-5 w-5" />} title="Regresión"><p>{item.regresion || item.variante_facil || "Pendiente de definir."}</p></InfoPanel>
        <InfoPanel icon={<Sparkles className="h-5 w-5" />} title="Consejos del entrenador" className="md:col-span-2">{tips.length ? <ul className="grid gap-2 md:grid-cols-2">{tips.map((x) => <li key={x}>• {x}</li>)}</ul> : <p>Sin consejos registrados.</p>}</InfoPanel>
      </div>
    </div>
  );
}

function InfoPanel({ icon, title, children, className = "" }: { icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl border bg-muted/20 p-5 ${className}`}><div className="mb-3 flex items-center gap-2 font-black">{icon}<h3>{title}</h3></div><div className="text-sm leading-6 text-muted-foreground">{children}</div></section>;
}
