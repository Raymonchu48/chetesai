"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import ProgressPhotoGallery, { type ProgressPhotoMeasurement } from "@/components/ProgressPhotoGallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, ArrowDownRight, ArrowUpRight, Plus, Scale, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type Cliente = { _id: string; nombre: string; email: string };
type Medicion = ProgressPhotoMeasurement & {
  peso_kg: number | null;
  altura_cm: number | null;
  grasa_corporal_pct: number | null;
  masa_muscular_kg: number | null;
  agua_corporal_pct: number | null;
  pecho_cm: number | null;
  cintura_cm: number | null;
  cadera_cm: number | null;
  brazo_izq_cm: number | null;
  brazo_der_cm: number | null;
  muslo_izq_cm: number | null;
  muslo_der_cm: number | null;
  notas_profesional: string | null;
  origen: string;
};

type FormState = {
  fecha: string;
  peso_kg: string;
  altura_cm: string;
  grasa_corporal_pct: string;
  masa_muscular_kg: string;
  agua_corporal_pct: string;
  pecho_cm: string;
  cintura_cm: string;
  cadera_cm: string;
  brazo_izq_cm: string;
  brazo_der_cm: string;
  muslo_izq_cm: string;
  muslo_der_cm: string;
  notas_profesional: string;
};

const emptyForm: FormState = {
  fecha: new Date().toISOString().slice(0, 10),
  peso_kg: "",
  altura_cm: "",
  grasa_corporal_pct: "",
  masa_muscular_kg: "",
  agua_corporal_pct: "",
  pecho_cm: "",
  cintura_cm: "",
  cadera_cm: "",
  brazo_izq_cm: "",
  brazo_der_cm: "",
  muslo_izq_cm: "",
  muslo_der_cm: "",
  notas_profesional: "",
};

