"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Dumbbell, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  activa: boolean;
  es_plantilla: boolean;
};

type FormState = Omit<Rutina, "_id">;

const objetivos = ["bienestar_general", "hipertrofia", "fuerza", "perdida_grasa", "movilidad", "rehabilitacion", "rendimiento"];
const niveles = ["principiante", "intermedio", "avanzado"];
const labels: Record<string, string> = {
  bienestar_general: "Bienestar general", hipertrofia: "Hipertrofia", fuerza: "Fuerza",
  perdida_grasa: "Pérdida de grasa", movilidad: "Movilidad", rehabilitacion: "Rehabilitación",
  rendimiento: "Rendimiento", principiante: "Principiante", intermedio: "Intermedio", avanzado: "Avanzado",
};

const emptyForm: FormState = {
  nombre: "", descripcion: null, objetivo: "bienestar_general", nivel: "principiante",
  dias_semana: 3, duracion_semanas: 8, duracion_sesion_minutos: 60, activa: true, es_plantilla: true,
};

export default function RutinasPage() {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [objectiveFilter, setObjectiveFilter] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rutinas");
      const data = (await response.json()) as { ok: boolean; data?: Rutina[]; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudieron cargar las rutinas");
      setRutinas(data.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar rutinas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rutinas.filter((item) => {
      const matchesText = !term || [item.nombre, item.descripcion, labels[item.objetivo]].filter(Boolean).some((value) => String(value).toLowerCase().includes(term));
      return matchesText && (objectiveFilter === "todos" || item.objetivo === objectiveFilter);
    });
  }, [rutinas, search, objectiveFilter]);

  function openCreate() { setEditingId(null); setForm(emptyForm); setDialogOpen(true); }
  function openEdit(item: Rutina) { const { _id, ...values } = item; setEditingId(_id); setForm(values); setDialogOpen(true); }

  async function save() {
    try {
      const response = await fetch(editingId ? `/api/rutinas/${editingId}` : "/api/rutinas", {
        method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo guardar la rutina");
      toast.success(editingId ? "Rutina actualizada" : "Rutina creada");
      setDialogOpen(false);
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Error al guardar"); }
  }

  async function duplicate(id: string) {
    try {
      const response = await fetch(`/api/rutinas/${id}`, { method: "POST" });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo duplicar");
      toast.success("Rutina y ejercicios duplicados");
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Error al duplicar"); }
  }

  async function deactivate(id: string) {
    if (!window.confirm("¿Desactivar esta rutina?")) return;
    try {
      const response = await fetch(`/api/rutinas/${id}`, { method: "DELETE" });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo desactivar");
      toast.success("Rutina desactivada");
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Error al desactivar"); }
  }

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><Dumbbell className="h-8 w-8 text-primary" /> Rutinas</h1><p className="mt-1 text-muted-foreground">{rutinas.length} rutinas registradas</p></div>
          <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nueva rutina</Button>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="relative md:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar rutina..." /></div>
          <Select value={objectiveFilter} onValueChange={setObjectiveFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos los objetivos</SelectItem>{objetivos.map((item) => <SelectItem key={item} value={item}>{labels[item]}</SelectItem>)}</SelectContent></Select>
        </div>

        {loading ? <p className="py-12 text-center text-muted-foreground">Cargando rutinas...</p> : visible.length === 0 ? <p className="py-12 text-center text-muted-foreground">No hay rutinas con esos filtros.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((item) => (
              <Card key={item._id} className="transition-shadow hover:shadow-md"><CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-lg font-bold">{item.nombre}</h2><p className="text-sm text-muted-foreground">{labels[item.objetivo]} · {labels[item.nivel]}</p></div>
                  <div className="flex"><Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => duplicate(item._id)}><Copy className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deactivate(item._id)}><Trash2 className="h-4 w-4" /></Button></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{item.dias_semana} días/semana</span>{item.duracion_semanas ? <span className="rounded-full bg-muted px-2.5 py-1">{item.duracion_semanas} semanas</span> : null}{item.duracion_sesion_minutos ? <span className="rounded-full bg-muted px-2.5 py-1">{item.duracion_sesion_minutos} min</span> : null}</div>
                {item.descripcion ? <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{item.descripcion}</p> : null}
                <Button asChild className="mt-5 w-full"><Link href={`/rutinas/${item._id}`}>Abrir editor <ExternalLink className="ml-2 h-4 w-4" /></Link></Button>
              </CardContent></Card>
            ))}
          </div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editingId ? "Editar rutina" : "Nueva rutina"}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <Field label="Nombre *"><Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></Field>
            <Field label="Objetivo"><Select value={form.objetivo} onValueChange={(value) => setForm({ ...form, objetivo: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{objetivos.map((item) => <SelectItem key={item} value={item}>{labels[item]}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Nivel"><Select value={form.nivel} onValueChange={(value) => setForm({ ...form, nivel: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{niveles.map((item) => <SelectItem key={item} value={item}>{labels[item]}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Días por semana"><Input type="number" min={1} max={7} value={form.dias_semana} onChange={(e) => setForm({ ...form, dias_semana: Number(e.target.value) })} /></Field>
            <Field label="Duración (semanas)"><Input type="number" min={1} max={104} value={form.duracion_semanas ?? ""} onChange={(e) => setForm({ ...form, duracion_semanas: e.target.value ? Number(e.target.value) : null })} /></Field>
            <Field label="Sesión (minutos)"><Input type="number" min={5} max={360} value={form.duracion_sesion_minutos ?? ""} onChange={(e) => setForm({ ...form, duracion_sesion_minutos: e.target.value ? Number(e.target.value) : null })} /></Field>
            <div className="md:col-span-2"><Field label="Descripción"><Textarea rows={4} value={form.descripcion ?? ""} onChange={(e) => setForm({ ...form, descripcion: e.target.value || null })} /></Field></div>
          </div><Button className="w-full" onClick={save}>{editingId ? "Guardar cambios" : "Crear rutina"}</Button>
        </DialogContent></Dialog>
      </div>
    </AppSidebar>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
