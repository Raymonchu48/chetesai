"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Apple,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  Dumbbell,
  FileText,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Scale,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

type Client = { _id: string; nombre: string; email: string | null; telefono: string | null; objetivo: string; estado: string; fecha_alta: string; fecha_nacimiento: string | null; notas: string | null };
type NutritionPlan = { id: string; nombre: string; objetivo: string | null; calorias_objetivo: number | null; proteinas_g: number | null; carbohidratos_g: number | null; grasas_g: number | null; agua_ml: number | null; fecha_inicio: string; fecha_fin: string | null };
type Routine = { id: string; rutina_id: string; fecha_inicio: string; fecha_fin: string | null; progreso: number; rutinas: { nombre: string; objetivo: string; nivel: string; dias_semana: number; duracion_semanas: number | null; duracion_sesion_minutos: number | null } | Array<{ nombre: string; objetivo: string; nivel: string; dias_semana: number; duracion_semanas: number | null; duracion_sesion_minutos: number | null }> | null };
type Measurement = { id: string; fecha: string; peso_kg: number | null; grasa_corporal_pct: number | null; masa_muscular_kg: number | null; cintura_cm: number | null; notas_profesional: string | null };
type Habit = { id: string; nombre: string; categoria: string; tipo_registro: string; objetivo_valor: number | null; unidad: string | null };
type Session = { id: string; titulo: string; inicio_at: string; duracion_minutos: number; tipo_sesion: string; estado: string; modalidad: string; ubicacion: string | null };
type Payment = { id: string; concepto: string; importe_eur: number; fecha_emision: string; fecha_vencimiento: string | null; fecha_pago: string | null; estado: string; metodo_pago: string | null };
type ClientSummary = { cliente: Client; plan_nutricional: NutritionPlan | null; rutina_activa: Routine | null; mediciones: Measurement[]; habitos: Habit[]; adherencia_7_dias: number; sesiones: Session[]; proximas_sesiones: Session[]; pagos: Payment[]; pagos_pendientes: number; importe_pendiente: number };

const objectiveLabels: Record<string, string> = {
  perdida_peso: "Pérdida de peso",
  ganancia_muscular: "Ganancia muscular",
  tonificacion: "Tonificación",
  resistencia: "Resistencia",
  rehabilitacion: "Rehabilitación",
  bienestar_general: "Bienestar general",
};

