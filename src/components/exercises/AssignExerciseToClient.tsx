"use client";

import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type Cliente = { id: string; nombre: string; email?: string | null; estado?: string };

export default function AssignExerciseToClient({ exerciseId, exerciseName }: { exerciseId: string; exerciseName: string }) {
  const [open, setOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [dia, setDia] = useState("1");
  const [series, setSeries] = useState("3");
  const [repeticiones, setRepeticiones] = useState("10");
  const [descanso, setDescanso] = useState("60");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || clientes.length) return;
    setLoading(true);
    fetch("/api/asignaciones/ejercicio")
      .then(async (response) => {
        const result = (await response.json()) as { ok: boolean; data?: Cliente[]; error?: string };
        if (!response.ok || !result.ok) throw new Error(result.error || "No se pudieron cargar los clientes");
        setClientes(result.data || []);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Error al cargar clientes"))
      .finally(() => setLoading(false));
  }, [open, clientes.length]);

  async function assign() {
    if (!clienteId) return toast.error("Selecciona un cliente");
    setSaving(true);
    try {
      const response = await fetch("/api/asignaciones/ejercicio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: clienteId,
          ejercicio_id: exerciseId,
          dia: Number(dia),
          series: Number(series),
          repeticiones,
          descanso_segundos: Number(descanso),
          observaciones: observaciones || null,
        }),
      });
      const result = (await response.json()) as { ok: boolean; data?: { plan_creado?: boolean }; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo asignar el ejercicio");
      toast.success(result.data?.plan_creado ? "Ejercicio asignado y plan personalizado creado" : "Ejercicio añadido al plan activo del cliente");
      setOpen(false);
      setClienteId("");
      setObservaciones("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al asignar el ejercicio");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mt-3 w-full" variant="default">
          <UserPlus className="mr-2 h-4 w-4" />Asignar a cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Asignar ejercicio a cliente</DialogTitle>
        </DialogHeader>
        <div className="rounded-2xl bg-muted/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Ejercicio</p>
          <p className="mt-1 font-black">{exerciseName}</p>
        </div>
        <div className="space-y-2">
          <Label>Cliente</Label>
          <Select value={clienteId} onValueChange={setClienteId} disabled={loading}>
            <SelectTrigger><SelectValue placeholder={loading ? "Cargando clientes..." : "Seleccionar cliente"} /></SelectTrigger>
            <SelectContent>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre}{cliente.email ? ` · ${cliente.email}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Día"><Input type="number" min={1} max={7} value={dia} onChange={(e) => setDia(e.target.value)} /></Field>
          <Field label="Series"><Input type="number" min={1} max={30} value={series} onChange={(e) => setSeries(e.target.value)} /></Field>
          <Field label="Repeticiones"><Input value={repeticiones} onChange={(e) => setRepeticiones(e.target.value)} placeholder="10 / 8-12 / 30s" /></Field>
          <Field label="Descanso (s)"><Input type="number" min={0} max={3600} value={descanso} onChange={(e) => setDescanso(e.target.value)} /></Field>
        </div>
        <div className="space-y-2">
          <Label>Indicaciones opcionales</Label>
          <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Carga, técnica, rango, molestias, observaciones..." />
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Si el cliente ya tiene un plan activo, el ejercicio se añadirá a ese plan. Si no tiene ninguno, Chetesaí creará automáticamente un plan personalizado.
        </p>
        <Button onClick={assign} disabled={saving || loading || !clienteId} className="w-full">
          {saving ? "Asignando..." : "Confirmar asignación"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
