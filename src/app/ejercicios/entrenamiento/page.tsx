"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import ExerciseMediaVisual from "@/components/exercises/ExerciseMediaVisual";
import type { ExerciseVisualModel } from "@/components/exercises/ProfessionalExerciseVisual";
import ExerciseMediaUploader from "@/components/ExerciseMediaUploader";
import AssignExerciseToClient from "@/components/exercises/AssignExerciseToClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Dumbbell,
  Grid2X2,
  Info,
  Lightbulb,
  PlayCircle,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  TriangleAlert,
  Trash2,
  UserRound,
  Zap,
} from "lucide-react";
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
  todos: "Todos",
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  brazos: "Brazos",
  biceps: "Bíceps",
  triceps: "Tríceps",
  piernas: "Piernas",
  gluteos: "Glúteos",
  core: "Core",
  cardio: "Cardio",
  cuerpo_completo: "Cuerpo completo",
  funcional: "Funcional",
  calentamiento: "Calentamiento",
  estiramientos: "Estiramientos",
  principiante: "Básico",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
  empuje: "Empuje",
  traccion: "Tracción",
  bisagra: "Bisagra",
  sentadilla: "Sentadilla",
  zancada: "Zancada",
  rotacion: "Rotación",
  anti_rotacion: "Anti-rotación",
  locomocion: "Locomoción",
  aislamiento: "Aislamiento",
};

const groupDescriptions: Record<string, { subtitle: string; phrase: string }> = {
  todos: { subtitle: "Fuerza, movilidad y control.", phrase: "Todo tu catálogo en una sola vista." },
  piernas: { subtitle: "Fuerza, estabilidad y movimiento.", phrase: "Las piernas sostienen tu progreso." },
  pecho: { subtitle: "Empuje, fuerza y control.", phrase: "Construye una base sólida." },
  espalda: { subtitle: "Tracción, postura y estabilidad.", phrase: "Una espalda fuerte mejora todo el movimiento." },
  hombros: { subtitle: "Movilidad, fuerza y precisión.", phrase: "Control antes que carga." },
  brazos: { subtitle: "Fuerza y equilibrio muscular.", phrase: "Potencia cada repetición." },
  biceps: { subtitle: "Tracción y control del codo.", phrase: "Técnica limpia, progreso constante." },
  triceps: { subtitle: "Extensión y potencia de empuje.", phrase: "Estabilidad para mover más y mejor." },
  gluteos: { subtitle: "Potencia, estabilidad y postura.", phrase: "Activa el motor de la cadera." },
  core: { subtitle: "Control, estabilidad y transferencia.", phrase: "El centro conecta todo tu movimiento." },
  cardio: { subtitle: "Resistencia, ritmo y energía.", phrase: "Mejora tu capacidad paso a paso." },
  cuerpo_completo: { subtitle: "Coordinación, fuerza y eficiencia.", phrase: "Entrena el cuerpo como una unidad." },
  funcional: { subtitle: "Fuerza útil, coordinación y resistencia.", phrase: "Muévete mejor para rendir dentro y fuera del gimnasio." },
  calentamiento: { subtitle: "Movilidad y activación.", phrase: "Prepara el cuerpo antes de exigirlo." },
  estiramientos: { subtitle: "Movilidad, descarga y recuperación.", phrase: "Recuperar también es entrenar." },
};

const grupos = ["todos", "funcional", "calentamiento", "pecho", "espalda", "hombros", "brazos", "biceps", "triceps", "piernas", "gluteos", "core", "cardio", "cuerpo_completo", "estiramientos"];
const functionalExerciseCodes = new Set([
  "CHE-CAR-001",
  "CHE-CAR-002",
  "CHE-COR-011",
  "CHE-COR-014",
  "CHE-FUN-001",
  "CHE-FUN-002",
  "CHE-FUN-003",
  "CHE-FUN-004",
  "CHE-FUN-005",
  "CHE-PIE-006",
  "CHE-PIE-016",
  "CHE-PIE-017",
]);
const dificultades = ["todos", "principiante", "intermedio", "avanzado"];
const PAGE_SIZE = 12;

function listFromText(value?: string | null) {
  return String(value || "").split(/;|\n/).map((item) => item.trim()).filter(Boolean);
}

