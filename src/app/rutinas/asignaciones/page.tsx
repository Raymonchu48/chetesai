"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, ClipboardCheck, UserRound } from "lucide-react";
import { toast } from "sonner";

type Cliente = { id: string; nombre: string; email: string | null; estado: string };
type Rutina = { id: string; nombre: string; objetivo: string; nivel: string; dias_semana: number; duracion_semanas: number | null };
type Asignacion = {
  id: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: string;
  progreso: number;
  notas: string | null;
  clientes?: { id: string; nombre: string; email: string | null };
  rutinas?: { id: string; nombre: string; objetivo: string; nivel: string; dias_semana: number };
};

export default function AsignacionesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [asignaciones, setAsignaciones] = useState<Asignacion[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [rutinaId, setRutinaId] = useState("");
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState("");
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/asignaciones");
      const result = (await response.json()) as { ok: boolean; data?: { clientes: Cliente[]; rutinas: Rutina[]; asignaciones: Asignacion[] }; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudieron cargar las asignaciones");
      setClientes(result.data.clientes || []);
      setRutinas(result.data.rutinas || []);
      setAsignaciones(result.data.asignaciones || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activas = useMemo(() => asignaciones.filter((item) => ["activa", "programada", "pausada"].includes(item.estado)), [asignaciones]);

  async function assign() {
    if (!clienteId || !rutinaId) return toast.error("Selecciona cliente y rutina");
    setSaving(true);
    try {
      const response = await fetch("/api/asignaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, rutina_id: rutinaId, fecha_inicio: fechaInicio, fecha_fin: fechaFin || null, notas }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo asignar la rutina");
      toast.success("Rutina asignada al cliente");
      setClienteId(""); setRutinaId(""); setFechaFin(""); setNotas("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al asignar");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id: string, estado: string) {
    try {
      const response = await fetch("/api/asignaciones", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, estado }) });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo actualizar");
      toast.success("Asignación actualizada");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    }
  }

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><ClipboardCheck className="h-8 w-8 text-primary" />Asignar rutinas</h1>
          <p className="mt-2 text-muted-foreground">Vincula una rutina activa a cada cliente y controla su estado.</p>
        </div>

        <Card className="mb-8"><CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Cliente"><Select value={clienteId} onValueChange={setClienteId}><SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger><SelectContent>{clientes.filter((c) => c.estado !== "inactivo").map((c) => <SelectItem key={c.id} value={c.id}>{c.nombre}{c.email ? ` · ${c.email}` : ""}</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Rutina"><Select value={rutinaId} onValueChange={setRutinaId}><SelectTrigger><SelectValue placeholder="Seleccionar rutina" /></SelectTrigger><SelectContent>{rutinas.map((r) => <SelectItem key={r.id} value={r.id}>{r.nombre} · {r.dias_semana} días</SelectItem>)}</SelectContent></Select></Field>
          <Field label="Fecha de inicio"><Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></Field>
          <Field label="Fecha de fin opcional"><Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></Field>
          <div className="md:col-span-2 xl:col-span-3"><Field label="Notas de asignación"><Textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Objetivo, adaptación o indicaciones generales..." /></Field></div>
          <div className="flex items-end"><Button className="w-full" disabled={saving} onClick={assign}>{saving ? "Asignando..." : "Asignar rutina"}</Button></div>
        </CardContent></Card>

        <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold">Asignaciones activas</h2><span className="text-sm text-muted-foreground">{activas.length} activas</span></div>
        {loading ? <p className="py-12 text-center text-muted-foreground">Cargando asignaciones...</p> : activas.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Todavía no hay rutinas asignadas.</CardContent></Card> : (
          <div className="grid gap-4 lg:grid-cols-2">
            {activas.map((item) => <Card key={item.id}><CardContent className="p-5">
              <div className="flex items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-sm text-muted-foreground"><UserRound className="h-4 w-4" />{item.clientes?.nombre || "Cliente"}</p><h3 className="mt-1 text-lg font-bold">{item.rutinas?.nombre || "Rutina"}</h3><p className="mt-1 text-sm text-muted-foreground">{item.rutinas?.dias_semana || 0} días/semana · {item.estado}</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{item.progreso || 0}%</span></div>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" />Inicio: {item.fecha_inicio}{item.fecha_fin ? ` · Fin: ${item.fecha_fin}` : ""}</div>
              {item.notas ? <p className="mt-3 text-sm text-muted-foreground">{item.notas}</p> : null}
              <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => changeStatus(item.id, item.estado === "pausada" ? "activa" : "pausada")}>{item.estado === "pausada" ? "Reactivar" : "Pausar"}</Button><Button variant="outline" size="sm" onClick={() => changeStatus(item.id, "completada")}>Completar</Button><Button variant="ghost" size="sm" className="text-destructive" onClick={() => changeStatus(item.id, "cancelada")}>Cancelar</Button></div>
            </CardContent></Card>)}
          </div>
        )}
      </div>
    </AppSidebar>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
