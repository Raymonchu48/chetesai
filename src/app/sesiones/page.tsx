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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Sesion {
  _id: string;
  titulo: string;
  cliente: string | { _id: string; nombre: string };
  fecha: string;
  duracion_minutos: number;
  tipo_sesion: string;
  estado_sesion: string;
  notas_sesion: string;
}

interface Cliente {
  _id: string;
  nombre: string;
}

const tipoLabels: Record<string, string> = {
  entrenamiento_personal: "Entrenamiento Personal",
  evaluacion_fisica: "Evaluacion Fisica",
  cardio: "Cardio",
  fuerza: "Fuerza",
  flexibilidad: "Flexibilidad",
  funcional: "Funcional",
};

const estadoColors: Record<string, string> = {
  programada: "bg-blue-100 text-blue-700",
  completada: "bg-emerald-100 text-emerald-700",
  cancelada: "bg-red-100 text-red-700",
  no_asistio: "bg-amber-100 text-amber-700",
};

const emptyForm = {
  titulo: "",
  cliente: "",
  fecha: "",
  duracion_minutos: 60,
  tipo_sesion: "entrenamiento_personal",
  estado_sesion: "programada",
  notas_sesion: "",
};

export default function SesionesPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      const [sesRes, cliRes] = await Promise.all([
        fetch("/api/sesiones"),
        fetch("/api/clientes"),
      ]);
      const sesJson = (await sesRes.json()) as { ok: boolean; data?: Sesion[] };
      const cliJson = (await cliRes.json()) as { ok: boolean; data?: Cliente[] };
      if (sesJson.ok && sesJson.data) setSesiones(sesJson.data);
      if (cliJson.ok && cliJson.data) setClientes(cliJson.data);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getClienteName = (cliente: string | { _id: string; nombre: string }) => {
    if (typeof cliente === "object" && cliente !== null) return cliente.nombre;
    const found = clientes.find((c) => c._id === cliente);
    return found?.nombre || "Sin asignar";
  };

  const handleSubmit = async () => {
    try {
      const url = editingId ? `/api/sesiones/${editingId}` : "/api/sesiones";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, duracion_minutos: Number(form.duracion_minutos) }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) {
        toast.success(editingId ? "Sesion actualizada" : "Sesion creada");
        setDialogOpen(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchData();
      } else {
        toast.error(json.error || "Error al guardar");
      }
    } catch (err) {
      console.error("Error saving session:", err);
      toast.error("Error al guardar sesion");
    }
  };

  const handleEdit = (s: Sesion) => {
    setEditingId(s._id);
    const clienteId = typeof s.cliente === "object" ? s.cliente?._id : s.cliente;
    setForm({
      titulo: s.titulo || "",
      cliente: clienteId || "",
      fecha: s.fecha ? new Date(s.fecha).toISOString().slice(0, 16) : "",
      duracion_minutos: s.duracion_minutos || 60,
      tipo_sesion: s.tipo_sesion || "entrenamiento_personal",
      estado_sesion: s.estado_sesion || "programada",
      notas_sesion: s.notas_sesion || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar esta sesion?")) return;
    try {
      const res = await fetch(`/api/sesiones/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok: boolean };
      if (json.ok) {
        toast.success("Sesion eliminada");
        fetchData();
      }
    } catch (err) {
      console.error("Error deleting session:", err);
      toast.error("Error al eliminar");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AppSidebar>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <CalendarDays className="w-8 h-8 text-primary" />
              Sesiones
            </h1>
            <p className="text-muted-foreground mt-1">
              {sesiones.length} sesiones registradas
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingId(null); setForm(emptyForm); }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Nueva Sesion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Sesion" : "Nueva Sesion"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Titulo *</Label>
                  <Input
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ej: Entrenamiento de piernas"
                  />
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Select
                    value={form.cliente}
                    onValueChange={(v) => setForm({ ...form, cliente: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c._id} value={c._id}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha y Hora</Label>
                    <Input
                      type="datetime-local"
                      value={form.fecha}
                      onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Duracion (min)</Label>
                    <Input
                      type="number"
                      value={form.duracion_minutos}
                      onChange={(e) => setForm({ ...form, duracion_minutos: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={form.tipo_sesion}
                      onValueChange={(v) => setForm({ ...form, tipo_sesion: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(tipoLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select
                      value={form.estado_sesion}
                      onValueChange={(v) => setForm({ ...form, estado_sesion: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="programada">Programada</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                        <SelectItem value="no_asistio">No Asistio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Notas</Label>
                  <Textarea
                    value={form.notas_sesion}
                    onChange={(e) => setForm({ ...form, notas_sesion: e.target.value })}
                    placeholder="Notas de la sesion..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? "Guardar Cambios" : "Crear Sesion"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando sesiones...</div>
            ) : sesiones.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No hay sesiones registradas</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titulo</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Duracion</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sesiones.map((s) => (
                    <TableRow key={s._id}>
                      <TableCell className="font-medium">{s.titulo}</TableCell>
                      <TableCell className="text-muted-foreground">{getClienteName(s.cliente)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(s.fecha)}</TableCell>
                      <TableCell>{s.duracion_minutos} min</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {tipoLabels[s.tipo_sesion] || s.tipo_sesion}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColors[s.estado_sesion] || "bg-gray-100 text-gray-700"}`}>
                          {s.estado_sesion?.replace("_", " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(s)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(s._id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppSidebar>
  );
}