function belongsToGroup(item: Ejercicio, group: string) {
  if (group === "todos") return true;
  if (group === "brazos") return ["biceps", "triceps", "brazos"].includes(item.grupo_muscular);
  if (group === "funcional") {
    const code = (item.codigo_interno || "").toUpperCase();
    return code.startsWith("CHE-FUN-") || functionalExerciseCodes.has(code) || (item.etiquetas || []).includes("funcional");
  }
  if (group === "calentamiento") return item.grupo_muscular === "calentamiento" || item.categoria === "calentamiento" || (item.etiquetas || []).includes("calentamiento");
  if (group === "estiramientos") return ["estiramientos", "estiramiento", "movilidad"].includes(item.grupo_muscular) || ["estiramientos", "estiramiento", "movilidad"].includes(item.categoria) || (item.etiquetas || []).some((tag) => ["estiramiento", "estiramientos", "movilidad", "vuelta_calma"].includes(tag));
  return item.grupo_muscular === group;
}

function difficultyStyle(value: string) {
  if (value === "avanzado") return "text-red-600";
  if (value === "intermedio") return "text-amber-600";
  return "text-[#59a500]";
}

function MediaHero({ item, visualModel }: { item: Ejercicio; visualModel: ExerciseVisualModel }) {
  return <ExerciseMediaVisual item={item} visualModel={visualModel} />;
}

