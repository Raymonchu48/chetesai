"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Dumbbell, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Rutina = {
  _id: string;
  nombre: string;
  descripcion: string | null;
  objetivo: string;
  nivel: string;
  dias_semana: number;
  duracion_semanas: number | null;
  duracion_sesion_minutos: number | null;
};

type EjercicioBiblioteca = {
  _id: string;
  nombre: string;
  grupo_muscular: string;
  material: string | null;
  imagen_url: string | null;
};

type RutinaEjercicio = {
  _id: string;
  ejercicio_id: string;
  dia: number;
  bloque: string | null;
  orden: number;
  series: number;
  repeticiones: string;
  peso_kg: number | null;
  descanso_segundos: number;
  tempo: string | null;
  rpe: number | null;
  rir: number | null;
  duracion_segundos: number | null;
  distancia_metros: number | null;
  observaciones: string | null;
  notas_entrenador: string | null;
  instrucciones_cliente: string | null;
  tipo_serie: string;
  rol_ejercicio: string;
  vueltas: number | null;
  descanso_entre_vueltas: number | null;
  series_calentamiento: number;
  porcentaje_descarga: number | null;
  pausas_rest_pause: number | null;
  visible_cliente: boolean;
  ejercicios?: {
    id: string;
    nombre: string;
    grupo_muscular: string;
    material: string | null;
    imagen_url: string | null;
    miniatura_url: string | null;
    gif_url: string | null;
  };
};

const dayLabels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const typeLabels: Record<string, string> = {
  normal: "Serie normal",
  superserie: "Superserie",
  triserie: "Triserie",
  circuito: "Circuito",
  dropset: "Dropset",
  rest_pause: "Rest-pause",
  calentamiento: "Calentamiento",
};
const roleLabels: Record<string, string> = {
  principal: "Principal",
  accesorio: "Accesorio",
  activacion: "Activación",
  tecnica: "Técnica",
  movilidad: "Movilidad",
  finisher: "Finisher",
};

const emptyConfig = {
  dia: 1,
  bloque: "",
  orden: 1,
  series: 3,
  repeticiones: "10",
  peso_kg: null as number | null,
  descanso_segundos: 60,
  tempo: "",
  rpe: null as number | null,
  rir: null as number | null,
  duracion_segundos: null as number | null,
  distancia_metros: null as number | null,
  observaciones: "",
  notas_entrenador: "",
  instrucciones_cliente: "",
  tipo_serie: "normal",
  rol_ejercicio: "principal",
  vueltas: null as number | null,
  descanso_entre_vueltas: null as number | null,
  series_calentamiento: 0,
  porcentaje_descarga: null as number | null,
  pausas_rest_pause: null as number | null,
  visible_cliente: true,
};

