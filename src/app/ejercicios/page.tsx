"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dumbbell, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Ejercicio = {
  _id: string;
  nombre: string;
  grupo_muscular: string;
  grupo_secundario: string | null;
  categoria: string;
  dificultad: string;
  material: string | null;
  descripcion: string | null;
  tecnica: string | null;
  errores_frecuentes: string | null;
  consejos: string | null;
  imagen_url: string | null;
  video_url: string | null;
  activo: boolean;
};

type FormState = Omit<Ejercicio, "_id">;

const grupos = ["pecho", "espalda", "hombros", "biceps", "triceps", "piernas", "gluteos", "core", "cardio", "cuerpo_completo"];
const categorias = ["fuerza", "cardio", "movilidad", "estiramiento", "rehabilitacion", "tecnica"];
const dificultades = ["principiante", "intermedio", "avanzado"];

const labels: Record<string, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  biceps: "Bíceps",
  triceps: "Tríceps",
  piernas: "Piernas",
  gluteos: "Glúteos",
  core: "Core",
  cardio: "Cardio",
  cuerpo_completo: "Cuerpo completo",
  fuerza: "Fuerza",
  movilidad: "Movilidad",
  estiramiento: "Estiramiento",
  rehabilitacion: "Rehabilitación",
  tecnica: "Técnica",
  principiante: "Principiante",
  intermedio: "Intermedio",
  avanzado: "Avanzado",
};

const emptyForm: FormState = {
  nombre: "",
  grupo_muscular: "pecho",
  grupo_secundario: null,
  categoria: "fuerza",
  dificultad: "principiante",
  material: null,
  descripcion: null,
  tecnica: null,
  errores_frecuentes: null,
  consejos: null,
  imagen_url: null,
  video_url: null,
  activo: true,
};