export default function ClientWorkspacePage() {
  const params = useParams<{ id: string }>();
  const clientId = String(params.id || "");
  const [data, setData] = useState<ClientSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/clientes/${encodeURIComponent(clientId)}/resumen`, { cache: "no-store" });
      const result = (await response.json()) as { ok: boolean; data?: ClientSummary; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudo cargar el cliente");
      setData(result.data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el cliente");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => { load(); }, [load]);

  const latest = data?.mediciones[0];
  const previous = data?.mediciones[1];
  const coachingAreas = [
    { label: "Rutina asignada", ready: Boolean(data?.rutina_activa) },
    { label: "Plan nutricional", ready: Boolean(data?.plan_nutricional) },
    { label: "Valoración corporal", ready: Boolean(data?.mediciones.length) },
    { label: "Hábitos definidos", ready: Boolean(data?.habitos.length) },
  ];
  const coachingReady = coachingAreas.filter((area) => area.ready).length;

  if (loading && !data) return <AppSidebar><div className="mx-auto max-w-7xl p-6 md:p-8"><div className="h-[70vh] animate-pulse rounded-3xl border bg-muted/50" /></div></AppSidebar>;
  if (!data) return <AppSidebar><div className="mx-auto max-w-3xl p-8 text-center"><h1 className="text-2xl font-bold">No se pudo abrir el cliente</h1><Button asChild className="mt-5"><Link href="/clientes">Volver a clientes</Link></Button></div></AppSidebar>;

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">
        <Link href="/clientes" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" />Todos los clientes</Link>

        <header className="overflow-hidden rounded-[28px] border bg-gradient-to-br from-[#294435] via-[#365642] to-[#c9653b] text-white shadow-[0_22px_60px_rgba(41,68,53,0.22)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-center sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-white/15 text-3xl font-black ring-1 ring-white/20">{initials(data.cliente.nombre)}</div>
              <div>
                <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d9ecdc]">Espacio del cliente</p><Badge className="bg-white/15 text-white hover:bg-white/20">{data.cliente.estado}</Badge></div>
                <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{data.cliente.nombre}</h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/75">
                  {data.cliente.email ? <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{data.cliente.email}</span> : null}
                  {data.cliente.telefono ? <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4" />{data.cliente.telefono}</span> : null}
                  <span className="inline-flex items-center gap-2"><Target className="h-4 w-4" />{objectiveLabels[data.cliente.objetivo] || data.cliente.objetivo}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Button asChild variant="secondary"><Link href={`/nutricion?cliente_id=${clientId}`}><Apple className="mr-2 h-4 w-4" />Crear dieta</Link></Button>
              <Button asChild className="bg-white text-[#294435] hover:bg-white/90"><Link href="/rutinas"><Dumbbell className="mr-2 h-4 w-4" />Asignar rutina</Link></Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/15 hover:text-white" onClick={load} aria-label="Actualizar cliente"><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <WorkspaceMetric icon={<Scale className="h-5 w-5" />} label="Peso actual" value={formatMetric(latest?.peso_kg, "kg")} detail={measurementDelta(latest?.peso_kg, previous?.peso_kg)} />
          <WorkspaceMetric icon={<Activity className="h-5 w-5" />} label="Adherencia semanal" value={`${data.adherencia_7_dias}%`} detail={`${data.habitos.length} hábitos activos`} attention={data.habitos.length > 0 && data.adherencia_7_dias < 50} />
          <WorkspaceMetric icon={<CalendarDays className="h-5 w-5" />} label="Próxima sesión" value={data.proximas_sesiones[0] ? formatShortDate(data.proximas_sesiones[0].inicio_at) : "Sin cita"} detail={data.proximas_sesiones[0]?.titulo || "Agenda disponible"} />
          <WorkspaceMetric icon={<WalletCards className="h-5 w-5" />} label="Pendiente" value={formatMoney(data.importe_pendiente)} detail={`${data.pagos_pendientes} pagos pendientes`} attention={data.pagos_pendientes > 0} />
        </section>

        <Tabs defaultValue="resumen" className="mt-6">
          <div className="overflow-x-auto pb-1"><TabsList className="h-auto min-w-max justify-start rounded-2xl bg-muted/70 p-1.5">
            <Tab value="resumen" icon={<UserRound className="h-4 w-4" />} label="Resumen" />
            <Tab value="entrenamiento" icon={<Dumbbell className="h-4 w-4" />} label="Entrenamiento" />
            <Tab value="nutricion" icon={<Apple className="h-4 w-4" />} label="Nutrición" />
            <Tab value="progreso" icon={<TrendingUp className="h-4 w-4" />} label="Progreso" />
            <Tab value="habitos" icon={<CheckCircle2 className="h-4 w-4" />} label="Hábitos" />
            <Tab value="agenda" icon={<CalendarDays className="h-4 w-4" />} label="Agenda" />
            <Tab value="pagos" icon={<CircleDollarSign className="h-4 w-4" />} label="Pagos" />
            <Tab value="notas" icon={<FileText className="h-4 w-4" />} label="Notas" />
          </TabsList></div>

          <TabsContent value="resumen" className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <Card><CardContent className="p-6"><SectionTitle eyebrow="Visión 360º" title="Estado del acompañamiento" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><StatusCard title="Entrenamiento" ready={Boolean(data.rutina_activa)} detail={routineName(data.rutina_activa) || "Sin rutina activa"} href="/rutinas" /><StatusCard title="Nutrición" ready={Boolean(data.plan_nutricional)} detail={data.plan_nutricional?.nombre || "Sin plan nutricional"} href={`/nutricion?cliente_id=${clientId}`} /><StatusCard title="Progreso" ready={Boolean(data.mediciones.length)} detail={latest ? `Última medición: ${formatDate(latest.fecha)}` : "Sin valoración corporal"} href={`/progreso?cliente_id=${clientId}`} /><StatusCard title="Hábitos" ready={Boolean(data.habitos.length)} detail={data.habitos.length ? `${data.habitos.length} objetivos activos` : "Sin hábitos configurados"} href={`/nutricion?cliente_id=${clientId}`} /></div></CardContent></Card>
            <Card><CardContent className="p-6"><SectionTitle eyebrow="Preparación" title={`${coachingReady}/4 áreas configuradas`} /><div className="mt-5 h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-[#46624f] transition-all" style={{ width: `${coachingReady * 25}%` }} /></div><div className="mt-5 space-y-3">{coachingAreas.map((area) => <div key={area.label} className="flex items-center gap-3 text-sm"><CheckCircle2 className={`h-5 w-5 ${area.ready ? "text-emerald-600" : "text-muted-foreground/35"}`} /><span>{area.label}</span></div>)}</div></CardContent></Card>
            <Card className="xl:col-span-2"><CardContent className="p-0"><ListHeader title="Próximas sesiones" href="/sesiones" />{data.proximas_sesiones.length ? data.proximas_sesiones.map((session) => <SessionRow key={session.id} session={session} />) : <Empty text="No hay próximas sesiones programadas." />}</CardContent></Card>
          </TabsContent>

          <TabsContent value="entrenamiento" className="mt-5"><PlanPanel icon={<Dumbbell className="h-6 w-6" />} title="Plan de entrenamiento" exists={Boolean(data.rutina_activa)} empty="Este cliente todavía no tiene una rutina activa." action="Asignar rutina" href="/rutinas">{data.rutina_activa ? <div className="grid gap-4 sm:grid-cols-4"><Mini label="Rutina" value={routineName(data.rutina_activa) || "—"} /><Mini label="Nivel" value={routineInfo(data.rutina_activa)?.nivel || "—"} /><Mini label="Días/semana" value={String(routineInfo(data.rutina_activa)?.dias_semana || "—")} /><Mini label="Progreso" value={`${Number(data.rutina_activa.progreso || 0)}%`} /></div> : null}</PlanPanel></TabsContent>

          <TabsContent value="nutricion" className="mt-5"><PlanPanel icon={<Apple className="h-6 w-6" />} title="Plan nutricional" exists={Boolean(data.plan_nutricional)} empty="Este cliente todavía no tiene un plan nutricional activo." action="Crear dieta" href={`/nutricion?cliente_id=${clientId}`}>{data.plan_nutricional ? <div className="grid gap-4 sm:grid-cols-5"><Mini label="Plan" value={data.plan_nutricional.nombre} /><Mini label="Energía" value={formatMetric(data.plan_nutricional.calorias_objetivo, "kcal")} /><Mini label="Proteínas" value={formatMetric(data.plan_nutricional.proteinas_g, "g")} /><Mini label="Hidratos" value={formatMetric(data.plan_nutricional.carbohidratos_g, "g")} /><Mini label="Grasas" value={formatMetric(data.plan_nutricional.grasas_g, "g")} /></div> : null}</PlanPanel></TabsContent>

          <TabsContent value="progreso" className="mt-5"><Card><CardContent className="p-6"><div className="flex flex-wrap items-center justify-between gap-3"><SectionTitle eyebrow="Evolución" title="Peso y composición corporal" /><Button asChild><Link href={`/progreso?cliente_id=${clientId}`}><Plus className="mr-2 h-4 w-4" />Nueva medición</Link></Button></div><div className="mt-6"><WeightChart rows={data.mediciones} /></div></CardContent></Card></TabsContent>

          <TabsContent value="habitos" className="mt-5"><Card><CardContent className="p-0"><ListHeader title={`Hábitos activos · ${data.adherencia_7_dias}% semanal`} href={`/nutricion?cliente_id=${clientId}`} />{data.habitos.length ? data.habitos.map((habit) => <div key={habit.id} className="flex items-center gap-4 border-t px-6 py-4"><div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div><div><p className="font-semibold">{habit.nombre}</p><p className="text-sm text-muted-foreground">{habit.categoria}{habit.objetivo_valor ? ` · ${habit.objetivo_valor} ${habit.unidad || ""}` : ""}</p></div></div>) : <Empty text="No hay hábitos configurados." />}</CardContent></Card></TabsContent>

          <TabsContent value="agenda" className="mt-5"><Card><CardContent className="p-0"><ListHeader title="Historial y próximas sesiones" href="/sesiones" />{data.sesiones.length ? data.sesiones.map((session) => <SessionRow key={session.id} session={session} />) : <Empty text="No hay sesiones registradas." />}</CardContent></Card></TabsContent>

          <TabsContent value="pagos" className="mt-5"><Card><CardContent className="p-0"><ListHeader title="Pagos y facturación" href="/pagos" />{data.pagos.length ? data.pagos.map((payment) => <div key={payment.id} className="grid gap-3 border-t px-6 py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-semibold">{payment.concepto}</p><p className="text-sm text-muted-foreground">Emitido {formatDate(payment.fecha_emision)}</p></div><p className="font-bold">{formatMoney(payment.importe_eur)}</p><Badge className={payment.estado === "pagado" ? "bg-emerald-100 text-emerald-700" : payment.estado === "vencido" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{payment.estado}</Badge></div>) : <Empty text="No hay pagos registrados." />}</CardContent></Card></TabsContent>

          <TabsContent value="notas" className="mt-5"><Card><CardContent className="p-6"><SectionTitle eyebrow="Información profesional" title="Notas del cliente" /><p className="mt-5 whitespace-pre-line rounded-2xl bg-muted/40 p-5 text-sm leading-7 text-muted-foreground">{data.cliente.notas || "Todavía no hay notas profesionales registradas."}</p></CardContent></Card></TabsContent>
        </Tabs>
      </div>
    </AppSidebar>
  );
}

function Tab({ value, icon, label }: { value: string; icon: ReactNode; label: string }) { return <TabsTrigger value={value} className="gap-2 rounded-xl px-4 py-2.5">{icon}{label}</TabsTrigger>; }
function WorkspaceMetric({ icon, label, value, detail, attention = false }: { icon: ReactNode; label: string; value: string; detail: string; attention?: boolean }) { return <Card className={attention ? "border-amber-300" : ""}><CardContent className="flex items-start gap-4 p-5"><div className={`grid h-11 w-11 place-items-center rounded-xl ${attention ? "bg-amber-100 text-amber-700" : "bg-primary/10 text-primary"}`}>{icon}</div><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></div></CardContent></Card>; }
function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) { return <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p><h2 className="mt-1 text-xl font-bold sm:text-2xl">{title}</h2></div>; }
function StatusCard({ title, ready, detail, href }: { title: string; ready: boolean; detail: string; href: string }) { return <Link href={href} className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${ready ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200 bg-amber-50/50"}`}><div className="flex items-center justify-between"><p className="font-bold">{title}</p><ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5" /></div><p className="mt-2 text-sm text-muted-foreground">{detail}</p><span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{ready ? "Configurado" : "Pendiente"}</span></Link>; }
function PlanPanel({ icon, title, exists, empty, action, href, children }: { icon: ReactNode; title: string; exists: boolean; empty: string; action: string; href: string; children: ReactNode }) { return <Card><CardContent className="p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Plan activo</p><h2 className="text-2xl font-bold">{title}</h2></div></div><Button asChild><Link href={href}><Plus className="mr-2 h-4 w-4" />{action}</Link></Button></div>{exists ? <div className="mt-6">{children}</div> : <Empty text={empty} />}</CardContent></Card>; }
function Mini({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-muted/50 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-bold">{value}</p></div>; }
function ListHeader({ title, href }: { title: string; href: string }) { return <div className="flex items-center justify-between gap-4 px-6 py-5"><h2 className="text-xl font-bold">{title}</h2><Button asChild variant="outline" size="sm"><Link href={href}>Gestionar <ChevronRight className="ml-1 h-4 w-4" /></Link></Button></div>; }
function SessionRow({ session }: { session: Session }) { return <div className="grid gap-3 border-t px-6 py-4 sm:grid-cols-[145px_1fr_auto] sm:items-center"><div className="text-sm font-bold text-primary">{formatDateTime(session.inicio_at)}</div><div><p className="font-semibold">{session.titulo}</p><p className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{session.duracion_minutos} min</span>{session.ubicacion ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{session.ubicacion}</span> : null}</p></div><Badge variant="outline">{session.estado}</Badge></div>; }
function Empty({ text }: { text: string }) { return <div className="py-12 text-center text-sm text-muted-foreground"><Sparkles className="mx-auto mb-3 h-7 w-7 opacity-40" />{text}</div>; }
function WeightChart({ rows }: { rows: Measurement[] }) { const chart = [...rows].reverse().filter((row) => row.peso_kg !== null); if (chart.length < 2) return <Empty text="Se necesitan al menos dos mediciones para mostrar la evolución." />; const values = chart.map((row) => Number(row.peso_kg)); const min = Math.min(...values) - 1; const max = Math.max(...values) + 1; const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${90 - ((value - min) / (max - min || 1)) * 70}`).join(" "); return <div><svg viewBox="0 0 100 100" className="h-64 w-full" preserveAspectRatio="none" aria-label="Evolución del peso"><polyline points={points} fill="none" stroke="currentColor" className="text-primary" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />{points.split(" ").map((point, index) => { const [x, y] = point.split(","); return <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="currentColor" className="text-primary" />; })}</svg><div className="flex justify-between text-xs text-muted-foreground"><span>{formatDate(chart[0].fecha)}</span><span>{formatDate(chart[chart.length - 1].fecha)}</span></div></div>; }
function routineInfo(routine: Routine | null) { if (!routine?.rutinas) return null; return Array.isArray(routine.rutinas) ? routine.rutinas[0] || null : routine.rutinas; }
function routineName(routine: Routine | null) { return routineInfo(routine)?.nombre || null; }
function initials(name: string) { return name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function formatMetric(value: number | null | undefined, unit: string) { return value === null || value === undefined ? "—" : `${Number(value).toFixed(unit === "kcal" ? 0 : 1)} ${unit}`; }
function measurementDelta(current?: number | null, previous?: number | null) { if (current === null || current === undefined || previous === null || previous === undefined) return "Sin comparación anterior"; const value = Number(current) - Number(previous); return `${value > 0 ? "+" : ""}${value.toFixed(1)} kg desde la anterior`; }
function formatMoney(value: number) { return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(value || 0); }
function formatDate(value: string) { return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function formatShortDate(value: string) { return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" }).format(new Date(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
