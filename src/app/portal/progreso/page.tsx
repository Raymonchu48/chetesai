"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import ProgressPhotoGallery, { type ProgressPhotoMeasurement } from "@/components/ProgressPhotoGallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Activity, ArrowLeft, Plus, Scale, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type Medicion = ProgressPhotoMeasurement & {
  peso_kg: number | null;
  altura_cm: number | null;
  grasa_corporal_pct: number | null;
  masa_muscular_kg: number | null;
  agua_corporal_pct: number | null;
  cintura_cm: number | null;
  comentario_cliente: string | null;
  origen: string;
};

type PortalProgress = {
  cliente: { id: string; nombre: string; email: string | null };
  mediciones: Medicion[];
};

const emptyForm = {
  fecha: new Date().toISOString().slice(0, 10),
  peso_kg: "",
  grasa_corporal_pct: "",
  masa_muscular_kg: "",
  agua_corporal_pct: "",
  comentario_cliente: "",
};

export default function ClientProgressPage() {
  const [data, setData] = useState<PortalProgress | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/portal/progreso");
      const result = (await response.json()) as { ok: boolean; data?: PortalProgress; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudo cargar tu progreso");
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const latest = data?.mediciones?.[0];
  const previous = data?.mediciones?.[1];
  const bmi = useMemo(() => {
    if (!latest?.peso_kg || !latest?.altura_cm) return null;
    return latest.peso_kg / Math.pow(latest.altura_cm / 100, 2);
  }, [latest]);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/portal/progreso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo guardar");
      toast.success("Medición registrada");
      setForm(emptyForm);
      setShowForm(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#29312e]">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-5 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#c9653b]">CHETESAÍ FITNESS+</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight"><Activity className="h-8 w-8 text-[#46624f]" />Mi progreso</h1>
            <p className="mt-2 text-sm text-[#707872]">{data?.cliente?.nombre ? `Hola, ${data.cliente.nombre}. Aquí puedes revisar tu evolución.` : "Tu seguimiento corporal."}</p>
          </div>
          <div className="flex w-full gap-2 sm:w-auto"><Button asChild variant="outline" className="flex-1 sm:flex-none"><Link href="/portal"><ArrowLeft className="mr-2 h-4 w-4" />Entrenamiento</Link></Button><div className="w-48 rounded-xl border border-[#e7dfd3] bg-white p-1 text-[#46624f]"><LogoutButton /></div></div>
        </header>

        {loading ? <p className="py-16 text-center text-[#707872]">Cargando tu progreso...</p> : !data ? null : <>
          <div className="mb-6 flex justify-end"><Button onClick={() => setShowForm((value) => !value)} className="bg-[#46624f] hover:bg-[#3b5543]"><Plus className="mr-2 h-4 w-4" />Registrar control</Button></div>

          {showForm ? <Card className="mb-6 border-[#cbd9ce]"><CardContent className="p-6">
            <h2 className="text-xl font-bold">Nuevo control personal</h2>
            <p className="mt-1 text-sm text-[#707872]">Registra los datos que tengas disponibles. No hace falta rellenarlo todo.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Fecha" type="date" value={form.fecha} onChange={(value) => setForm({ ...form, fecha: value })} />
              <Field label="Peso (kg)" value={form.peso_kg} onChange={(value) => setForm({ ...form, peso_kg: value })} />
              <Field label="Grasa corporal (%)" value={form.grasa_corporal_pct} onChange={(value) => setForm({ ...form, grasa_corporal_pct: value })} />
              <Field label="Masa muscular (kg)" value={form.masa_muscular_kg} onChange={(value) => setForm({ ...form, masa_muscular_kg: value })} />
              <Field label="Agua corporal (%)" value={form.agua_corporal_pct} onChange={(value) => setForm({ ...form, agua_corporal_pct: value })} />
            </div>
            <div className="mt-4"><Label>Comentario</Label><Textarea className="mt-2" rows={3} value={form.comentario_cliente} onChange={(event) => setForm({ ...form, comentario_cliente: event.target.value })} placeholder="Cómo te sientes, contexto de la medición..." /></div>
            <div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button onClick={save} disabled={saving} className="bg-[#46624f] hover:bg-[#3b5543]">{saving ? "Guardando..." : "Guardar control"}</Button></div>
          </CardContent></Card> : null}

          {!data.mediciones.length ? <Card><CardContent className="py-16 text-center"><Scale className="mx-auto h-10 w-10 text-[#707872]" /><h2 className="mt-4 text-xl font-bold">Todavía no hay mediciones</h2><p className="mt-2 text-[#707872]">Tu evolución aparecerá aquí cuando se registre la primera valoración.</p></CardContent></Card> : <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Peso" value={format(latest?.peso_kg, "kg")} change={difference(latest?.peso_kg, previous?.peso_kg)} />
              <Metric label="Grasa corporal" value={format(latest?.grasa_corporal_pct, "%")} change={difference(latest?.grasa_corporal_pct, previous?.grasa_corporal_pct)} />
              <Metric label="Masa muscular" value={format(latest?.masa_muscular_kg, "kg")} change={difference(latest?.masa_muscular_kg, previous?.masa_muscular_kg)} />
              <Metric label="Agua corporal" value={format(latest?.agua_corporal_pct, "%")} change={difference(latest?.agua_corporal_pct, previous?.agua_corporal_pct)} />
              <Metric label="IMC" value={bmi ? bmi.toFixed(1) : "—"} />
            </div>

            <Card className="mb-6"><CardContent className="p-6"><div className="mb-5 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[#46624f]" /><h2 className="text-xl font-bold">Evolución del peso</h2></div><WeightChart rows={data.mediciones} /></CardContent></Card>

            <ProgressPhotoGallery measurements={data.mediciones} mode="client" />

            <section className="space-y-4">
              {data.mediciones.map((item) => <Card key={item.id}><CardContent className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-[#46624f]">{new Date(`${item.fecha}T12:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</p><h3 className="mt-1 text-lg font-bold">{format(item.peso_kg, "kg")} · {format(item.grasa_corporal_pct, "% grasa")}</h3>{item.comentario_cliente ? <p className="mt-2 text-sm text-[#707872]">{item.comentario_cliente}</p> : null}</div><span className="rounded-full bg-[#eef5ef] px-3 py-1 text-xs font-semibold text-[#46624f]">{item.origen === "cliente" ? "Registrado por ti" : "Valoración profesional"}</span></div></CardContent></Card>)}
            </section>
          </>}
        </>}
      </div>
    </main>
  );
}

function Field({ label, value, onChange, type = "number" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return <div><Label>{label}</Label><Input className="mt-2" type={type} step={type === "number" ? "0.1" : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}
function format(value: number | null | undefined, suffix: string) { return value === null || value === undefined ? "—" : `${Number(value).toFixed(1)} ${suffix}`; }
function difference(current?: number | null, previous?: number | null) { return current !== null && current !== undefined && previous !== null && previous !== undefined ? Number(current) - Number(previous) : null; }
function Metric({ label, value, change }: { label: string; value: string; change?: number | null }) { return <Card><CardContent className="p-5"><p className="text-sm text-[#707872]">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p>{change !== null && change !== undefined ? <p className="mt-2 text-xs text-[#46624f]">{change > 0 ? "+" : ""}{change.toFixed(1)} desde el control anterior</p> : null}</CardContent></Card>; }
function WeightChart({ rows }: { rows: Medicion[] }) {
  const data = [...rows].reverse().filter((row) => row.peso_kg !== null).slice(-12);
  if (data.length < 2) return <p className="py-10 text-center text-[#707872]">Se necesitan dos registros de peso para mostrar la gráfica.</p>;
  const values = data.map((row) => Number(row.peso_kg));
  const min = Math.min(...values) - 1;
  const max = Math.max(...values) + 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${90 - ((value - min) / (max - min || 1)) * 75}`).join(" ");
  return <div><svg viewBox="0 0 100 100" className="h-56 w-full overflow-visible" preserveAspectRatio="none"><line x1="0" y1="90" x2="100" y2="90" stroke="#ded8cd" strokeWidth="0.7" /><polyline points={points} fill="none" stroke="#46624f" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />{points.split(" ").map((point, index) => { const [x, y] = point.split(","); return <circle key={index} cx={x} cy={y} r="1.4" fill="#46624f" />; })}</svg><div className="mt-2 flex justify-between text-xs text-[#707872]"><span>{data[0].fecha}</span><span>{data[data.length - 1].fecha}</span></div></div>;
}
