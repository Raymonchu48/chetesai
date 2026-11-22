"use client";

import Link from "next/link";
import { Activity, Apple, ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, Dumbbell, HeartPulse, History, MessageCircle, Sparkles, TrendingUp } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

type SessionPreview = { id: string; day: number; date: string; series: number };
type Props = {
  routineName: string | null;
  routineMinutes: number | null;
  weeklySessions: number;
  weeklyGoal: number;
  assignedExercises: number;
  guideHref: string;
  history: SessionPreview[];
};
const WEEKDAYS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
function WidgetTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return <div className="client-widget-title"><span className="client-widget-title-icon" aria-hidden="true">{icon}</span><h2>{children}</h2></div>;
}
function TileLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link prefetch={false} href={href} className="client-widget-action">{children}<ArrowRight size={18} aria-hidden="true" /></Link>;
}
export default function ClientDashboardWidgets({ routineName, routineMinutes, weeklySessions, weeklyGoal, assignedExercises, guideHref, history }: Props) {
  const safeGoal = Math.max(1, weeklyGoal);
  const percentage = Math.min(100, Math.round(weeklySessions * 100 / safeGoal));
  const ringStyle = { "--client-ring-progress": percentage + "%" } as CSSProperties;
  const openCoach = () => window.dispatchEvent(new Event("chetesai:open-coach"));
  return (
    <section aria-label="Tu panel de bienestar" className="client-widgets" id="client-dashboard-widgets">
      <div className="client-widget-grid">
        <article className="client-widget client-widget-training">
          <header className="client-widget-top"><WidgetTitle icon={<Dumbbell />}>Mi entrenamiento</WidgetTitle><span className="client-widget-pill">Hoy me toca</span></header>
          <div className="client-widget-body"><h3 className="client-widget-headline">{routineName || "Tu planificación"}</h3><p className="client-widget-muted">{routineName ? (routineMinutes ? "Plan activo · " + routineMinutes + " min por sesión" : "Tu rutina asignada por el coach") : "Las rutinas aparecerán al asignarlas tu profesional."}</p></div>
          {routineName ? <TileLink href="#client-day-select">Consultar mi entrenamiento</TileLink> : <p className="client-widget-empty">Sin rutina asignada todavía</p>}
          <div className="client-widget-stats"><span><CheckCircle2 size={16} aria-hidden="true" /> {weeklySessions} de {safeGoal} sesiones esta semana</span><span>{percentage}%</span></div>
          <div className="client-widget-track" aria-hidden="true"><span style={{ width: percentage + "%" }} /></div>
        </article>
        <article className="client-widget client-widget-food">
          <header className="client-widget-top"><WidgetTitle icon={<Apple />}>Mis comidas</WidgetTitle><span className="client-widget-mini-label">Nutrición</span></header>
          <div className="client-widget-center"><span className="client-widget-food-icon"><Apple size={38} strokeWidth={1.8} aria-hidden="true" /></span><div><h3 className="client-widget-headline">Tu plan nutricional</h3><p className="client-widget-muted">Consulta tus comidas y hábitos preparados por tu profesional.</p></div></div>
          <div className="client-widget-tags"><span>Mis comidas</span><span>Plan semanal</span><span>Hábitos</span></div>
          <TileLink href="/portal/bienestar#plan-nutricional">Ver mis comidas</TileLink>
        </article>
        <article className="client-widget client-widget-progress">
          <header className="client-widget-top"><WidgetTitle icon={<TrendingUp />}>Mi progreso</WidgetTitle><span className="client-widget-mini-label">Esta semana</span></header>
          <div className="client-widget-progress-body"><div className="client-widget-ring" style={ringStyle} role="img" aria-label={percentage + " por ciento del objetivo semanal de entrenamiento"}><div className="client-widget-ring-inner"><strong>{percentage}%</strong><span>del objetivo</span></div></div><div className="client-widget-progress-copy"><strong>{weeklySessions} / {safeGoal}</strong><span>sesiones completadas</span><span className="client-widget-accent">Sigue tu evolución</span></div></div>
          <TileLink href="/portal/progreso">Ver mi progreso físico</TileLink>
        </article>
        <article className="client-widget client-widget-appointments">
          <header className="client-widget-top"><WidgetTitle icon={<CalendarDays />}>Mis citas</WidgetTitle><span className="client-widget-mini-label">Agenda</span></header>
          <div className="client-widget-appointment-panel"><span className="client-widget-appointment-icon"><CalendarDays size={32} aria-hidden="true" /></span><div><strong>Seguimiento con tu coach</strong><p>Consulta tus citas y solicitudes de reserva.</p></div><Clock3 className="client-widget-appointment-clock" size={23} aria-hidden="true" /></div>
          <TileLink href="/portal/citas">Ver mi agenda</TileLink>
        </article>
        <article className="client-widget client-widget-guides">
          <header className="client-widget-top"><WidgetTitle icon={<BookOpen />}>Guías</WidgetTitle><span className="client-widget-mini-label">Biblioteca</span></header>
          <div className="client-widget-guide-tiles"><div><Dumbbell size={25} aria-hidden="true" /><strong>Ejercicios</strong><span>{assignedExercises} asignados</span></div><div><BookOpen size={25} aria-hidden="true" /><strong>Técnica</strong><span>Paso a paso</span></div><div><Activity size={25} aria-hidden="true" /><strong>Ejecución</strong><span>Contenido visual</span></div></div>
          <TileLink href={guideHref}>Explorar mis guías</TileLink>
        </article>
        <article className="client-widget client-widget-wellness">
          <header className="client-widget-top"><WidgetTitle icon={<HeartPulse />}>Bienestar de hoy</WidgetTitle><span className="client-widget-mini-label">Autocuidado</span></header>
          <div className="client-widget-wellness-row"><div><span><HeartPulse size={23} aria-hidden="true" /></span><strong>Bienestar</strong></div><div><span><Activity size={23} aria-hidden="true" /></span><strong>Actividad</strong></div><div><span><Apple size={23} aria-hidden="true" /></span><strong>Hábitos</strong></div></div>
          <p className="client-widget-muted">Registra cómo te encuentras y consulta los hábitos de tu planificación.</p>
          <TileLink href="/portal/bienestar#habitos">Consultar mis hábitos</TileLink>
        </article>
        <article className="client-widget client-widget-coach">
          <header className="client-widget-top"><WidgetTitle icon={<Sparkles />}>Bot acompañante</WidgetTitle><span className="client-widget-pill client-widget-pill-dark">IA + Coach</span></header>
          <div className="client-widget-body"><h3 className="client-widget-headline">Pregunta al coach</h3><p className="client-widget-muted">Tu asistente de entrenamiento, nutrición y bienestar conserva todas sus funciones.</p></div>
          <button type="button" className="client-widget-action client-widget-action-coach" onClick={openCoach} aria-label="Abrir Chetesaí Coach IA"><MessageCircle size={19} aria-hidden="true" /><span>Abrir el asistente</span><ArrowRight size={18} aria-hidden="true" /></button>
        </article>
        <article className="client-widget client-widget-history">
          <header className="client-widget-top"><WidgetTitle icon={<History />}>Historial reciente</WidgetTitle><span className="client-widget-mini-label">Actividad real</span></header>
          <div className="client-widget-history-rows">
            {history.length ? history.slice(0, 2).map((entry) => <div key={entry.id} className="client-widget-history-item"><span className="client-widget-history-icon"><CheckCircle2 size={21} aria-hidden="true" /></span><div><strong>Entrenamiento completado</strong><span>{WEEKDAYS[entry.day - 1] || "Sesión"} · {new Date(entry.date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} · {entry.series} series</span></div><CheckCircle2 className="client-widget-history-check" size={20} aria-hidden="true" /></div>) : <p className="client-widget-empty">Tus sesiones completadas aparecerán aquí.</p>}
          </div>
          <a className="client-widget-action" href="#client-history-anchor">Consultar historial<ArrowRight size={18} aria-hidden="true" /></a>
        </article>
      </div>
    </section>
  );
}