export default function EntrenamientoVisualPage() {
  const params = useSearchParams();
  const initialGroup = params.get("grupo") || "todos";
  const [items, setItems] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [grupo, setGrupo] = useState(grupos.includes(initialGroup) ? initialGroup : "todos");
  const [dificultad, setDificultad] = useState("todos");
  const [selected, setSelected] = useState<Ejercicio | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [wideLayout, setWideLayout] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [visualModel, setVisualModel] = useState<ExerciseVisualModel>("mujer");
  const [deletingExercise, setDeletingExercise] = useState(false);

  useEffect(() => {
    const requested = params.get("grupo");
    if (requested && grupos.includes(requested)) setGrupo(requested);
  }, [params]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");
    const update = () => setWideLayout(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("chetesai_exercise_favorites") || "[]") as string[];
      setFavorites(Array.isArray(saved) ? saved : []);
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("chetesai_exercise_visual_model");
    if (saved === "hombre" || saved === "mujer") setVisualModel(saved);
  }, []);

  function changeVisualModel(value: ExerciseVisualModel) {
    setVisualModel(value);
    localStorage.setItem("chetesai_exercise_visual_model", value);
  }

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch("/api/ejercicios?activo=true");
        const result = await response.json() as { ok: boolean; data?: Ejercicio[]; error?: string };
        if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo cargar la biblioteca");
        setItems(result.data || []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error al cargar ejercicios");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const groupItems = useMemo(() => items.filter((item) => belongsToGroup(item, grupo)), [items, grupo]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return groupItems.filter((item) => {
      const searchable = [item.nombre, item.material, item.grupo_muscular, item.tipo_movimiento, ...(item.etiquetas || [])].filter(Boolean).join(" ").toLowerCase();
      return (!term || searchable.includes(term)) && (dificultad === "todos" || item.dificultad === dificultad) && (!onlyFavorites || favorites.includes(item._id));
    });
  }, [groupItems, search, dificultad, onlyFavorites, favorites]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [search, grupo, dificultad, onlyFavorites]);

  useEffect(() => {
    setSelected((current) => {
      if (!filtered.length) return null;
      if (current && filtered.some((item) => item._id === current._id)) return current;
      return filtered[0];
    });
  }, [filtered]);

  function toggleFavorite(id: string) {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      localStorage.setItem("chetesai_exercise_favorites", JSON.stringify(next));
      return next;
    });
  }

  function selectExercise(item: Ejercicio) {
    setSelected(item);
    if (!wideLayout) setMobileDetailOpen(true);
  }

  function updateExerciseImage(url: string) {
    const selectedId = selected?._id;
    if (!selectedId) return;
    setItems((current) => current.map((item) => item._id === selectedId ? { ...item, imagen_url: url } : item));
    setSelected((current) => current ? { ...current, imagen_url: url } : current);
  }

  async function deleteExercise(item: Ejercicio) {
    if (!window.confirm(`¿Eliminar "${item.nombre}" de la biblioteca? Esta acción no se puede deshacer.`)) return;
    setDeletingExercise(true);
    try {
      const response = await fetch(`/api/ejercicios/${item._id}`, { method: "DELETE" });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo eliminar el ejercicio");
      setItems((current) => current.filter((exercise) => exercise._id !== item._id));
      setSelected(null);
      setMobileDetailOpen(false);
      toast.success("Ejercicio eliminado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el ejercicio");
    } finally {
      setDeletingExercise(false);
    }
  }

  const description = groupDescriptions[grupo] || groupDescriptions.todos;
  const counts = {
    todos: groupItems.length,
    principiante: groupItems.filter((item) => item.dificultad === "principiante").length,
    intermedio: groupItems.filter((item) => item.dificultad === "intermedio").length,
    avanzado: groupItems.filter((item) => item.dificultad === "avanzado").length,
  };

  return (
    <AppSidebar>
      <div className="min-h-screen bg-[#f7f9f6] text-slate-950">
        <div className="mx-auto max-w-[1800px] p-4 md:p-6">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">Ejercicios</h1>
              <div className="mt-1 flex items-center gap-2 text-sm"><span className="font-semibold text-[#5ca800]">Biblioteca</span><ChevronRight className="h-3.5 w-3.5 text-slate-400"/><span>{labels[grupo] || grupo}</span></div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap lg:justify-end">
              <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Modelo de las ilustraciones">
                <span className="hidden px-2 text-[10px] font-black uppercase tracking-wide text-slate-400 sm:inline">Modelo</span>
                {(["mujer", "hombre"] as ExerciseVisualModel[]).map((value) => (
                  <button key={value} type="button" onClick={() => changeVisualModel(value)} aria-pressed={visualModel === value} className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-bold capitalize transition ${visualModel === value ? "bg-[#46624f] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}>
                    <UserRound className="h-3.5 w-3.5"/>{value}
                  </button>
                ))}
              </div>
              <div className="relative min-w-0 sm:w-72"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><Input className="h-11 rounded-xl border-slate-200 bg-white pl-9 shadow-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar ejercicio..."/></div>
              <Button asChild variant="outline" className={`h-11 rounded-xl bg-white ${grupo === "funcional" ? "border-[#66b512] bg-[#f2f9e9] text-[#559900]" : ""}`}><Link href="/ejercicios/entrenamiento?grupo=funcional"><Zap className="mr-2 h-4 w-4"/>Funcional</Link></Button>
              <Button variant="outline" className={`h-11 rounded-xl bg-white ${filterOpen ? "border-[#66b512] text-[#559900]" : ""}`} onClick={() => setFilterOpen((open) => !open)}><SlidersHorizontal className="mr-2 h-4 w-4"/>Filtros</Button>
              <Button variant="outline" className={`h-11 rounded-xl bg-white ${onlyFavorites ? "border-[#66b512] text-[#559900]" : ""}`} onClick={() => setOnlyFavorites((value) => !value)}><Star className={`mr-2 h-4 w-4 ${onlyFavorites ? "fill-[#72b900]" : ""}`}/>Favoritos</Button>
              <Button asChild className="h-11 rounded-xl bg-[#62b000] px-5 text-white shadow-md hover:bg-[#559b00]"><Link href="/ejercicios"><Plus className="mr-2 h-4 w-4"/>Nuevo ejercicio</Link></Button>
            </div>
          </header>

          <section className="my-5 flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#79c900] to-[#4d9c00] text-white shadow-lg"><Activity className="h-7 w-7"/></div>
              <div><h2 className="text-xl font-black uppercase text-[#4f9000]">{labels[grupo] || grupo}</h2><p className="text-sm font-medium">{description.subtitle}</p><p className="text-sm text-[#5ca800]">{description.phrase}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              <QuickFilter active={dificultad === "todos" && !onlyFavorites} icon={<Grid2X2 className="h-4 w-4"/>} label="Todos" count={counts.todos} onClick={() => { setDificultad("todos"); setOnlyFavorites(false); }}/>
              <QuickFilter active={dificultad === "principiante"} icon={<Target className="h-4 w-4"/>} label="Básico" count={counts.principiante} onClick={() => setDificultad("principiante")}/>
              <QuickFilter active={dificultad === "intermedio"} icon={<Dumbbell className="h-4 w-4"/>} label="Intermedio" count={counts.intermedio} onClick={() => setDificultad("intermedio")}/>
              <QuickFilter active={dificultad === "avanzado"} icon={<TrendingUp className="h-4 w-4"/>} label="Avanzado" count={counts.avanzado} onClick={() => setDificultad("avanzado")}/>
              <QuickFilter active={onlyFavorites} icon={<Star className="h-4 w-4"/>} label="Favoritos" count={favorites.filter((id) => groupItems.some((item) => item._id === id)).length} onClick={() => setOnlyFavorites((value) => !value)}/>
            </div>
          </section>

          {filterOpen ? (
            <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2">
              <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Grupo muscular</p><Select value={grupo} onValueChange={setGrupo}><SelectTrigger className="h-11"><SelectValue/></SelectTrigger><SelectContent>{grupos.map((value) => <SelectItem key={value} value={value}>{labels[value] || value}</SelectItem>)}</SelectContent></Select></div>
              <div><p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Nivel</p><Select value={dificultad} onValueChange={setDificultad}><SelectTrigger className="h-11"><SelectValue/></SelectTrigger><SelectContent>{dificultades.map((value) => <SelectItem key={value} value={value}>{labels[value] || value}</SelectItem>)}</SelectContent></Select></div>
            </div>
          ) : null}

          <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
            <section>
              {loading ? <div className="rounded-2xl border bg-white py-24 text-center text-slate-500">Cargando biblioteca visual...</div> : visibleItems.length ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleItems.map((item) => (
                    <ExerciseCard key={item._id} item={item} visualModel={visualModel} selected={selected?._id === item._id} favorite={favorites.includes(item._id)} onSelect={() => selectExercise(item)} onFavorite={() => toggleFavorite(item._id)}/>
                  ))}
                </div>
              ) : <div className="rounded-2xl border bg-white py-24 text-center"><Search className="mx-auto mb-3 h-8 w-8 text-slate-300"/><p className="font-bold">No hay ejercicios con estos filtros</p><p className="mt-1 text-sm text-slate-500">Prueba otro grupo, nivel o término de búsqueda.</p></div>}

              {totalPages > 1 ? (
                <div className="mt-5 flex items-center justify-center gap-2"><Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft className="h-4 w-4"/></Button>{Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 3), page + 2).map((value) => <Button key={value} size="icon" variant={value === page ? "default" : "outline"} className={value === page ? "bg-[#62b000] hover:bg-[#559b00]" : ""} onClick={() => setPage(value)}>{value}</Button>)}<Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight className="h-4 w-4"/></Button></div>
              ) : null}
            </section>

            <aside className="sticky top-5 hidden max-h-[calc(100vh-2.5rem)] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-lg xl:block">
              {selected ? <ExerciseDetail item={selected} visualModel={visualModel} favorite={favorites.includes(selected._id)} deleting={deletingExercise} onFavorite={() => toggleFavorite(selected._id)} onImageUploaded={updateExerciseImage} onDelete={() => deleteExercise(selected)}/> : <div className="p-10 text-center text-slate-500">Selecciona un ejercicio para ver su ficha.</div>}
            </aside>
          </div>

          <section className="mt-6 grid gap-3 md:grid-cols-3">
            <FooterTip icon={<Activity className="h-5 w-5"/>} title="Movilidad antes de carga">Prepara tus articulaciones y activa tu cuerpo. Mejora tu rendimiento y previene lesiones.</FooterTip>
            <FooterTip icon={<Target className="h-5 w-5"/>} title="Técnica antes que carga">Domina el movimiento, después aumenta el peso. La técnica es tu mejor aliado.</FooterTip>
            <FooterTip icon={<TrendingUp className="h-5 w-5"/>} title="Constancia + progreso">Pequeñas mejoras cada día, grandes resultados siempre.</FooterTip>
          </section>
        </div>

        <Dialog open={mobileDetailOpen} onOpenChange={setMobileDetailOpen}>
          <DialogContent className="max-h-[94vh] max-w-3xl overflow-y-auto p-0 xl:hidden">{selected ? <ExerciseDetail item={selected} visualModel={visualModel} favorite={favorites.includes(selected._id)} deleting={deletingExercise} onFavorite={() => toggleFavorite(selected._id)} onImageUploaded={updateExerciseImage} onDelete={() => deleteExercise(selected)}/> : null}</DialogContent>
        </Dialog>
      </div>
    </AppSidebar>
  );
}

