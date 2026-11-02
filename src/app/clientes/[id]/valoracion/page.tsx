"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const sections = [
  { title: "Objetivos y motivación", fields: [
    ["objetivo", "Objetivo principal (pérdida de grasa, fuerza, salud, rendimiento...)", "text"],
    ["objetivos_secundarios", "Objetivos secundarios y motivación", "textarea"],
    ["plazo", "Plazo deseado y expectativas", "text"],
  ] },
  { title: "Salud y seguridad", fields: [
    ["enfermedades", "Enfermedades o diagnósticos relevantes comunicados por el cliente", "textarea"],
    ["lesiones", "Lesiones, dolor o limitaciones de movimiento", "textarea"],
    ["medicacion", "Medicación que pueda afectar a la actividad o alimentación", "textarea"],
    ["contraindicaciones", "Restricciones indicadas por profesional sanitario, embarazo u otras precauciones", "textarea"],
    ["autorizacion_medica", "¿Requiere valoración o autorización médica antes de comenzar?", "select"],
  ] },
  { title: "Situación física y actividad", fields: [
    ["peso", "Peso actual (kg)", "number"],
    ["altura", "Altura (cm)", "number"],
    ["actividad_diaria", "Trabajo, actividad cotidiana y horas sentado", "textarea"],
    ["experiencia", "Experiencia con el entrenamiento", "select-level"],
    ["actividad_actual", "Ejercicio actual (tipo, frecuencia, intensidad)", "textarea"],
  ] },
  { title: "Planificación del entrenamiento", fields: [
    ["dias", "Días disponibles por semana", "number"],
    ["minutos", "Minutos disponibles por sesión", "number"],
    ["disponibilidad", "Días y horarios preferidos", "text"],
    ["material", "Material y acceso a gimnasio / domicilio", "textarea"],
    ["preferencias_ejercicio", "Actividades preferidas y ejercicios a evitar", "textarea"],
  ] },
  { title: "Alimentación y nutrición", fields: [
    ["alergias", "Alergias e intolerancias alimentarias", "textarea"],
    ["preferencias_alimentarias", "Preferencias, restricciones culturales y alimentos rechazados", "textarea"],
    ["comidas", "Número de comidas, horarios y ejemplo de un día habitual", "textarea"],
    ["hidratacion", "Agua y bebidas habituales", "text"],
    ["suplementos", "Suplementos alimenticios actuales", "text"],
    ["relacion_comida", "Dificultades con la alimentación o antecedentes relevantes que desee comunicar", "textarea"],
  ] },
  { title: "Hábitos y seguimiento", fields: [
    ["sueno", "Horas de sueño y calidad del descanso", "text"],
    ["estres", "Estrés percibido y principales factores", "text"],
    ["adherencia", "Barreras para mantener una rutina y apoyos disponibles", "textarea"],
    ["seguimiento", "Preferencia de seguimiento y comunicación", "text"],
  ] },
] as const;
type Answer = Record<string, string>;
type Saved = { id: string; created_at: string; estado: string; respuestas: Answer; observaciones_profesional: string };
export default function ValoracionInicialPage() {
  const { id } = useParams<{ id: string }>();
  const [answers, setAnswers] = useState<Answer>({});
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [history, setHistory] = useState<Saved[]>([]);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(true);
  async function refresh() {
    try {
      const response = await fetch(`/api/clientes/${encodeURIComponent(id)}/valoraciones`, { cache: "no-store" });
      const result = await response.json() as { ok: boolean; data?: Saved[]; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudieron cargar las valoraciones");
      setHistory(result.data || []);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error de carga"); }
    finally { setBusy(false); }
  }
  useEffect(() => { void refresh(); }, [id]);
  function edit(field: string, value: string) { setAnswers(a => ({ ...a, [field]: value })); }
  async function save(estado: "borrador" | "completada") {
    setSaving(true);
    try {
      const response = await fetch(`/api/clientes/${encodeURIComponent(id)}/valoraciones`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestas: answers, observaciones_profesional: notes, estado, consentimiento_salud_confirmado: consent }),
      });
      const result = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo guardar");
      toast.success(estado === "borrador" ? "Borrador registrado en el expediente" : "Valoración registrada en el expediente");
      await refresh();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Error al guardar"); }
    finally { setSaving(false); }
  }
  return <AppSidebar><main className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
    <Link href={`/clientes/${encodeURIComponent(id)}`} className="text-sm text-muted-foreground hover:underline">← Volver a la ficha del cliente</Link>
    <header><h1 className="text-3xl font-bold">Valoración inicial del cliente</h1><p className="mt-2 text-muted-foreground">Recoge información para diseñar planes individuales de entrenamiento y nutrición. Cada guardado crea una versión consultable en el expediente.</p></header>
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">No sustituye un diagnóstico ni una evaluación médica. Ante signos de alarma, lesiones o enfermedades relevantes, solicita revisión sanitaria cuando corresponda. Evita registrar datos de salud innecesarios.</div>
    {sections.map((section, index) => <section key={section.title} className="rounded-2xl border bg-card p-5 md:p-7"><h2 className="mb-5 text-xl font-bold">{index + 1}. {section.title}</h2><div className="grid gap-5">{section.fields.map(([key,label,type]) => <label key={key} className="block space-y-2"><span className="text-sm font-medium">{label}</span>{type === "textarea" ? <Textarea rows={3} value={answers[key] || ""} onChange={e => edit(key,e.target.value)} /> : type === "select" || type === "select-level" ? <select className="w-full rounded-lg border bg-background px-3 py-3" value={answers[key] || ""} onChange={e => edit(key,e.target.value)}><option value="">Sin responder</option>{(type === "select" ? ["No", "Sí", "Por determinar"] : ["Sin experiencia", "Principiante", "Intermedio", "Avanzado"]).map(opt => <option key={opt}>{opt}</option>)}</select> : <Input type={type} min={type === "number" ? "0" : undefined} value={answers[key] || ""} onChange={e => edit(key,e.target.value)} />}</label>)}</div></section>)}
    <section className="rounded-2xl border bg-card p-5"><h2 className="mb-3 text-xl font-bold">Observaciones del profesional</h2><Textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Prioridades, adaptaciones, aclaraciones, revisión pendiente..." /></section>
    <section className="rounded-2xl border bg-card p-5 space-y-4">
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1 h-4 w-4" /><span>Confirmo que he comprobado que el cliente ha prestado consentimiento explícito e informado para tratar los datos de salud necesarios para esta valoración. Este registro profesional no sustituye la prueba documental del consentimiento.</span></label>
      <div className="flex flex-wrap gap-3"><Button onClick={()=>save("borrador")} disabled={saving || !consent}>Guardar nueva versión como borrador</Button><Button onClick={()=>save("completada")} disabled={saving || !consent} variant="secondary">Finalizar valoración</Button></div>
    </section>
    <section className="rounded-2xl border bg-card p-5"><h2 className="text-xl font-bold">Valoraciones guardadas</h2>{busy ? <p className="mt-3 text-sm">Cargando…</p> : history.length ? <div className="mt-4 space-y-3">{history.map(v => <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"><div className="text-sm"><strong>{new Date(v.created_at).toLocaleDateString("es-ES")}</strong> · {v.estado}</div><Button variant="outline" size="sm" onClick={()=>{setAnswers(v.respuestas || {});setNotes(v.observaciones_profesional || "");setConsent(false);window.scrollTo({top:0,behavior:"smooth"});toast.info("Versión cargada para consultar o crear una nueva revisión")}}>Ver / reutilizar respuestas</Button></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Todavía no existen valoraciones registradas.</p>}</section>
  </main></AppSidebar>;
}