export default function ProgresoPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/clientes")
      .then((response) => response.json())
      .then((result: { ok: boolean; data?: Cliente[] }) => {
        if (result.ok) {
          const rows = result.data || [];
          setClientes(rows);
          const requested = new URLSearchParams(window.location.search).get("cliente_id");
          const selected = rows.find((row) => row._id === requested) || rows[0];
          if (selected) setClienteId(selected._id);
        }
      })
      .catch(() => toast.error("No se pudieron cargar los clientes"));
  }, []);

  const loadMeasurements = useCallback(async () => {
    if (!clienteId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/progreso?cliente_id=${encodeURIComponent(clienteId)}`);
      const result = (await response.json()) as { ok: boolean; data?: Medicion[]; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo cargar el progreso");
      setMediciones(result.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => { void loadMeasurements(); }, [loadMeasurements]);

  const latest = mediciones[0];
  const previous = mediciones[1];
  const selectedClient = clientes.find((item) => item._id === clienteId);

  const bmi = useMemo(() => {
    if (!latest?.peso_kg || !latest?.altura_cm) return null;
    return latest.peso_kg / Math.pow(latest.altura_cm / 100, 2);
  }, [latest]);

  async function saveMeasurement() {
    if (!clienteId) return toast.error("Selecciona un cliente");
    setSaving(true);
    try {
      const response = await fetch("/api/progreso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente_id: clienteId, ...form }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo guardar");
      toast.success("Medición registrada");
      setForm(emptyForm);
      setShowForm(false);
      await loadMeasurements();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeasurement(id: string) {
    if (!window.confirm("¿Eliminar esta medición?")) return;
    const response = await fetch(`/api/progreso?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const result = (await response.json()) as { ok: boolean; error?: string };
    if (!response.ok || !result.ok) return toast.error(result.error || "No se pudo eliminar");
    toast.success("Medición eliminada");
    await loadMeasurements();
  }

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight"><Activity className="h-8 w-8 text-primary" />Seguimiento corporal</h1>
            <p className="mt-1 text-muted-foreground">Mediciones, fotografías comparativas y evolución de cada cliente.</p>
          </div>
          <Button onClick={() => setShowForm((value) => !value)} disabled={!clienteId}><Plus className="mr-2 h-4 w-4" />Nueva medición</Button>
        </div>

        <Card className="mb-6">
          <CardContent className="p-5">
            <Label>Cliente</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger className="mt-2 max-w-md"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
              <SelectContent>{clientes.map((cliente) => <SelectItem key={cliente._id} value={cliente._id}>{cliente.nombre} · {cliente.email}</SelectItem>)}</SelectContent>
            </Select>
          </CardContent>
        </Card>

        {showForm ? <Card className="mb-6 border-primary/30"><CardContent className="p-6">
          <div className="mb-5"><h2 className="text-xl font-bold">Nueva valoración</h2><p className="text-sm text-muted-foreground">{selectedClient?.nombre}</p></div>
          <div className="grid gap-4 md:grid-cols-4">
            <FormInput label="Fecha" type="date" value={form.fecha} onChange={(value) => setForm({ ...form, fecha: value })} />
            <FormInput label="Peso (kg)" value={form.peso_kg} onChange={(value) => setForm({ ...form, peso_kg: value })} />
            <FormInput label="Altura (cm)" value={form.altura_cm} onChange={(value) => setForm({ ...form, altura_cm: value })} />
            <FormInput label="Grasa corporal (%)" value={form.grasa_corporal_pct} onChange={(value) => setForm({ ...form, grasa_corporal_pct: value })} />
            <FormInput label="Masa muscular (kg)" value={form.masa_muscular_kg} onChange={(value) => setForm({ ...form, masa_muscular_kg: value })} />
            <FormInput label="Agua corporal (%)" value={form.agua_corporal_pct} onChange={(value) => setForm({ ...form, agua_corporal_pct: value })} />
            <FormInput label="Pecho (cm)" value={form.pecho_cm} onChange={(value) => setForm({ ...form, pecho_cm: value })} />
            <FormInput label="Cintura (cm)" value={form.cintura_cm} onChange={(value) => setForm({ ...form, cintura_cm: value })} />
            <FormInput label="Cadera (cm)" value={form.cadera_cm} onChange={(value) => setForm({ ...form, cadera_cm: value })} />
            <FormInput label="Brazo izquierdo (cm)" value={form.brazo_izq_cm} onChange={(value) => setForm({ ...form, brazo_izq_cm: value })} />
            <FormInput label="Brazo derecho (cm)" value={form.brazo_der_cm} onChange={(value) => setForm({ ...form, brazo_der_cm: value })} />
            <FormInput label="Muslo izquierdo (cm)" value={form.muslo_izq_cm} onChange={(value) => setForm({ ...form, muslo_izq_cm: value })} />
            <FormInput label="Muslo derecho (cm)" value={form.muslo_der_cm} onChange={(value) => setForm({ ...form, muslo_der_cm: value })} />
          </div>
          <div className="mt-4"><Label>Notas profesionales</Label><Textarea className="mt-2" rows={3} value={form.notas_profesional} onChange={(event) => setForm({ ...form, notas_profesional: event.target.value })} placeholder="Observaciones, contexto y próximos ajustes..." /></div>
          <div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button onClick={saveMeasurement} disabled={saving}>{saving ? "Guardando..." : "Guardar medición"}</Button></div>
        </CardContent></Card> : null}

        {loading ? <p className="py-12 text-center text-muted-foreground">Cargando progreso...</p> : mediciones.length === 0 ? <Card><CardContent className="py-16 text-center"><Scale className="mx-auto h-10 w-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-bold">Todavía no hay mediciones</h2><p className="mt-2 text-muted-foreground">Registra la primera valoración para comenzar la evolución.</p></CardContent></Card> : <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Peso actual" value={format(latest.peso_kg, "kg")} delta={delta(latest.peso_kg, previous?.peso_kg)} />
            <MetricCard label="Grasa corporal" value={format(latest.grasa_corporal_pct, "%")} delta={delta(latest.grasa_corporal_pct, previous?.grasa_corporal_pct)} />
            <MetricCard label="Masa muscular" value={format(latest.masa_muscular_kg, "kg")} delta={delta(latest.masa_muscular_kg, previous?.masa_muscular_kg)} />
            <MetricCard label="Cintura" value={format(latest.cintura_cm, "cm")} delta={delta(latest.cintura_cm, previous?.cintura_cm)} />
            <MetricCard label="IMC" value={bmi ? bmi.toFixed(1) : "—"} />
          </div>

          <Card className="mb-6"><CardContent className="p-6"><div className="mb-5 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /><h2 className="text-xl font-bold">Evolución del peso</h2></div><ProgressChart rows={mediciones} /></CardContent></Card>

          <ProgressPhotoGallery measurements={mediciones} mode="professional" clienteId={clienteId} onChanged={loadMeasurements} />

          <div className="space-y-4">
            {mediciones.map((item) => <Card key={item.id}><CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div><p className="text-sm font-semibold text-primary">{new Date(`${item.fecha}T12:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</p><h3 className="mt-1 text-lg font-bold">{format(item.peso_kg, "kg")} · {format(item.grasa_corporal_pct, "% grasa")}</h3>{item.notas_profesional ? <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{item.notas_profesional}</p> : null}</div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMeasurement(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3 lg:grid-cols-6"><Mini label="Músculo" value={format(item.masa_muscular_kg, "kg")} /><Mini label="Agua" value={format(item.agua_corporal_pct, "%")} /><Mini label="Pecho" value={format(item.pecho_cm, "cm")} /><Mini label="Cintura" value={format(item.cintura_cm, "cm")} /><Mini label="Cadera" value={format(item.cadera_cm, "cm")} /><Mini label="Origen" value={item.origen === "cliente" ? "Cliente" : "Profesional"} /></div>
            </CardContent></Card>)}
          </div>
        </>}
      </div>
    </AppSidebar>
  );
}

function FormInput({ label, value, onChange, type = "number" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div><Label>{label}</Label><Input className="mt-2" type={type} step={type === "number" ? "0.1" : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}
function format(value: number | null | undefined, suffix: string) { return value === null || value === undefined ? "—" : `${Number(value).toFixed(1)} ${suffix}`; }
function delta(current: number | null, previous?: number | null) { return current !== null && previous !== null && previous !== undefined ? Number(current) - Number(previous) : null; }
function MetricCard({ label, value, delta: change }: { label: string; value: string; delta?: number | null }) {
  const positive = change !== null && change !== undefined && change > 0;
  return <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p>{change !== null && change !== undefined ? <p className={`mt-2 flex items-center text-xs ${positive ? "text-amber-600" : "text-emerald-600"}`}>{positive ? <ArrowUpRight className="mr-1 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-1 h-3.5 w-3.5" />}{Math.abs(change).toFixed(1)} desde la anterior</p> : null}</CardContent></Card>;
}
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-muted px-3 py-2"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function ProgressChart({ rows }: { rows: Medicion[] }) {
  const data = [...rows].reverse().filter((row) => row.peso_kg !== null).slice(-12);
  if (data.length < 2) return <p className="py-10 text-center text-muted-foreground">Se necesitan al menos dos registros de peso para mostrar la gráfica.</p>;
  const values = data.map((row) => Number(row.peso_kg));
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${90 - ((value - min) / (max - min || 1)) * 75}`).join(" ");
  return <div><svg viewBox="0 0 100 100" className="h-56 w-full overflow-visible" preserveAspectRatio="none"><line x1="0" y1="90" x2="100" y2="90" stroke="currentColor" className="text-border" strokeWidth="0.7" /><polyline points={points} fill="none" stroke="currentColor" className="text-primary" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />{points.split(" ").map((point, index) => { const [x, y] = point.split(","); return <circle key={index} cx={x} cy={y} r="1.4" fill="currentColor" className="text-primary" />; })}</svg><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{data[0].fecha}</span><span>{data[data.length - 1].fecha}</span></div></div>;
}