export default function EjerciciosPage() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [search, setSearch] = useState("");
  const [grupo, setGrupo] = useState("todos");
  const [categoria, setCategoria] = useState("todos");
  const [dificultad, setDificultad] = useState("todos");
  const [material, setMaterial] = useState("todos");

  const fetchEjercicios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/ejercicios");
      const data = (await response.json()) as { ok: boolean; data?: Ejercicio[]; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo cargar la biblioteca");
      setEjercicios(data.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar ejercicios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEjercicios();
  }, [fetchEjercicios]);

  const materiales = useMemo(
    () => [...new Set(ejercicios.map((item) => item.material).filter(Boolean) as string[])].sort(),
    [ejercicios]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return ejercicios.filter((item) => {
      const matchSearch = !term || [item.nombre, item.descripcion, item.material]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
      return matchSearch
        && (grupo === "todos" || item.grupo_muscular === grupo)
        && (categoria === "todos" || item.categoria === categoria)
        && (dificultad === "todos" || item.dificultad === dificultad)
        && (material === "todos" || item.material === material);
    });
  }, [ejercicios, search, grupo, categoria, dificultad, material]);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(item: Ejercicio) {
    const { _id, ...values } = item;
    setEditingId(_id);
    setForm(values);
    setDialogOpen(true);
  }

  async function saveExercise() {
    try {
      const response = await fetch(editingId ? `/api/ejercicios/${editingId}` : "/api/ejercicios", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo guardar el ejercicio");
      toast.success(editingId ? "Ejercicio actualizado" : "Ejercicio creado");
      setDialogOpen(false);
      await fetchEjercicios();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    }
  }

  async function deleteExercise(id: string) {
    if (!window.confirm("¿Eliminar este ejercicio de la biblioteca?")) return;
    const response = await fetch(`/api/ejercicios/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !data.ok) {
      toast.error(data.error || "No se pudo eliminar");
      return;
    }
    toast.success("Ejercicio eliminado");
    await fetchEjercicios();
  }

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
              <Dumbbell className="h-8 w-8 text-primary" /> Biblioteca de ejercicios
            </h1>
            <p className="mt-1 text-muted-foreground">{ejercicios.length} ejercicios registrados · {filtered.length} visibles</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" />Nuevo ejercicio</Button></DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader><DialogTitle>{editingId ? "Editar ejercicio" : "Nuevo ejercicio"}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2 md:grid-cols-2">
                <Field label="Nombre *"><Input value={form.nombre} onChange={(e) => updateField("nombre", e.target.value)} /></Field>
                <Field label="Material"><Input value={form.material || ""} onChange={(e) => updateField("material", e.target.value || null)} placeholder="Mancuernas, barra, polea..." /></Field>
                <SelectField label="Grupo principal" value={form.grupo_muscular} values={grupos} onChange={(v) => updateField("grupo_muscular", v)} />
                <Field label="Grupo secundario"><Input value={form.grupo_secundario || ""} onChange={(e) => updateField("grupo_secundario", e.target.value || null)} /></Field>
                <SelectField label="Categoría" value={form.categoria} values={categorias} onChange={(v) => updateField("categoria", v)} />
                <SelectField label="Dificultad" value={form.dificultad} values={dificultades} onChange={(v) => updateField("dificultad", v)} />
                <Field label="Imagen URL"><Input value={form.imagen_url || ""} onChange={(e) => updateField("imagen_url", e.target.value || null)} /></Field>
                <Field label="Vídeo URL"><Input value={form.video_url || ""} onChange={(e) => updateField("video_url", e.target.value || null)} /></Field>
                <TextField label="Descripción" value={form.descripcion} onChange={(v) => updateField("descripcion", v)} />
                <TextField label="Técnica de ejecución" value={form.tecnica} onChange={(v) => updateField("tecnica", v)} />
                <TextField label="Errores frecuentes" value={form.errores_frecuentes} onChange={(v) => updateField("errores_frecuentes", v)} />
                <TextField label="Consejos del entrenador" value={form.consejos} onChange={(v) => updateField("consejos", v)} />
              </div>
              <Button className="w-full" onClick={saveExercise}>{editingId ? "Guardar cambios" : "Crear ejercicio"}</Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre, descripción o material" /></div>
          <Filter value={grupo} values={grupos} allLabel="Todos los grupos" onChange={setGrupo} />
          <Filter value={categoria} values={categorias} allLabel="Todas las categorías" onChange={setCategoria} />
          <Filter value={dificultad} values={dificultades} allLabel="Todas las dificultades" onChange={setDificultad} />
          <Filter value={material} values={materiales} allLabel="Todos los materiales" onChange={setMaterial} />
        </div>

        {loading ? <p className="py-12 text-center text-muted-foreground">Cargando biblioteca...</p> : filtered.length === 0 ? <p className="py-12 text-center text-muted-foreground">No hay ejercicios con esos filtros.</p> : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <Card key={item._id} className="overflow-hidden transition-shadow hover:shadow-md">
                {item.imagen_url ? <img src={item.imagen_url} alt={item.nombre} className="h-44 w-full object-cover" /> : null}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div><h2 className="text-lg font-bold">{item.nombre}</h2><p className="text-sm text-muted-foreground">{labels[item.grupo_muscular] || item.grupo_muscular} · {labels[item.categoria] || item.categoria}</p></div>
                    <div className="flex"><Button variant="ghost" size="icon" onClick={() => openEdit(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteExercise(item._id)}><Trash2 className="h-4 w-4" /></Button></div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-primary">{labels[item.dificultad] || item.dificultad}</span>{item.material ? <span className="rounded-full bg-muted px-2.5 py-1">{item.material}</span> : null}</div>
                  {item.descripcion ? <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{item.descripcion}</p> : null}
                  {item.video_url ? <a className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary" href={item.video_url} target="_blank" rel="noreferrer">Ver demostración <ExternalLink className="h-3.5 w-3.5" /></a> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppSidebar>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}

function TextField({ label, value, onChange }: { label: string; value: string | null; onChange: (value: string | null) => void }) {
  return <Field label={label}><Textarea rows={4} value={value || ""} onChange={(e) => onChange(e.target.value || null)} /></Field>;
}

function SelectField({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return <Field label={label}><Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{values.map((item) => <SelectItem key={item} value={item}>{labels[item] || item}</SelectItem>)}</SelectContent></Select></Field>;
}

function Filter({ value, values, allLabel, onChange }: { value: string; values: string[]; allLabel: string; onChange: (value: string) => void }) {
  return <Select value={value} onValueChange={onChange}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">{allLabel}</SelectItem>{values.map((item) => <SelectItem key={item} value={item}>{labels[item] || item}</SelectItem>)}</SelectContent></Select>;
}