export default function RoutineEditorPage() {
  const params = useParams<{ id: string }>();
  const routineId = params.id;
  const [rutina, setRutina] = useState<Rutina | null>(null);
  const [items, setItems] = useState<RutinaEjercicio[]>([]);
  const [library, setLibrary] = useState<EjercicioBiblioteca[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<EjercicioBiblioteca | null>(null);
  const [editingItem, setEditingItem] = useState<RutinaEjercicio | null>(null);
  const [config, setConfig] = useState(emptyConfig);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setLibraryError(null);
    try {
      const [routineResponse, exercisesResponse] = await Promise.all([
        fetch(`/api/rutinas/${routineId}`),
        fetch(`/api/rutinas/${routineId}/ejercicios`),
      ]);
      const routineData = (await routineResponse.json()) as { ok: boolean; data?: Rutina; error?: string };
      const exercisesData = (await exercisesResponse.json()) as { ok: boolean; data?: RutinaEjercicio[]; error?: string };
      if (!routineResponse.ok || !routineData.ok) throw new Error(routineData.error || "No se pudo cargar la rutina");
      if (!exercisesResponse.ok || !exercisesData.ok) throw new Error(exercisesData.error || "No se pudo cargar el plan");
      setRutina(routineData.data || null);
      setItems(exercisesData.data || []);

      const libraryResponse = await fetch("/api/rutinas/biblioteca");
      const libraryData = (await libraryResponse.json()) as { ok: boolean; data?: EjercicioBiblioteca[]; error?: string };
      if (!libraryResponse.ok || !libraryData.ok) {
        setLibrary([]);
        setLibraryError(libraryData.error || "No se pudo cargar la biblioteca");
      } else {
        setLibrary(libraryData.data || []);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al cargar el editor";
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [routineId]);

  useEffect(() => { load(); }, [load]);

  const days = useMemo(() => Array.from({ length: rutina?.dias_semana || 1 }, (_, index) => index + 1), [rutina]);
  const dayItems = useMemo(() => items.filter((item) => item.dia === selectedDay).sort((a, b) => a.orden - b.orden), [items, selectedDay]);
  const visibleLibrary = useMemo(() => {
    const term = search.trim().toLowerCase();
    return library.filter((item) => !term || [item.nombre, item.grupo_muscular, item.material].filter(Boolean).some((value) => String(value).toLowerCase().includes(term)));
  }, [library, search]);

  function openAdd(exercise: EjercicioBiblioteca) {
    setSelectedExercise(exercise);
    setEditingItem(null);
    setConfig({ ...emptyConfig, dia: selectedDay });
    setLibraryOpen(false);
    setConfigOpen(true);
  }

  function openEdit(item: RutinaEjercicio) {
    setEditingItem(item);
    setSelectedExercise(null);
    setConfig({
      dia: item.dia,
      bloque: item.bloque || "",
      orden: item.orden,
      series: item.series,
      repeticiones: item.repeticiones,
      peso_kg: item.peso_kg,
      descanso_segundos: item.descanso_segundos,
      tempo: item.tempo || "",
      rpe: item.rpe,
      rir: item.rir,
      duracion_segundos: item.duracion_segundos,
      distancia_metros: item.distancia_metros,
      observaciones: item.observaciones || "",
      notas_entrenador: item.notas_entrenador || "",
      instrucciones_cliente: item.instrucciones_cliente || "",
      tipo_serie: item.tipo_serie || "normal",
      rol_ejercicio: item.rol_ejercicio || "principal",
      vueltas: item.vueltas,
      descanso_entre_vueltas: item.descanso_entre_vueltas,
      series_calentamiento: item.series_calentamiento || 0,
      porcentaje_descarga: item.porcentaje_descarga,
      pausas_rest_pause: item.pausas_rest_pause,
      visible_cliente: item.visible_cliente !== false,
    });
    setConfigOpen(true);
  }

  async function saveExercise() {
    try {
      const url = editingItem ? `/api/rutina-ejercicios/${editingItem._id}` : `/api/rutinas/${routineId}/ejercicios`;
      const response = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, ejercicio_id: selectedExercise?._id }),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo guardar el ejercicio");
      toast.success(editingItem ? "Ejercicio actualizado" : "Ejercicio añadido");
      setConfigOpen(false);
      setSelectedDay(config.dia);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  }

  async function duplicateExercise(id: string) {
    try {
      const response = await fetch(`/api/rutina-ejercicios/${id}`, { method: "POST" });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo duplicar");
      toast.success("Ejercicio duplicado");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al duplicar");
    }
  }

  async function removeExercise(id: string) {
    if (!window.confirm("¿Eliminar este ejercicio de la rutina?")) return;
    try {
      const response = await fetch(`/api/rutina-ejercicios/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo eliminar");
      toast.success("Ejercicio eliminado");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
    }
  }

  async function move(item: RutinaEjercicio, direction: -1 | 1) {
    const index = dayItems.findIndex((row) => row._id === item._id);
    const target = dayItems[index + direction];
    if (!target) return;
    try {
      await Promise.all([
        fetch(`/api/rutina-ejercicios/${item._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, orden: target.orden }) }),
        fetch(`/api/rutina-ejercicios/${target._id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...target, orden: item.orden }) }),
      ]);
      await load();
    } catch {
      toast.error("No se pudo reordenar");
    }
  }

  if (loading) return <AppSidebar><p className="p-10 text-center text-muted-foreground">Cargando editor...</p></AppSidebar>;
  if (loadError) return <AppSidebar><div className="mx-auto max-w-2xl p-10 text-center"><h1 className="text-xl font-bold">No se pudo cargar el editor</h1><p className="mt-3 text-muted-foreground">{loadError}</p><Button className="mt-5" onClick={load}>Reintentar</Button></div></AppSidebar>;
  if (!rutina) return <AppSidebar><p className="p-10 text-center text-muted-foreground">Rutina no encontrada.</p></AppSidebar>;

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href="/rutinas" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Volver a rutinas</Link>
            <h1 className="text-3xl font-bold tracking-tight">{rutina.nombre}</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">{rutina.descripcion || "Organiza los ejercicios, parámetros y días de entrenamiento."}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">{rutina.dias_semana} días/semana</span>
              <span className="rounded-full bg-muted px-3 py-1">{rutina.nivel}</span>
              {rutina.duracion_sesion_minutos ? <span className="rounded-full bg-muted px-3 py-1">{rutina.duracion_sesion_minutos} min</span> : null}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>Vista cliente</Button>
            <Button onClick={() => setLibraryOpen(true)}><Plus className="mr-2 h-4 w-4" />Añadir ejercicio</Button>
          </div>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {days.map((day) => <Button key={day} variant={selectedDay === day ? "default" : "outline"} onClick={() => setSelectedDay(day)}>Día {day} · {dayLabels[day - 1]}</Button>)}
        </div>

        {dayItems.length === 0 ? (
          <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center py-16 text-center"><Dumbbell className="mb-4 h-10 w-10 text-muted-foreground" /><h2 className="text-lg font-semibold">Este día todavía está vacío</h2><p className="mt-2 text-sm text-muted-foreground">Añade ejercicios desde la biblioteca profesional.</p><Button className="mt-5" onClick={() => setLibraryOpen(true)}><Plus className="mr-2 h-4 w-4" />Añadir primer ejercicio</Button></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {dayItems.map((item, index) => {
              const media = item.ejercicios?.miniatura_url || item.ejercicios?.imagen_url || item.ejercicios?.gif_url;
              return <Card key={item._id}><CardContent className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  {media ? <img src={media} alt={item.ejercicios?.nombre || "Ejercicio"} className="h-20 w-24 rounded-lg object-cover" /> : <div className="grid h-20 w-24 place-items-center rounded-lg bg-muted"><Dumbbell className="h-6 w-6 text-muted-foreground" /></div>}
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wider">
                      <span className="text-primary">Ejercicio {index + 1}{item.bloque ? ` · ${item.bloque}` : ""}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5">{typeLabels[item.tipo_serie] || item.tipo_serie}</span>
                      <span className="rounded-full bg-muted px-2 py-0.5">{roleLabels[item.rol_ejercicio] || item.rol_ejercicio}</span>
                      {!item.visible_cliente ? <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-destructive">Oculto al cliente</span> : null}
                    </div>
                    <h3 className="truncate text-lg font-bold">{item.ejercicios?.nombre || "Ejercicio"}</h3>
                    <p className="text-sm text-muted-foreground">{item.ejercicios?.grupo_muscular}{item.ejercicios?.material ? ` · ${item.ejercicios.material}` : ""}</p>
                    {item.instrucciones_cliente ? <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">Cliente: {item.instrucciones_cliente}</p> : null}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm sm:grid-cols-6">
                  <Metric label="Series" value={String(item.series)} /><Metric label="Reps" value={item.repeticiones} /><Metric label="Descanso" value={`${item.descanso_segundos}s`} /><Metric label="Tempo" value={item.tempo || "—"} /><Metric label="RPE" value={item.rpe?.toString() || "—"} /><Metric label="RIR" value={item.rir?.toString() || "—"} />
                </div>
                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => move(item, -1)} title="Subir"><ArrowUp className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" disabled={index === dayItems.length - 1} onClick={() => move(item, 1)} title="Bajar"><ArrowDown className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => duplicateExercise(item._id)} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeExercise(item._id)} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent></Card>;
            })}
          </div>
        )}

        <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
          <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
            <DialogHeader><DialogTitle>Biblioteca de ejercicios</DialogTitle></DialogHeader>
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, músculo o material..." /></div>
            {libraryError ? <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{libraryError}</div> : null}
            {!libraryError && visibleLibrary.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No hay ejercicios que coincidan con la búsqueda.</p> : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleLibrary.map((exercise) => <button key={exercise._id} type="button" onClick={() => openAdd(exercise)} className="rounded-xl border p-4 text-left transition hover:border-primary hover:bg-primary/5"><h3 className="font-bold">{exercise.nombre}</h3><p className="mt-1 text-sm text-muted-foreground">{exercise.grupo_muscular}{exercise.material ? ` · ${exercise.material}` : ""}</p></button>)}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={configOpen} onOpenChange={setConfigOpen}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader><DialogTitle>{editingItem ? `Configurar ${editingItem.ejercicios?.nombre || "ejercicio"}` : `Añadir ${selectedExercise?.nombre || "ejercicio"}`}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2 md:grid-cols-3">
              <Field label="Día"><Select value={String(config.dia)} onValueChange={(value) => setConfig({ ...config, dia: Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{days.map((day) => <SelectItem key={day} value={String(day)}>Día {day} · {dayLabels[day - 1]}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Tipo de serie"><Select value={config.tipo_serie} onValueChange={(value) => setConfig({ ...config, tipo_serie: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(typeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Rol del ejercicio"><Select value={config.rol_ejercicio} onValueChange={(value) => setConfig({ ...config, rol_ejercicio: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(roleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></Field>
              <Field label="Bloque"><Input value={config.bloque} onChange={(event) => setConfig({ ...config, bloque: event.target.value })} placeholder="A, B, Superserie..." /></Field>
              <Field label="Series"><Input type="number" min={1} max={30} value={config.series} onChange={(event) => setConfig({ ...config, series: Number(event.target.value) })} /></Field>
              <Field label="Repeticiones"><Input value={config.repeticiones} onChange={(event) => setConfig({ ...config, repeticiones: event.target.value })} placeholder="10, 8-12, al fallo..." /></Field>
              <Field label="Peso inicial (kg)"><Input type="number" min={0} step="0.5" value={config.peso_kg ?? ""} onChange={(event) => setConfig({ ...config, peso_kg: event.target.value ? Number(event.target.value) : null })} /></Field>
              <Field label="Descanso (segundos)"><Input type="number" min={0} max={3600} value={config.descanso_segundos} onChange={(event) => setConfig({ ...config, descanso_segundos: Number(event.target.value) })} /></Field>
              <Field label="Tempo"><Input value={config.tempo} onChange={(event) => setConfig({ ...config, tempo: event.target.value })} placeholder="3-1-1" /></Field>
              <Field label="RPE"><Input type="number" min={1} max={10} step="0.5" value={config.rpe ?? ""} onChange={(event) => setConfig({ ...config, rpe: event.target.value ? Number(event.target.value) : null })} /></Field>
              <Field label="RIR"><Input type="number" min={0} max={10} value={config.rir ?? ""} onChange={(event) => setConfig({ ...config, rir: event.target.value ? Number(event.target.value) : null })} /></Field>
              <Field label="Series calentamiento"><Input type="number" min={0} max={10} value={config.series_calentamiento} onChange={(event) => setConfig({ ...config, series_calentamiento: Number(event.target.value) })} /></Field>
              <Field label="Vueltas"><Input type="number" min={1} max={20} value={config.vueltas ?? ""} onChange={(event) => setConfig({ ...config, vueltas: event.target.value ? Number(event.target.value) : null })} /></Field>
              <Field label="Descanso entre vueltas"><Input type="number" min={0} value={config.descanso_entre_vueltas ?? ""} onChange={(event) => setConfig({ ...config, descanso_entre_vueltas: event.target.value ? Number(event.target.value) : null })} /></Field>
              <Field label="Descarga (%)"><Input type="number" min={0} max={100} value={config.porcentaje_descarga ?? ""} onChange={(event) => setConfig({ ...config, porcentaje_descarga: event.target.value ? Number(event.target.value) : null })} /></Field>
              <Field label="Pausas rest-pause"><Input type="number" min={1} max={10} value={config.pausas_rest_pause ?? ""} onChange={(event) => setConfig({ ...config, pausas_rest_pause: event.target.value ? Number(event.target.value) : null })} /></Field>
              <Field label="Duración (segundos)"><Input type="number" min={1} value={config.duracion_segundos ?? ""} onChange={(event) => setConfig({ ...config, duracion_segundos: event.target.value ? Number(event.target.value) : null })} /></Field>
              <Field label="Distancia (metros)"><Input type="number" min={0} value={config.distancia_metros ?? ""} onChange={(event) => setConfig({ ...config, distancia_metros: event.target.value ? Number(event.target.value) : null })} /></Field>
              <div className="flex items-end pb-2"><label className="flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={config.visible_cliente} onChange={(event) => setConfig({ ...config, visible_cliente: event.target.checked })} className="h-4 w-4" />Visible para el cliente</label></div>
              <div className="md:col-span-3"><Field label="Observaciones generales"><Textarea rows={2} value={config.observaciones} onChange={(event) => setConfig({ ...config, observaciones: event.target.value })} placeholder="Adaptaciones o información general..." /></Field></div>
              <div className="md:col-span-3"><Field label="Notas privadas del entrenador"><Textarea rows={3} value={config.notas_entrenador} onChange={(event) => setConfig({ ...config, notas_entrenador: event.target.value })} placeholder="Solo visibles en el panel profesional." /></Field></div>
              <div className="md:col-span-3"><Field label="Instrucciones para el cliente"><Textarea rows={3} value={config.instrucciones_cliente} onChange={(event) => setConfig({ ...config, instrucciones_cliente: event.target.value })} placeholder="Indicaciones técnicas que verá el cliente." /></Field></div>
            </div>
            <Button className="w-full" onClick={saveExercise}>{editingItem ? "Guardar configuración" : "Añadir a la rutina"}</Button>
          </DialogContent>
        </Dialog>

        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader><DialogTitle>Vista del cliente · Día {selectedDay}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              {dayItems.filter((item) => item.visible_cliente !== false).map((item, index) => <Card key={item._id}><CardContent className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">{index + 1}. {typeLabels[item.tipo_serie] || "Serie normal"}</p>
                <h3 className="mt-1 text-lg font-bold">{item.ejercicios?.nombre || "Ejercicio"}</h3>
                <p className="text-sm text-muted-foreground">{item.series} series · {item.repeticiones} repeticiones · {item.descanso_segundos}s descanso</p>
                {item.tempo ? <p className="mt-1 text-sm">Tempo: {item.tempo}</p> : null}
                {item.instrucciones_cliente ? <div className="mt-3 rounded-lg bg-muted p-3 text-sm">{item.instrucciones_cliente}</div> : null}
              </CardContent></Card>)}
              {dayItems.filter((item) => item.visible_cliente !== false).length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No hay ejercicios visibles para el cliente en este día.</p> : null}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppSidebar>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-muted px-3 py-2"><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p><p className="font-semibold">{value}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
