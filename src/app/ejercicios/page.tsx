"use client";

import { useEffect, useState, useCallback } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Dumbbell, Pencil, Trash2, Search, Play } from "lucide-react";
import { toast } from "sonner";

interface Ejercicio {
  _id: string;
  nombre: string;
  grupo_muscular: string;
  dificultad: string;
  descripcion: string;
  video_url: string;
}

const grupoLabels: Record<string, string> = {
  pecho: "Pecho",
  espalda: "Espalda",
  hombros: "Hombros",
  biceps: "Biceps",
  triceps: "Triceps",
  piernas: "Piernas",
  abdominales: "Abdominales",
  gluteos: "Gluteos",
  cardio: "Cardio",
  cuerpo_completo: "Cuerpo Completo",
};

const grupoColors: Record<string, string> = {
  pecho: "bg-red-100 text-red-700",
  espalda: "bg-blue-100 text-blue-700",
  hombros: "bg-orange-100 text-orange-700",
  biceps: "bg-violet-100 text-violet-700",
  triceps: "bg-cyan-100 text-cyan-700",
  piernas: "bg-emerald-100 text-emerald-700",
  abdominales: "bg-amber-100 text-amber-700",
  gluteos: "bg-pink-100 text-pink-700",
  cardio: "bg-teal-100 text-teal-700",
  cuerpo_completo: "bg-indigo-100 text-indigo-700",
};

const dificultadColors: Record<string, string> = {
  principiante: "bg-emerald-100 text-emerald-700",
  intermedio: "bg-amber-100 text-amber-700",
  avanzado: "bg-red-100 text-red-700",
};

const emptyForm = {
  nombre: "",
  grupo_muscular: "pecho",
  dificultad: "principiante",
  descripcion: "",
  video_url: "",
};

export default function EjerciciosPage() {
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterGrupo, setFilterGrupo] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchEjercicios = useCallback(async () => {
    try {
      const res = await fetch("/api/ejercicios");
      const json = (await res.json()) as { ok: boolean; data?: Ejercicio[] };
      if (json.ok && json.data) {
        setEjercicios(json.data);
      }
    } catch (err) {
      console.error("Error fetching ejercicios:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEjercicios();
  }, [fetchEjercicios]);

  const handleSubmit = async () => {
    try {
      const url = editingId ? `/api/ejercicios/${editingId}` : "/api/ejercicios";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) {
        toast.success(editingId ? "Ejercicio actualizado" : "Ejercicio creado");
        setDialogOpen(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchEjercicios();
      } else {
        toast.error(json.error || "Error al guardar");
      }
    } catch (err) {
      console.error("Error saving exercise:", err);
      toast.error("Error al guardar ejercicio");
    }
  };

  const handleEdit = (e: Ejercicio) => {
    setEditingId(e._id);
    setForm({
      nombre: e.nombre || "",
      grupo_muscular: e.grupo_muscular || "pecho",
      dificultad: e.dificultad || "principiante",
      descripcion: e.descripcion || "",
      video_url: e.video_url || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este ejercicio?")) return;
    try {
      const res = await fetch(`/api/ejercicios/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok: boolean };
      if (json.ok) {
        toast.success("Ejercicio eliminado");
        fetchEjercicios();
      }
    } catch (err) {
      console.error("Error deleting exercise:", err);
      toast.error("Error al eliminar");
    }
  };

  const filtered = ejercicios.filter((e) => {
    const matchSearch = e.nombre?.toLowerCase().includes(search.toLowerCase());
    const matchGrupo = filterGrupo === "todos" || e.grupo_muscular === filterGrupo;
    return matchSearch && matchGrupo;
  });

  return (
    <AppSidebar>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <Dumbbell className="w-8 h-8 text-primary" />
              Ejercicios
            </h1>
            <p className="text-muted-foreground mt-1">
              {ejercicios.length} ejercicios en la biblioteca
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingId(null); setForm(emptyForm); }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Nuevo Ejercicio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Ejercicio" : "Nuevo Ejercicio"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Ej: Press de banca"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Grupo Muscular</Label>
                    <Select
                      value={form.grupo_muscular}
                      onValueChange={(v) => setForm({ ...form, grupo_muscular: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(grupoLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Dificultad</Label>
                    <Select
                      value={form.dificultad}
                      onValueChange={(v) => setForm({ ...form, dificultad: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="principiante">Principiante</SelectItem>
                        <SelectItem value="intermedio">Intermedio</SelectItem>
                        <SelectItem value="avanzado">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Descripcion</Label>
                  <Textarea
                    value={form.descripcion}
                    onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                    placeholder="Instrucciones y descripcion del ejercicio..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label>Video YouTube (URL)</Label>
                  <Input
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? "Guardar Cambios" : "Crear Ejercicio"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar ejercicio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterGrupo} onValueChange={setFilterGrupo}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los grupos</SelectItem>
              {Object.entries(grupoLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6"><div className="h-24 bg-muted rounded-lg" /></CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {search || filterGrupo !== "todos" ? "No se encontraron ejercicios con esos filtros" : "No hay ejercicios en la biblioteca"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((e) => (
              <Card key={e._id} className="group hover:shadow-md hover:border-primary/30 transition-all duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-foreground text-lg leading-tight">{e.nombre}</h3>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(e)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(e._id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${grupoColors[e.grupo_muscular] || "bg-gray-100 text-gray-700"}`}>
                      {grupoLabels[e.grupo_muscular] || e.grupo_muscular}
                    </span>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${dificultadColors[e.dificultad] || "bg-gray-100 text-gray-700"}`}>
                      {e.dificultad}
                    </span>
                  </div>

                  {e.descripcion && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{e.descripcion}</p>
                  )}

                  {e.video_url && (
                    <a
                      href={e.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <Play className="w-4 h-4 fill-red-600" />
                      Ver Video en YouTube
                    </a>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppSidebar>
  );
}