function QuickFilter({ active, icon, label, count, onClick }: { active: boolean; icon: React.ReactNode; label: string; count: number; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex min-h-14 items-center gap-2 rounded-xl border px-3 text-left transition ${active ? "border-[#71b900] bg-[#f2f9e9] text-[#4f9000]" : "border-slate-200 bg-white hover:border-[#8bc83e]"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${active ? "bg-[#72b900] text-white" : "bg-[#eef4e6] text-[#559900]"}`}>{icon}</span><span><span className="block text-xs font-bold">{label}</span><span className="block text-[11px] text-slate-500">({count})</span></span></button>;
}

function ExerciseCard({ item, visualModel, selected, favorite, onSelect, onFavorite }: { item: Ejercicio; visualModel: ExerciseVisualModel; selected: boolean; favorite: boolean; onSelect: () => void; onFavorite: () => void }) {
  return (
    <article role="button" tabIndex={0} onClick={onSelect} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(); }} className={`group cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg ${selected ? "border-[#6bb300] ring-1 ring-[#6bb300]" : "border-slate-200"}`}>
      <div className="flex items-start justify-between p-3 pb-1"><div><p className="text-[11px] font-bold text-[#5ca800]">{item.codigo_interno || "CHE-EX"}</p><h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-black leading-5">{item.nombre}</h3><p className={`mt-1 text-[10px] font-black uppercase ${difficultyStyle(item.dificultad)}`}>{labels[item.dificultad] || item.dificultad}</p></div><button type="button" aria-label={favorite ? "Quitar de favoritos" : "Añadir a favoritos"} onClick={(event) => { event.stopPropagation(); onFavorite(); }} className="rounded-full p-1.5 text-slate-400 transition hover:bg-[#f1f7e9] hover:text-[#65ad00]"><Star className={`h-4 w-4 ${favorite ? "fill-[#72b900] text-[#62a900]" : ""}`}/></button></div>
      <div className="h-48 overflow-hidden bg-white p-2"><MediaHero item={item} visualModel={visualModel}/></div>
      <div className="flex items-center justify-between border-t border-slate-100 px-3 py-2.5"><span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-600"><PlayCircle className="h-4 w-4"/>Ver ejecución</span><Info className="h-4 w-4 text-slate-400"/></div>
    </article>
  );
}

function ExerciseDetail({ item, visualModel, favorite, deleting, onFavorite, onImageUploaded, onDelete }: { item: Ejercicio; visualModel: ExerciseVisualModel; favorite: boolean; deleting: boolean; onFavorite: () => void; onImageUploaded: (url: string) => void; onDelete: () => void }) {
  const errors = listFromText(item.errores_frecuentes);
  const tips = listFromText(item.consejos);
  const technique = listFromText(item.tecnica);
  const muscles = [labels[item.grupo_muscular] || item.grupo_muscular, item.grupo_secundario, ...(item.objetivos || [])].filter(Boolean).slice(0, 5);

  return (
    <div>
      <div className="flex items-start justify-between p-5 pb-3"><div><p className="text-xs font-bold text-[#5ca800]">{item.codigo_interno || "CHE-EX"}</p><h2 className="mt-1 text-2xl font-black leading-tight">{item.nombre}</h2><p className={`mt-1 text-xs font-black uppercase ${difficultyStyle(item.dificultad)}`}>{labels[item.dificultad] || item.dificultad}</p></div><button type="button" onClick={onFavorite} className="rounded-full p-2 text-[#65ad00] hover:bg-[#f1f7e9]" aria-label="Favorito"><Star className={`h-5 w-5 ${favorite ? "fill-[#72b900]" : ""}`}/></button></div>
      <div className="mx-5 h-64 overflow-hidden rounded-xl border border-slate-100 bg-[#fbfaf6] p-2"><MediaHero item={item} visualModel={visualModel}/></div>
      <div className="grid grid-cols-3 border-b border-slate-100 p-4 text-center text-[11px]"><Meta icon={<Activity className="h-4 w-4"/>} label="Grupo muscular" value={labels[item.grupo_muscular] || item.grupo_muscular}/><Meta icon={<Dumbbell className="h-4 w-4"/>} label="Material" value={item.material || "Ninguno"}/><Meta icon={<TrendingUp className="h-4 w-4"/>} label="Nivel" value={labels[item.dificultad] || item.dificultad}/></div>

      <div className="space-y-0 px-5">
        <DetailSection icon={<Target className="h-4 w-4 text-[#62a900]"/>} title="Claves técnicas"><BulletList items={technique.length ? technique : [item.descripcion || "Ficha técnica pendiente de completar."]} positive/></DetailSection>
        <DetailSection icon={<TriangleAlert className="h-4 w-4 text-red-500"/>} title="Errores frecuentes"><BulletList items={errors.length ? errors : ["Sin errores registrados."]}/></DetailSection>
        <DetailSection icon={<Lightbulb className="h-4 w-4 text-[#62a900]"/>} title="Consejos del entrenador"><BulletList items={tips.length ? tips : ["Prioriza siempre el control y la técnica."]} dot/></DetailSection>
        <DetailSection icon={<TrendingUp className="h-4 w-4 text-[#62a900]"/>} title="Progresión"><p className="text-xs leading-5 text-slate-600">{item.progresion || item.variante_avanzada || "Pendiente de definir."}</p></DetailSection>
        <DetailSection icon={<RotateCcw className="h-4 w-4 text-red-500"/>} title="Regresión"><p className="text-xs leading-5 text-slate-600">{item.regresion || item.variante_facil || "Pendiente de definir."}</p></DetailSection>
        <DetailSection icon={<Sparkles className="h-4 w-4 text-[#62a900]"/>} title="Músculos trabajados"><div className="flex flex-wrap gap-2">{muscles.map((muscle) => <span key={String(muscle)} className="rounded-full bg-[#eff7e7] px-2.5 py-1 text-[11px] font-semibold text-[#4f9000]">{muscle}</span>)}</div></DetailSection>
      </div>

      <div className="space-y-3 p-5 pt-4">
        {item.video_url ? <Button asChild variant="outline" className="w-full"><a href={item.video_url} target="_blank" rel="noreferrer"><PlayCircle className="mr-2 h-4 w-4"/>Ver vídeo explicativo</a></Button> : <div className="rounded-xl border border-dashed p-3 text-center text-xs text-slate-500">Vídeo Chetesaí pendiente de incorporar.</div>}
        <div className="rounded-xl border bg-[#f8faf6] p-3"><p className="mb-2 text-xs font-bold">Imagen del ejercicio</p><ExerciseMediaUploader kind="imagen" label="Imagen principal" exerciseName={item.nombre} exerciseId={item._id} value={item.imagen_url || null} onUploaded={onImageUploaded} compact/></div>
        <AssignExerciseToClient exerciseId={item._id} exerciseName={item.nombre}/>
        <Button variant="outline" onClick={onDelete} disabled={deleting} className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="mr-2 h-4 w-4"/>{deleting ? "Eliminando..." : "Eliminar ejercicio"}</Button>
      </div>
    </div>
  );
}

function Meta({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex min-w-0 flex-col items-center gap-1 border-r border-slate-100 px-2 last:border-r-0"><span className="text-[#5ca800]">{icon}</span><span className="text-[9px] text-slate-500">{label}</span><span className="max-w-full truncate font-bold">{value}</span></div>;
}

function DetailSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <section className="border-b border-slate-100 py-4 last:border-b-0"><div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide">{icon}<h3>{title}</h3></div>{children}</section>;
}

function BulletList({ items, positive = false, dot = false }: { items: string[]; positive?: boolean; dot?: boolean }) {
  return <ul className="space-y-1.5">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-xs leading-5 text-slate-600">{dot ? <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#70b700]"/> : positive ? <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#70b700]"/> : <CircleX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400"/>}<span>{item}</span></li>)}</ul>;
}

function FooterTip({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#edf6e3] text-[#5da600]">{icon}</div><div><h3 className="text-xs font-black uppercase">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{children}</p></div></div>;
}
