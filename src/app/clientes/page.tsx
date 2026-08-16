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
import { Copy, KeyRound, Pencil, Plus, Search, ShieldCheck, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface Cliente {
  _id: string;
  nombre: string;
  email: string;
  telefono: string;
  fecha_nacimiento: string;
  objetivo: string;
  estado: string;
  fecha_alta: string;
  notas: string;
}

type AccessCredentials = {
  email: string;
  temporaryPassword: string;
  loginUrl: string;
};

const objetivoLabels: Record<string, string> = {
  perdida_peso: "Perdida de Peso",
  ganancia_muscular: "Ganancia Muscular",
  tonificacion: "Tonificacion",
  resistencia: "Resistencia",
  rehabilitacion: "Rehabilitacion",
  bienestar_general: "Bienestar General",
};

const estadoColors: Record<string, string> = {
  activo: "bg-emerald-100 text-emerald-700",
  inactivo: "bg-red-100 text-red-700",
  prueba: "bg-amber-100 text-amber-700",
};

const emptyForm = {
  nombre: "",
  email: "",
  telefono: "",
  fecha_nacimiento: "",
  objetivo: "bienestar_general",
  estado: "activo",
  fecha_alta: new Date().toISOString().split("T")[0],
  notas: "",
};

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [accessDialogOpen, setAccessDialogOpen] = useState(false);
  const [accessClient, setAccessClient] = useState<Cliente | null>(null);
  const [creatingAccess, setCreatingAccess] = useState(false);
  const [credentials, setCredentials] = useState<AccessCredentials | null>(null);

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch("/api/clientes");
      const json = (await res.json()) as { ok: boolean; data?: Cliente[] };
      if (json.ok && json.data) {
        setClientes(json.data);
      }
    } catch (err) {
      console.error("Error fetching clientes:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleSubmit = async () => {
    try {
      const url = editingId ? `/api/clientes/${editingId}` : "/api/clientes";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) {
        toast.success(editingId ? "Cliente actualizado" : "Cliente creado");
        setDialogOpen(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchClientes();
      } else {
        toast.error(json.error || "Error al guardar");
      }
    } catch (err) {
      console.error("Error saving client:", err);
      toast.error("Error al guardar cliente");
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingId(cliente._id);
    setForm({
      nombre: cliente.nombre || "",
      email: cliente.email || "",
      telefono: cliente.telefono || "",
      fecha_nacimiento: cliente.fecha_nacimiento
        ? new Date(cliente.fecha_nacimiento).toISOString().split("T")[0]
        : "",
      objetivo: cliente.objetivo || "bienestar_general",
      estado: cliente.estado || "activo",
      fecha_alta: cliente.fecha_alta
        ? new Date(cliente.fecha_alta).toISOString().split("T")[0]
        : "",
      notas: cliente.notas || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este cliente?")) return;
    try {
      const res = await fetch(`/api/clientes/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "No se pudo eliminar el cliente");
      }
      toast.success("Cliente eliminado");
      await fetchClientes();
    } catch (err) {
      console.error("Error deleting client:", err);
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const openAccessDialog = (cliente: Cliente) => {
    if (!cliente.email?.trim()) {
      toast.error("Añade primero un correo electrónico al cliente");
      return;
    }
    setAccessClient(cliente);
    setCredentials(null);
    setAccessDialogOpen(true);
  };

  const createAccess = async () => {
    if (!accessClient) return;
    setCreatingAccess(true);
    try {
      const response = await fetch(`/api/clientes/${accessClient._id}/acceso`, {
        method: "POST",
      });
      const result = (await response.json()) as {
        ok: boolean;
        data?: AccessCredentials;
        error?: string;
      };
      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error || "No se pudo crear el acceso");
      }
      setCredentials(result.data);
      toast.success("Acceso al portal creado");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al crear el acceso");
    } finally {
      setCreatingAccess(false);
    }
  };

  const copyCredentials = async () => {
    if (!credentials) return;
    const text = [
      "Chetesaí Fitness+",
      `Usuario: ${credentials.email}`,
      `Contraseña temporal: ${credentials.temporaryPassword}`,
      `Acceso: ${credentials.loginUrl}`,
      "Selecciona Cliente al iniciar sesión.",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      toast.success("Credenciales copiadas");
    } catch {
      toast.error("No se pudieron copiar las credenciales");
    }
  };

  const filtered = clientes.filter(
    (c) =>
      c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppSidebar>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              {clientes.length} clientes registrados
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingId(null); setForm(emptyForm); }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Nuevo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <div>
                    <Label>Telefono</Label>
                    <Input
                      value={form.telefono}
                      onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      placeholder="+34 600 000 000"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Fecha de Nacimiento</Label>
                    <Input
                      type="date"
                      value={form.fecha_nacimiento}
                      onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fecha de Alta</Label>
                    <Input
                      type="date"
                      value={form.fecha_alta}
                      onChange={(e) => setForm({ ...form, fecha_alta: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Objetivo</Label>
                    <Select
                      value={form.objetivo}
                      onValueChange={(v) => setForm({ ...form, objetivo: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(objetivoLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select
                      value={form.estado}
                      onValueChange={(v) => setForm({ ...form, estado: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activo">Activo</SelectItem>
                        <SelectItem value="inactivo">Inactivo</SelectItem>
                        <SelectItem value="prueba">Prueba</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Notas</Label>
                  <Textarea
                    value={form.notas}
                    onChange={(e) => setForm({ ...form, notas: e.target.value })}
                    placeholder="Notas adicionales..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? "Guardar Cambios" : "Crear Cliente"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mb-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando clientes...</div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                {search ? "No se encontraron clientes" : "No hay clientes registrados"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefono</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell className="font-medium">{c.nombre}</TableCell>
                      <TableCell className="text-muted-foreground">{c.email}</TableCell>
                      <TableCell className="text-muted-foreground">{c.telefono}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {objetivoLabels[c.objetivo] || c.objetivo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColors[c.estado] || "bg-gray-100 text-gray-700"}`}>
                          {c.estado}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAccessDialog(c)}
                            className="text-[#46624f] hover:text-[#36513f]"
                            title="Crear acceso al portal"
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(c)}
                            title="Editar cliente"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(c._id)}
                            className="text-destructive hover:text-destructive"
                            title="Eliminar cliente"
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

        <Dialog open={accessDialogOpen} onOpenChange={(open) => {
          setAccessDialogOpen(open);
          if (!open) {
            setAccessClient(null);
            setCredentials(null);
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{credentials ? "Acceso creado" : "Crear acceso al portal"}</DialogTitle>
            </DialogHeader>

            {!credentials ? (
              <div className="space-y-5 pt-2">
                <div className="rounded-2xl border bg-muted/30 p-4">
                  <p className="font-semibold">{accessClient?.nombre}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{accessClient?.email}</p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  <p className="font-semibold">Se creará una cuenta de cliente</p>
                  <p className="mt-1 leading-6">Chetesaí generará una contraseña temporal segura. Solo se mostrará una vez para que puedas entregársela al cliente.</p>
                </div>
                <Button onClick={createAccess} disabled={creatingAccess} className="w-full bg-[#46624f] hover:bg-[#3b5543]">
                  <KeyRound className="mr-2 h-4 w-4" />
                  {creatingAccess ? "Creando acceso..." : "Crear acceso al portal"}
                </Button>
              </div>
            ) : (
              <div className="space-y-5 pt-2">
                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-semibold">Cuenta lista para usar</p>
                    <p className="mt-1 text-sm leading-6">El cliente debe entrar seleccionando <strong>Cliente</strong>. Puede cambiar después la contraseña mediante “¿Olvidaste tu contraseña?”.</p>
                  </div>
                </div>

                <div>
                  <Label>Usuario</Label>
                  <Input className="mt-2" readOnly value={credentials.email} />
                </div>
                <div>
                  <Label>Contraseña temporal</Label>
                  <Input className="mt-2 font-mono" readOnly value={credentials.temporaryPassword} />
                </div>
                <div>
                  <Label>Acceso</Label>
                  <Input className="mt-2" readOnly value={credentials.loginUrl} />
                </div>

                <Button onClick={copyCredentials} className="w-full bg-[#46624f] hover:bg-[#3b5543]">
                  <Copy className="mr-2 h-4 w-4" /> Copiar credenciales
                </Button>
                <p className="text-center text-xs leading-5 text-muted-foreground">
                  Por seguridad, la contraseña temporal no se guarda en el panel y desaparecerá al cerrar esta ventana.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppSidebar>
  );
}
