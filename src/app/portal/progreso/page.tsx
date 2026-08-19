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
import { Activity, ArrowLeft, BarChart3, Camera, Plus, Scale, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

type Medicion = ProgressPhotoMeasurement & { peso_kg: number | null; altura_cm: number | null; grasa_corporal_pct: number | null; masa_muscular_kg: number | null; agua_corporal_pct: number | null; cintura_cm: number | null; comentario_cliente: string | null; origen: string; };
type PortalProgress = { cliente: { id: string; nombre: string; email: string | null }; mediciones: Medicion[]; };
const emptyForm = { fecha: new Date().toISOString().slice(0, 10), peso_kg: "", grasa_corporal_pct: "", masa_muscular_kg: "", agua_corporal_pct: "", comentario_cliente: "" };

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
    } catch (error) { toast.error(error instanceof Error ? error.message : "Error al cargar"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const latest = data?.mediciones?.[0];
  const previous = data?.mediciones?.[1];
  const bmi = useMemo(() => latest?.peso_kg && latest?.altura_cm ? latest.peso_kg / Math.pow(latest.altura_cm / 100, 2) : null, [latest]);

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/portal/progreso", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo guardar");
      toast.success("Medición registrada"); setForm(emptyForm); setShowForm(false); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Error al guardar"); }
    finally { setSaving(false); }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(140,219,120,0.13),_transparent_30%),linear-gradient(180deg,#f4f1e9_0%,#faf9f5_52%,#f1eee7_100%)] px-4 py-6 text-[#202724] sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="relative mb-7 overflow-hidden rounded-[30px] border border-[#d7b86b]/30 bg-[#111a15] p-6 text-white shadow-[0_22px_70px_rgba(17,26,21,0.22)] sm:p-8">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#8cdb78]/15 blur-3xl" /><div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-[#d7b86b]/10 blur-3xl" />
          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#d7b86b]">Chetesaí Fitness+</p><h1 className="mt-3 flex items-center gap-3 text-3xl font-black tracking-tight sm:text-4xl"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#8cdb78] text-[#101713]"><Activity className="h-7 w-7" /></span>Mi progreso</h1><p className="mt-4 max-w-xl text-sm leading-6 text-white/65">{data?.cliente?.nombre ? `Hola, ${data.cliente.nombre}. Aquí puedes revisar tu evolución y registrar nuevos controles.` : "Tu evolución, reunida en un espacio claro y medible."}</p></div>
            <div className="flex flex-col gap-2 sm:w-52"><Button asChild variant="outline" className="h-12 rounded-xl border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Link href="/portal"><ArrowLeft className="mr-2 h-4 w-4" />Entrenamiento</Link></Button><div className="rounded-xl border border-[#8cdb78]/25 bg-[#8cdb78]/10 p-1 text-[#9fe68f]"><LogoutButton /></div></div>
          </div>
        </header>

        {loading ? <div className="grid min-h-72 place-items-center"><div className="text-center"><Activity className="mx-auto h-9 w-9 animate-pulse text-[#2f9e24]" /><p className="mt-3 text-sm text-[#67706b]">Cargando tu progreso...</p></div></div> : !data ? null : <>
          <section className="mb-6 flex flex-col gap-4 rounded-[26px] border border-[#ded8cd] bg-[#fffdf9]/90 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2f9e24]">Seguimiento personal</p><h2 className="mt-1 text-xl font-black">Cada dato cuenta una parte de tu evolución</h2></div>
            <Button onClick={() => setShowForm((value) => !value)} aria-expanded={showForm} className="h-12 rounded-xl bg-[#2f9e24] px-5 font-bold shadow-lg shadow-[#2f9e24]/15 hover:bg-[#27891e]"><Plus className={`mr-2 h-4 w-4 transition-transform ${showForm ? "rotate-45" : ""}`} />{showForm ? "Cerrar control" : "Registrar control"}</Button>
          </section>

          <div className={`grid transition-all duration-300 ${showForm ? "mb-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}><div className="overflow-hidden"><Card className="border-[#8cdb78]/35 bg-[#fffdf9] shadow-xl"><CardContent className="p-6"><div className="flex items-start gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eaf5e8] text-[#2f9e24]"><BarChart3 className="h-5 w-5" /></span><div><h2 className="text-xl font-black">Nuevo control personal</h2><p className="mt-1 text-sm text-[#67706b]">Registra solo los datos que tengas disponibles.</p></div></div><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Field label="Fecha" type="date" value={form.fecha} onChange={(value) => setForm({ ...form, fecha: value })} /><Field label="Peso (kg)" value={form.peso_kg} onChange={(value) => setForm({ ...form, peso_kg: value })} /><Field label="Grasa corporal (%)" value={form.grasa_corporal_pct} onChange={(value) => setForm({ ...form, grasa_corporal_pct: value })} /><Field label="Masa muscular (kg)" value={form.masa_muscular_kg} onChange={(value) => setForm({ ...form, masa_muscular_kg: value })} /><Field label="Agua corporal (%)" value={form.agua_corporal_pct} onChange={(value) => setForm({ ...form, agua_corporal_pct: value })} /></div><div className="mt-4"><Label>Comentario</Label><Textarea className="mt-2 rounded-xl border-[#ded8cd]" rows={3} value={form.comentario_cliente} onChange={(event) => setForm({ ...form, comentario_cliente: event.target.value })} placeholder="Cómo te sientes, contexto de la medición..." /></div><div className="mt-5 flex justify-end gap-3"><Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button><Button onClick={save} disabled={saving} className="bg-[#2f9e24] hover:bg-[#27891e]">{saving ? "Guardando..." : "Guardar control"}</Button></div></CardContent></Card></div></div>

          {!data.mediciones.length ? <section className="relative overflow-hidden rounded-[30px] border border-[#ded8cd] bg-[#fffdf9] px-6 py-16 text-center shadow-[0_18px_55px_rgba(32,39,36,0.08)] sm:py-20"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#d7b86b] via-[#8cdb78] to-[#2f9e24]" /><span className="mx-auto grid h-20 w-20 place-items-center rounded-[24px] bg-[#eaf5e8] text-[#2f9e24]"><Scale className="h-10 w-10" /></span><p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-[#b38d45]">Tu punto de partida</p><h2 className="mt-2 text-2xl font-black">Todavía no hay mediciones</h2><p className="mx-auto mt-3 max-w-md leading-7 text-[#67706b]">Tu evolución aparecerá aquí cuando registres la primera valoración. Después podrás comparar tus cambios con claridad.</p><div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-3"><EmptyBenefit icon={<BarChart3 className="h-5 w-5" />} text="Datos medibles" /><EmptyBenefit icon={<Camera className="h-5 w-5" />} text="Galería visual" /><EmptyBenefit icon={<Sparkles className="h-5 w-5" />} text="Evolución real" /></div><Button onClick={() => setShowForm(true)} className="mt-8 h-12 rounded-xl bg-[#2f9e24] px-6 font-bold hover:bg-[#27891e]"><Plus className="mr-2 h-4 w-4" />Crear primer control</Button></section> : <><div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5"><Metric label="Peso" value={format(latest?.peso_kg, "kg")} change={difference(latest?.peso_kg, previous?.peso_kg)} /><Metric label="Grasa corporal" value={format(latest?.grasa_corporal_pct, "%")} change={difference(latest?.grasa_corporal_pct, previous?.grasa_corporal_pct)} /><Metric label="Masa muscular" value={format(latest?.masa_muscular_kg, "kg")} change={difference(latest?.masa_muscular_kg, previous?.masa_muscular_kg)} /><Metric label="Agua corporal" value={format(latest?.agua_corporal_pct, "%")} change={difference(latest?.agua_corporal_pct, previous?.agua_corporal_pct)} /><Metric label="IMC" value={bmi ? bmi.toFixed(1) : "—"} /></div><Card className="mb-6 border-[#ded8cd] bg-[#fffdf9]"><CardContent className="p-6"><div className="mb-5 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[#2f9e24]" /><h2 className="text-xl font-black">Evolución del peso</h2></div><WeightChart rows={data.mediciones} /></CardContent></Card><ProgressPhotoGallery measurements={data.mediciones} mode="client" /><section className="space-y-4">{data.mediciones.map((item) => <Card key={item.id} className="border-[#ded8cd] bg-[#fffdf9]"><CardContent className="p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-sm font-semibold text-[#2f9e24]">{new Date(`${item.fecha}T12:00:00`).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}</p><h3 className="mt-1 text-lg font-black">{format(item.peso_kg, "kg")} · {format(item.grasa_corporal_pct, "% grasa")}</h3>{item.comentario_cliente ? <p className="mt-2 text-sm text-[#67706b]">{item.comentario_cliente}</p> : null}</div><span className="rounded-full bg-[#eaf5e8] px-3 py-1 text-xs font-semibold text-[#2f9e24]">{item.origen === "cliente" ? "Registrado por ti" : "Valoración profesional"}</span></div></CardContent></Card>)}</section></>}
        </>}
      </div>
    </main>
  );
}

function EmptyBenefit({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#f3f0e8] px-3 py-3 text-sm font-bold text-[#47514c]"><span className="text-[#2f9e24]">{icon}</span>{text}</div>; }
function Field({ label, value, onChange, type = "number" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <div><Label>{label}</Label><Input className="mt-2 rounded-xl border-[#ded8cd]" type={type} step={type === "number" ? "0.1" : undefined} value={value} onChange={(event) => onChange(event.target.value)} /></div>; }
function format(value: number | null | undefined, suffix: string) { return value === null || value === undefined ? "—" : `${Number(value).toFixed(1)} ${suffix}`; }
function difference(current?: number | null, previous?: number | null) { return current !== null && current !== undefined && previous !== null && previous !== undefined ? Number(current) - Number(previous) : null; }
function Metric({ label, value, change }: { label: string; value: string; change?: number | null }) { return <Card className="overflow-hidden border-[#ded8cd] bg-[#fffdf9]"><CardContent className="border-t-2 border-[#8cdb78] p-5"><p className="text-sm text-[#67706b]">{label}</p><p className="mt-2 text-2xl font-black">{value}</p>{change !== null && change !== undefined ? <p className="mt-2 text-xs font-semibold text-[#2f9e24]">{change > 0 ? "+" : ""}{change.toFixed(1)} desde el control anterior</p> : null}</CardContent></Card>; }
function WeightChart({ rows }: { rows: Medicion[] }) { const data = [...rows].reverse().filter((row) => row.peso_kg !== null).slice(-12); if (data.length < 2) return <p className="py-10 text-center text-[#67706b]">Se necesitan dos registros de peso para mostrar la gráfica.</p>; const values = data.map((row) => Number(row.peso_kg)); const min = Math.min(...values) - 1; const max = Math.max(...values) + 1; const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${90 - ((value - min) / (max - min || 1)) * 75}`).join(" "); return <div><svg viewBox="0 0 100 100" className="h-56 w-full overflow-visible" preserveAspectRatio="none"><line x1="0" y1="90" x2="100" y2="90" stroke="#ded8cd" strokeWidth="0.7" /><polyline points={points} fill="none" stroke="#2f9e24" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />{points.split(" ").map((point, index) => { const [x, y] = point.split(","); return <circle key={index} cx={x} cy={y} r="1.4" fill="#8cdb78" stroke="#2f9e24" strokeWidth="0.5" />; })}</svg><div className="mt-2 flex justify-between text-xs text-[#67706b]"><span>{data[0].fecha}</span><span>{data[data.length - 1].fecha}</span></div></div>; }
