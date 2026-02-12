"use client";

import { useEffect, useState, useCallback } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, CreditCard, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Pago {
  _id: string;
  concepto: string;
  cliente: string | { _id: string; nombre: string };
  monto: number;
  fecha_pago: string;
  metodo_pago: string;
  estado_pago: string;
  mes_correspondiente: string;
}

interface Cliente {
  _id: string;
  nombre: string;
}

const metodoLabels: Record<string, string> = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  bizum: "Bizum",
};

const estadoColors: Record<string, string> = {
  pagado: "bg-emerald-100 text-emerald-700",
  pendiente: "bg-amber-100 text-amber-700",
  vencido: "bg-red-100 text-red-700",
};

const emptyForm = {
  concepto: "",
  cliente: "",
  monto: 180,
  fecha_pago: new Date().toISOString().split("T")[0],
  metodo_pago: "efectivo",
  estado_pago: "pagado",
  mes_correspondiente: "",
};

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchData = useCallback(async () => {
    try {
      const [pagRes, cliRes] = await Promise.all([
        fetch("/api/pagos"),
        fetch("/api/clientes"),
      ]);
      const pagJson = (await pagRes.json()) as { ok: boolean; data?: Pago[] };
      const cliJson = (await cliRes.json()) as { ok: boolean; data?: Cliente[] };
      if (pagJson.ok && pagJson.data) setPagos(pagJson.data);
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
      const url = editingId ? `/api/pagos/${editingId}` : "/api/pagos";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, monto: Number(form.monto) }),
      });
      const json = (await res.json()) as { ok: boolean; error?: string };
      if (json.ok) {
        toast.success(editingId ? "Pago actualizado" : "Pago registrado");
        setDialogOpen(false);
        setEditingId(null);
        setForm(emptyForm);
        fetchData();
      } else {
        toast.error(json.error || "Error al guardar");
      }
    } catch (err) {
      console.error("Error saving payment:", err);
      toast.error("Error al guardar pago");
    }
  };

  const handleEdit = (p: Pago) => {
    setEditingId(p._id);
    const clienteId = typeof p.cliente === "object" ? p.cliente?._id : p.cliente;
    setForm({
      concepto: p.concepto || "",
      cliente: clienteId || "",
      monto: p.monto || 180,
      fecha_pago: p.fecha_pago ? new Date(p.fecha_pago).toISOString().split("T")[0] : "",
      metodo_pago: p.metodo_pago || "efectivo",
      estado_pago: p.estado_pago || "pagado",
      mes_correspondiente: p.mes_correspondiente || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Eliminar este pago?")) return;
    try {
      const res = await fetch(`/api/pagos/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { ok: boolean };
      if (json.ok) {
        toast.success("Pago eliminado");
        fetchData();
      }
    } catch (err) {
      console.error("Error deleting payment:", err);
      toast.error("Error al eliminar");
    }
  };

  const totalCobrado = pagos
    .filter((p) => p.estado_pago === "pagado")
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  const totalPendiente = pagos
    .filter((p) => p.estado_pago === "pendiente" || p.estado_pago === "vencido")
    .reduce((sum, p) => sum + (Number(p.monto) || 0), 0);

  return (
    <AppSidebar>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-primary" />
              Pagos
            </h1>
            <p className="text-muted-foreground mt-1">
              {pagos.length} pagos registrados
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingId(null); setForm(emptyForm); }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" /> Registrar Pago
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Pago" : "Registrar Pago"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Concepto *</Label>
                  <Input
                    value={form.concepto}
                    onChange={(e) => setForm({ ...form, concepto: e.target.value })}
                    placeholder="Ej: Cuota mensual febrero"
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
                    <Label>Monto (EUR)</Label>
                    <Input
                      type="number"
                      value={form.monto}
                      onChange={(e) => setForm({ ...form, monto: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Fecha de Pago</Label>
                    <Input
                      type="date"
                      value={form.fecha_pago}
                      onChange={(e) => setForm({ ...form, fecha_pago: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Metodo de Pago</Label>
                    <Select
                      value={form.metodo_pago}
                      onValueChange={(v) => setForm({ ...form, metodo_pago: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(metodoLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Select
                      value={form.estado_pago}
                      onValueChange={(v) => setForm({ ...form, estado_pago: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pagado">Pagado</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="vencido">Vencido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Mes Correspondiente</Label>
                  <Input
                    value={form.mes_correspondiente}
                    onChange={(e) => setForm({ ...form, mes_correspondiente: e.target.value })}
                    placeholder="Ej: Febrero 2026"
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? "Guardar Cambios" : "Registrar Pago"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cobrado</p>
                <p className="text-2xl font-bold text-emerald-600">{totalCobrado.toLocaleString("es-ES")} EUR</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendiente de Cobro</p>
                <p className="text-2xl font-bold text-amber-600">{totalPendiente.toLocaleString("es-ES")} EUR</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-amber-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Registros</p>
                <p className="text-2xl font-bold text-foreground">{pagos.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando pagos...</div>
            ) : pagos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No hay pagos registrados</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Metodo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagos.map((p) => (
                    <TableRow key={p._id}>
                      <TableCell className="font-medium">{p.concepto}</TableCell>
                      <TableCell className="text-muted-foreground">{getClienteName(p.cliente)}</TableCell>
                      <TableCell className="font-semibold">{Number(p.monto).toLocaleString("es-ES")} EUR</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString("es-ES") : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {metodoLabels[p.metodo_pago] || p.metodo_pago}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoColors[p.estado_pago] || "bg-gray-100 text-gray-700"}`}>
                          {p.estado_pago}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(p._id)}
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
