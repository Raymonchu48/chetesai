"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  PlayCircle,
  Plus,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { files } from "@/assets/files";

const PROFILE_IMAGE_URL = "/brand/raymond-vega-profile.webp";
const PROFILE_PDF_URL = "https://raymonchu48.github.io/Deportivo/Carta_presentacion_deportiva_profesional.pdf";

const services = [
  { image: "/brand/chetesai-entrenamiento-personal.webp", imageAlt: "Entrenador Chetesaí Fitness+ acompañando una sesión de entrenamiento personal", title: "Entrenamiento personal", description: "Sesiones 1:1 adaptadas a tus objetivos, nivel y estilo de vida." },
  { image: "/brand/chetesai-grupos-reducidos.webp", imageAlt: "Dos clientas entrenando en grupo con supervisión de un entrenador Chetesaí Fitness+", title: "Grupos reducidos", description: "Dos a cuatro personas sin perder atención, técnica ni calidad." },
  { image: "/brand/chetesai-seguimiento-continuo.webp", imageAlt: "Entrenador y clienta con camisetas Chetesaí Fitness+ durante una sesión de seguimiento", imagePosition: "center 33%", title: "Seguimiento continuo", description: "Valoraciones periódicas y ajustes para que sigas avanzando." },
  { image: "/brand/chetesai-rutina-adaptada.webp", imageAlt: "Entrenador Chetesaí Fitness+ guiando una rutina adaptada en grupo", title: "Rutina adaptada", description: "Un plan realista, progresivo y preparado específicamente para ti." },
  { image: "/brand/chetesai-tecnica-progreso.webp", imageAlt: "Entrenador Chetesaí Fitness+ corrigiendo la técnica de una zancada con mancuernas", imagePosition: "64% 56%", title: "Técnica y progreso", description: "Mejora cómo te mueves y consigue resultados medibles." },
];

const steps = [
  { number: "1", icon: CalendarDays, title: "Solicita tu valoración", description: "Cuéntanos tu objetivo, disponibilidad y modalidad preferida." },
  { number: "2", icon: Target, title: "Valoramos y planificamos", description: "Analizamos tu punto de partida y creamos una propuesta realista." },
  { number: "3", icon: CheckCircle2, title: "Entrenas y progresas", description: "Te acompañamos, medimos el avance y ajustamos el plan." },
];

const personalPlans = [
  { name: "Básico", sessions: "4 sesiones / mes", price: "75 €", perSession: "18,75 € por sesión", features: ["Valoración inicial", "Programación mensual", "Seguimiento básico"] },
  { name: "Activo", sessions: "8 sesiones / mes", price: "130 €", perSession: "16,25 € por sesión", popular: true, features: ["Valoración inicial", "Revisión quincenal", "Mensajería de soporte"] },
  { name: "Intensivo", sessions: "12 sesiones / mes", price: "165 €", perSession: "13,75 € por sesión", features: ["Valoración inicial", "Ajustes semanales", "Revisión técnica en vídeo"] },
];

const groupPlans = [
  { name: "Grupo Básico", sessions: "4 sesiones / mes", price: "45 €" },
  { name: "Grupo Activo", sessions: "8 sesiones / mes", price: "80 €" },
  { name: "Grupo Intensivo", sessions: "12 sesiones / mes", price: "110 €" },
];

const faqs = [
  { question: "¿Hay matrícula o permanencia?", answer: "No hay matrícula ni permanencia. Puedes cambiar de modalidad al finalizar cada mes." },
  { question: "¿Puedo recuperar una sesión perdida?", answer: "Con aviso previo de 24 horas se puede reubicar dentro del mismo mes, según disponibilidad." },
  { question: "¿Dónde se realizan los entrenamientos?", answer: "Las sesiones se organizan en espacios indoor o exteriores de Mallorca según disponibilidad y ubicación." },
  { question: "¿Necesito experiencia previa?", answer: "No. El programa se adapta a tu condición física, experiencia y punto de partida." },
];

const highlightedCredentials = [
  {
    tag: "FORMACIÓN OFICIAL",
    title: "Certificado Profesional de Acondicionamiento Físico en Sala Polivalente",
    detail: "Nivel 3 · Validez oficial nacional.",
    featured: true,
  },
  {
    tag: "NUTRICIÓN",
    title: "Máster Experto en Alimentación y Nutrición",
    detail: "Nutrición deportiva, dietoterapia y planificación dietética.",
  },
  {
    tag: "PSICOLOGÍA DEPORTIVA",
    title: "Máster en Coaching y Psicología Deportiva",
    detail: "Motivación, liderazgo, emociones y rendimiento.",
  },
];

export default function Main() {
  const [showRates, setShowRates] = useState(false);
  const [showValuation, setShowValuation] = useState(false);
  const [showPresentationVideo, setShowPresentationVideo] = useState(false);
  const [sending, setSending] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    if (!showPresentationVideo && !showValuation) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (showPresentationVideo) setShowPresentationVideo(false);
      else setShowValuation(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showPresentationVideo, showValuation]);

  const revealRates = useCallback(() => {
    setShowRates(true);
    window.setTimeout(() => document.getElementById("tarifas")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, []);

  const openValuation = useCallback(() => {
    setShowRates(false);
    setShowPresentationVideo(false);
    setShowValuation(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const directValuation =
      params.get("valoracion") === "1" ||
      params.get("valoracion") === "true" ||
      window.location.hash === "#valoracion";

    if (directValuation) {
      openValuation();
    }
  }, [openValuation]);

  const returnToStart = useCallback(() => {
    setShowValuation(false);
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 80);
  }, []);

  useEffect(() => {
    const handleOpenValuation = () => openValuation();
    const handleOpenRates = () => revealRates();
    window.addEventListener("chetesai:open-valuation", handleOpenValuation);
    window.addEventListener("chetesai:open-rates", handleOpenRates);
    return () => {
      window.removeEventListener("chetesai:open-valuation", handleOpenValuation);
      window.removeEventListener("chetesai:open-rates", handleOpenRates);
    };
  }, [openValuation, revealRates]);

  function goTo(section: string) {
    if (section !== "tarifas") setShowRates(false);
    window.setTimeout(() => {
      if (section === "inicio") window.scrollTo({ top: 0, behavior: "smooth" });
      else document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  async function submitReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setFormMessage(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const response = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.get("nombre"),
          email: formData.get("email"),
          telefono: formData.get("telefono"),
          modalidad: formData.get("modalidad"),
          objetivo: formData.get("objetivo"),
          mensaje: formData.get("mensaje"),
          fecha_preferida: formData.get("fecha_preferida"),
          franja_horaria: formData.get("franja_horaria"),
          consentimiento: formData.get("consentimiento") === "on",
          website: formData.get("website"),
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo enviar la solicitud");
      form.reset();
      setFormMessage({ type: "success", text: "Solicitud recibida. Te enviaremos un correo para confirmar la hora o proponerte una alternativa." });
    } catch (error) {
      setFormMessage({ type: "error", text: error instanceof Error ? error.message : "No se pudo enviar la solicitud" });
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="landing-premium min-h-screen bg-landing-bg pt-20 font-landing-sans text-landing-text">
      <header className="fixed inset-x-0 top-0 z-[75] border-b border-landing-border bg-landing-bg/95 text-landing-text shadow-xl shadow-black/30 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-2 pl-[4.75rem] pr-3 sm:gap-3 sm:pl-[5.25rem] sm:pr-5 lg:pr-8 xl:px-8" aria-label="Navegación principal">
          <button type="button" onClick={() => goTo("inicio")} className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-landing-border bg-landing-card p-1 text-left shadow-lg sm:max-w-none sm:flex-initial sm:shrink-0 sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
            <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl p-1 sm:h-12 sm:w-12 sm:border sm:border-landing-border sm:bg-landing-card sm:p-1.5 sm:shadow-lg"><img src={files.logo.url} alt="Chetesaí Fitness+" className="h-full w-full object-contain" /></div>
            <div className="min-w-0 pr-1 sm:pr-0"><p className="truncate text-[11px] font-medium leading-tight text-landing-text sm:text-base">Chetesaí Fitness+</p><p className="truncate text-[9px] leading-tight text-landing-muted sm:text-xs">Entrenamiento personalizado</p></div>
          </button>
          <div className="hidden items-center gap-7 text-sm font-medium text-landing-muted xl:flex">
            <button type="button" onClick={() => goTo("servicios")} className="transition-colors duration-200 hover:text-landing-lime">Servicios</button>
            <button type="button" onClick={() => goTo("proceso")} className="transition-colors duration-200 hover:text-landing-lime">Cómo funciona</button>
            <button type="button" onClick={() => goTo("sobre-mi")} className="transition-colors duration-200 hover:text-landing-lime">Sobre mí</button>
            <button type="button" onClick={() => goTo("faq")} className="transition-colors duration-200 hover:text-landing-lime">FAQ</button>
            <Link href="/login" className="transition-colors duration-200 hover:text-landing-lime">Acceso clientes</Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button className="rounded-lg bg-gradient-to-b from-landing-lime to-landing-lime-dark px-3 font-medium text-landing-bg shadow-[0_3px_12px_rgba(200,224,108,0.25)] transition-[filter,box-shadow] duration-200 hover:brightness-105 hover:text-landing-bg hover:shadow-[0_5px_16px_rgba(200,224,108,0.3)] sm:px-4 lg:px-5" onClick={openValuation}>
              <CalendarDays className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Reserva tu valoración</span>
              <span className="sm:hidden">Reserva</span>
            </Button>
            <Button variant="outline" className="hidden rounded-lg border-landing-silver-start bg-transparent px-4 text-landing-text transition-colors duration-200 hover:border-landing-silver-end hover:bg-landing-card hover:text-landing-text sm:inline-flex lg:px-5" onClick={revealRates}>
              Ver tarifas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </nav>
      </header>

      <section id="inicio" className="relative min-h-[640px] overflow-hidden bg-landing-bg">
        <div
          aria-hidden="true"
          className="hero-media absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/brand/chetesai-hero-poster.webp')" }}
        />
        <video
          className="hero-media absolute inset-0 h-full w-full object-cover object-center motion-reduce:hidden xl:left-[36%] xl:right-0 xl:w-[64%] xl:object-[center_42%]"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/brand/chetesai-hero-poster.webp"
          aria-hidden="true"
        >
          <source src="/brand/chetesai-hero-loop.mp4" type="video/mp4" />
        </video>
        <div
          className="hero-shade absolute inset-0 xl:hidden"
          style={{
            background:
              "linear-gradient(90deg, rgba(11,13,12,0.94) 0%, rgba(11,13,12,0.68) 40%, rgba(11,13,12,0.25) 68%, rgba(11,13,12,0.08) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 hidden w-[40%] xl:block"
          style={{
            background:
              "linear-gradient(90deg, rgba(11,13,12,0.99) 0%, rgba(11,13,12,0.96) 78%, rgba(11,13,12,0.74) 90%, rgba(11,13,12,0) 100%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden sm:block"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.34) 100%)",
          }}
        />

        <div className="relative z-10 mx-auto flex max-w-7xl px-5 pb-20 pt-16 sm:pt-10 lg:px-8 lg:pb-24 lg:pt-8 xl:mx-0 xl:max-w-none xl:px-0 xl:pb-20 xl:pt-10">
          <div className="w-full max-w-[560px] xl:w-[36%] xl:max-w-none xl:px-[clamp(2.5rem,4vw,4.75rem)]">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[1.5px] text-landing-lime">Entrenamiento personal y grupos reducidos en Mallorca</p>
            <h1 className="max-w-[560px] font-brand text-5xl font-semibold leading-[1] tracking-[-0.025em] text-landing-text md:text-[3.5rem] xl:max-w-full xl:text-[clamp(2.75rem,3vw,3.5rem)]">Entrena con cabeza.<br /><span>Mejora con método.</span></h1>
            <p className="mt-6 max-w-[520px] text-lg leading-8 text-landing-muted xl:max-w-full xl:text-base xl:leading-7">Un enfoque realista, progresivo y medible para mejorar tu condición física sin rutinas genéricas ni promesas de humo.</p>
            <div className="mt-5">
              <p className="flex items-center gap-2 text-sm font-medium text-landing-lime"><Target className="h-4 w-4" />Valoración inicial y planificación personalizada</p>
              <button
                type="button"
                onClick={() => setShowPresentationVideo(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border border-landing-silver-start bg-transparent px-5 py-3 text-sm font-medium text-landing-text shadow-lg backdrop-blur-sm transition-colors duration-200 hover:border-landing-silver-end hover:bg-landing-card/75 focus:outline-none focus:ring-2 focus:ring-landing-lime focus:ring-offset-2 focus:ring-offset-landing-bg"
              >
                <PlayCircle className="h-5 w-5 text-landing-lime" />
                Ver presentación
              </button>
            </div>
          </div>
        </div>

      </section>

      {showPresentationVideo ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="presentation-video-title">
          <button
            type="button"
            aria-label="Cerrar la presentación"
            className="absolute inset-0 cursor-default bg-black/85 backdrop-blur-md"
            onClick={() => setShowPresentationVideo(false)}
          />
          <div className="relative z-10 w-full max-w-5xl overflow-hidden rounded-xl border border-landing-border bg-black shadow-2xl shadow-black/60">
            <h2 id="presentation-video-title" className="sr-only">Presentación de Chetesaí Fitness+</h2>
            <button
              type="button"
              aria-label="Cerrar vídeo"
              onClick={() => setShowPresentationVideo(false)}
              className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-landing-silver-start bg-landing-bg/85 text-landing-text shadow-lg backdrop-blur-md transition-colors duration-200 hover:border-landing-silver-end hover:bg-landing-card focus:outline-none focus:ring-2 focus:ring-landing-lime sm:right-4 sm:top-4"
            >
              <X className="h-5 w-5" />
            </button>
            <video className="aspect-video w-full bg-black object-contain" controls autoPlay playsInline preload="metadata" poster="/brand/chetesai-presentacion-poster.webp">
              <source src="/brand/chetesai-presentacion.mp4" type="video/mp4" />
              Tu navegador no puede reproducir este vídeo.
            </video>
          </div>
        </div>
      ) : null}

      <section id="servicios" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-16 lg:px-8">
        <div className="text-center"><p className="font-landing-mono text-[11px] font-medium uppercase tracking-[1px] text-landing-lime">Servicios</p><h2 className="mt-3 font-brand text-3xl font-semibold text-landing-text md:text-5xl">Todo lo que necesitas para entrenar mejor</h2><p className="mx-auto mt-4 max-w-2xl text-landing-muted">Atención cercana, planificación profesional y seguimiento para que el entrenamiento encaje en tu vida.</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {services.map((service) => {
            return (
              <article
                key={service.title}
                className={`overflow-hidden rounded-xl border-[0.5px] border-landing-border bg-landing-card text-center shadow-[0_2px_10px_rgba(0,0,0,0.25)] transition-[border-color,box-shadow] duration-200 hover:border-landing-silver-start hover:shadow-[0_5px_18px_rgba(0,0,0,0.34)] ${service.image ? "" : "p-5"}`}
              >
                {service.image ? (
                  <div className="relative aspect-[3/2] w-full bg-landing-bg">
                    <Image
                      src={service.image}
                      alt={service.imageAlt ?? service.title}
                      fill
                      sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) calc(50vw - 2rem), 240px"
                      className="object-cover"
                      style={{ objectPosition: service.imagePosition ?? "center" }}
                    />
                    <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-landing-bg/65 to-transparent" />
                  </div>
                ) : null}
                <div className={service.image ? "px-5 pb-5 pt-4" : ""}>
                  <h3 className={`${service.image ? "" : "mt-4"} font-brand text-base font-medium leading-6 text-landing-text`}>{service.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-landing-muted">{service.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="proceso" className="scroll-mt-20 border-y border-landing-border bg-landing-card/35">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <div className="text-center">
            <p className="font-landing-mono text-[11px] font-medium uppercase tracking-[1px] text-landing-lime">Cómo funciona</p>
            <h2 className="mt-3 font-brand text-3xl font-semibold text-landing-text md:text-5xl">Un proceso sencillo y personal</h2>
            <p className="mx-auto mt-4 max-w-2xl text-landing-muted">Tres pasos conectados, con acompañamiento desde la primera conversación hasta cada ajuste del plan.</p>
          </div>

          <div className="relative mt-11">
            <div aria-hidden="true" className="absolute bottom-[22px] left-[22px] top-[22px] w-px bg-gradient-to-b from-landing-silver-start via-landing-silver-end to-landing-silver-start md:hidden" />
            <div aria-hidden="true" className="absolute left-[16.666%] right-[16.666%] top-[22px] hidden h-px bg-gradient-to-r from-landing-silver-start via-landing-silver-end to-landing-silver-start md:block" />
            <div className="grid gap-9 md:grid-cols-3 md:gap-8">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <article key={step.number} className="relative z-10 grid grid-cols-[44px_1fr] items-start gap-5 text-left md:block md:text-center">
                    <div className={`relative grid h-11 w-11 place-items-center rounded-full border bg-gradient-to-br from-landing-step-start to-landing-step-end text-landing-text md:mx-auto ${index === steps.length - 1 ? "border-landing-lime shadow-[0_0_14px_rgba(200,224,108,0.25)]" : "border-landing-silver-start"}`}>
                      <StepIcon className="h-4 w-4" />
                      <span className={`absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-landing-border bg-landing-card font-landing-mono text-[10px] font-medium ${index === steps.length - 1 ? "text-landing-lime" : "bg-gradient-to-b from-landing-lime to-landing-lime-dark bg-clip-text text-transparent"}`}>{step.number}</span>
                    </div>
                    <div>
                      <h3 className="font-brand text-lg font-medium text-landing-text md:mt-5">{step.title}</h3>
                      <p className="mt-2 max-w-xs text-sm leading-6 text-landing-muted md:mx-auto">{step.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {showRates ? (
        <section id="tarifas" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 lg:px-8">
          <div className="text-center">
            <p className="font-landing-mono text-[11px] font-medium uppercase tracking-[1px] text-landing-lime">Bonos mensuales</p>
            <h2 className="mt-3 font-brand text-3xl font-semibold text-landing-text md:text-5xl">Elige el ritmo que encaja contigo</h2>
            <p className="mx-auto mt-4 max-w-2xl text-landing-muted">Planes flexibles, sin matrícula ni permanencia.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {personalPlans.map((plan) => (
              <article key={plan.name} className={`relative rounded-xl border-[0.5px] bg-landing-card p-7 shadow-[0_2px_10px_rgba(0,0,0,0.25)] ${plan.popular ? "border-landing-lime ring-1 ring-landing-lime/25" : "border-landing-border"}`}>
                {plan.popular ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-landing-lime to-landing-lime-dark px-4 py-1 font-landing-mono text-[10px] font-medium uppercase tracking-[1px] text-landing-bg">Más popular</span> : null}
                <p className="text-center font-brand text-2xl font-semibold text-landing-text">{plan.name}</p>
                <p className="mt-2 text-center font-landing-mono text-xs font-medium text-landing-lime">{plan.sessions}</p>
                <p className="mt-6 text-center font-brand text-4xl font-semibold text-landing-text">{plan.price}<span className="font-landing-sans text-base font-normal text-landing-muted"> / mes</span></p>
                <p className="mt-1 text-center text-sm text-landing-muted">{plan.perSession}</p>
                <div className="mt-7 space-y-3">{plan.features.map((feature) => <p key={feature} className="flex items-center gap-2 text-sm text-landing-text"><CheckCircle2 className="h-4 w-4 text-landing-lime" />{feature}</p>)}</div>
                <Button className="mt-7 w-full rounded-lg bg-gradient-to-b from-landing-lime to-landing-lime-dark font-medium text-landing-bg shadow-[0_3px_12px_rgba(200,224,108,0.2)] transition-[filter] duration-200 hover:brightness-105 hover:text-landing-bg" onClick={openValuation}>Elegir {plan.name}</Button>
              </article>
            ))}
          </div>
          <div className="mt-10 rounded-xl border-[0.5px] border-landing-border bg-landing-card p-7 shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-landing-mono text-[10px] font-medium uppercase tracking-[1px] text-landing-lime">Grupos reducidos 2–4</p>
                <h3 className="mt-2 font-brand text-2xl font-medium text-landing-text">Comparte el entrenamiento, no la atención</h3>
                <p className="mt-2 text-landing-muted">Puedes venir con tu grupo o solicitar plaza en uno compatible.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {groupPlans.map((plan) => (
                  <div key={plan.name} className="rounded-xl border-[0.5px] border-landing-border bg-landing-bg px-5 py-4 text-center">
                    <p className="font-brand font-medium text-landing-text">{plan.name}</p>
                    <p className="mt-1 text-xs text-landing-muted">{plan.sessions}</p>
                    <p className="mt-2 font-landing-mono text-xl font-medium text-landing-lime">{plan.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section id="faq" className="scroll-mt-20 border-b border-landing-border bg-landing-bg">
        <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8">
          <div className="text-center">
            <p className="font-landing-mono text-[11px] font-medium uppercase tracking-[1px] text-landing-lime">Preguntas frecuentes</p>
            <h2 className="mt-3 font-brand text-3xl font-semibold text-landing-text md:text-5xl">Antes de empezar</h2>
            <p className="mx-auto mt-4 max-w-xl text-landing-muted">Lo esencial, explicado de forma clara antes de reservar tu primera valoración.</p>
          </div>

          <div className="mt-10 overflow-hidden rounded-xl border-[0.5px] border-landing-border bg-landing-card shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              const buttonId = `faq-button-${index}`;
              const answerId = `faq-answer-${index}`;
              return (
                <div key={faq.question} className={index < faqs.length - 1 ? "border-b border-landing-border" : ""}>
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => setOpenFaqIndex((current) => current === index ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition-colors duration-200 hover:bg-landing-bg/55 sm:px-7"
                  >
                    <span className="font-medium text-landing-text">{faq.question}</span>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${isOpen ? "border-landing-lime bg-landing-lime text-landing-bg" : "border-landing-border bg-landing-bg text-landing-lime"}`}>
                      <Plus className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`} />
                    </span>
                  </button>
                  {isOpen ? (
                    <div id={answerId} role="region" aria-labelledby={buttonId} className="px-6 pb-5 pr-16 text-sm leading-6 text-landing-muted sm:px-7 sm:pr-20">
                      {faq.answer}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contacto" className="scroll-mt-20 bg-landing-bg text-landing-text">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          {showValuation ? (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="valuation-dialog-title"
              className="fixed inset-0 z-[120] flex items-stretch justify-center sm:items-center sm:p-5"
            >
              <button
                type="button"
                aria-label="Cerrar la primera valoración"
                onClick={() => setShowValuation(false)}
                className="absolute inset-0 cursor-default bg-black/80 backdrop-blur-md"
              />

              <div className="relative z-10 flex h-[100dvh] w-full flex-col overflow-hidden bg-landing-card shadow-2xl shadow-black/60 sm:h-[min(92dvh,900px)] sm:max-w-6xl sm:rounded-xl sm:border sm:border-landing-border">
                <header className="flex shrink-0 items-center justify-between gap-4 border-b border-landing-border bg-landing-bg px-4 py-3 text-landing-text sm:px-6 sm:py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-landing-lime/45 bg-landing-card p-1.5">
                      <Image src="/brand/chetesai-logo-mark.svg" alt="" width={44} height={44} className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-landing-mono text-[10px] font-medium uppercase tracking-[1px] text-landing-lime">Chetesaí Fitness+</p>
                      <h2 id="valuation-dialog-title" className="truncate font-brand text-base font-semibold sm:text-lg">Primera valoración</h2>
                    </div>
                  </div>
                  <button
                    type="button"
                    autoFocus
                    aria-label="Cerrar y volver a la página"
                    onClick={() => setShowValuation(false)}
                    className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-landing-silver-start bg-transparent px-3 text-sm font-medium text-landing-text transition-colors duration-200 hover:border-landing-silver-end hover:bg-landing-card focus:outline-none focus:ring-2 focus:ring-landing-lime sm:px-4"
                  >
                    <span className="hidden sm:inline">Volver a la página</span>
                    <X className="h-5 w-5" />
                  </button>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                  <div className="lg:grid lg:min-h-full lg:grid-cols-[0.88fr_1.12fr]">
                    <div className="flex flex-col p-5 text-landing-text sm:p-8 lg:p-10">
                      <p className="font-landing-mono text-[10px] font-medium uppercase tracking-[1px] text-landing-lime">Tu punto de partida</p>
                      <h3 className="mt-3 font-brand text-3xl font-semibold sm:text-4xl">Cuéntame tu objetivo</h3>
                      <p className="mt-4 max-w-lg text-sm leading-6 text-landing-muted sm:text-base sm:leading-7">Envíame tus datos y te responderé para valorar tu situación y encontrar la modalidad más adecuada.</p>

                      <div className="relative mt-7 hidden min-h-[230px] flex-1 overflow-hidden rounded-xl border border-landing-border bg-landing-bg shadow-2xl shadow-black/30 lg:block">
                        <Image
                          src="/brand/chetesai-valoracion-retrato.webp"
                          alt="Raymond Vega, entrenador de Chetesaí Fitness+"
                          fill
                          sizes="420px"
                          className="object-cover object-[center_35%]"
                        />
                        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-landing-bg/90 via-transparent to-black/5" />
                        <p className="absolute bottom-5 left-5 right-5 text-sm font-medium tracking-wide text-landing-text">Entrenamiento cercano, técnico y personalizado</p>
                      </div>

                      <div className="mt-6 grid gap-3 text-xs leading-5 text-landing-muted sm:grid-cols-2 lg:grid-cols-1">
                        <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-landing-lime" /><span>Mallorca, Islas Baleares</span></p>
                        <p className="flex items-start gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-landing-lime" /><span className="break-all">chetesaifitness@gmail.com</span></p>
                        <p className="flex items-start gap-3"><Clock className="mt-0.5 h-4 w-4 shrink-0 text-landing-lime" /><span>Respuesta habitual en menos de 24 horas</span></p>
                        <p className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-landing-lime" /><span>Uso exclusivo de los datos para atender tu solicitud</span></p>
                      </div>
                    </div>

                    <form id="formulario-valoracion" onSubmit={submitReservation} className="border-t border-landing-border bg-landing-card p-5 text-landing-text sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
                      <div className="mb-7">
                        <p className="font-landing-mono text-[10px] font-medium uppercase tracking-[1px] text-landing-lime">Formulario de valoración</p>
                        <h3 className="mt-2 font-brand text-2xl font-semibold sm:text-3xl">Tu valoración empieza aquí</h3>
                        <p className="mt-2 text-sm leading-6 text-landing-muted">Completa tus datos y te responderé para confirmar el mejor punto de partida.</p>
                      </div>
                      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field name="nombre" label="Nombre" required />
                        <Field name="email" label="Email" type="email" required />
                        <Field name="telefono" label="Teléfono" type="tel" />
                        <label className="space-y-2 text-sm font-medium">Modalidad<select name="modalidad" defaultValue="orientacion" className="w-full rounded-lg border border-landing-border bg-landing-bg px-4 py-3 font-normal text-landing-text outline-none [color-scheme:dark] focus:border-landing-lime"><option value="entrenamiento_personal">Entrenamiento personal</option><option value="grupo_reducido">Grupo reducido</option><option value="orientacion">Quiero orientación</option></select></label>
                        <Field name="fecha_preferida" label="Fecha preferida" type="date" required />
                        <Field name="franja_horaria" label="Hora aproximada" type="time" required />
                      </div>
                      <p className="mt-2 text-xs text-landing-muted">La hora solicitada queda pendiente de confirmación según disponibilidad.</p>
                      <label className="mt-4 block space-y-2 text-sm font-medium">Objetivo principal<input name="objetivo" className="w-full rounded-lg border border-landing-border bg-landing-bg px-4 py-3 font-normal text-landing-text outline-none placeholder:text-landing-muted focus:border-landing-lime" placeholder="Mejorar condición física, ganar fuerza, perder grasa..." /></label>
                      <label className="mt-4 block space-y-2 text-sm font-medium">Cuéntame un poco más<textarea name="mensaje" rows={4} className="w-full rounded-lg border border-landing-border bg-landing-bg px-4 py-3 font-normal text-landing-text outline-none focus:border-landing-lime" /></label>
                      <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-landing-muted"><input type="checkbox" name="consentimiento" required className="mt-1 [accent-color:var(--landing-lime)]" />Acepto que mis datos sean utilizados para responder a esta solicitud de información.</label>
                      {formMessage ? <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${formMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{formMessage.text}</p> : null}
                      <Button type="submit" disabled={sending} className="mt-6 w-full rounded-lg bg-gradient-to-b from-landing-lime to-landing-lime-dark py-6 text-base font-medium text-landing-bg shadow-[0_3px_12px_rgba(200,224,108,0.22)] transition-[filter] duration-200 hover:brightness-105 hover:text-landing-bg">{sending ? "Enviando solicitud..." : "Solicitar valoración"}</Button>
                      <button
                        type="button"
                        onClick={returnToStart}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-landing-silver-start px-5 py-3.5 text-sm font-medium text-landing-text transition-colors duration-200 hover:border-landing-silver-end hover:bg-landing-bg hover:text-landing-lime focus:outline-none focus:ring-2 focus:ring-landing-lime/40"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al inicio
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

            <article id="sobre-mi" className="mx-auto mt-10 max-w-5xl scroll-mt-24 rounded-xl border-[0.5px] border-landing-border bg-landing-card p-5 shadow-[0_2px_10px_rgba(0,0,0,0.25)] sm:p-6">
              <div className="grid gap-6 sm:grid-cols-[160px_1fr] sm:items-center">
                <div className="mx-auto h-36 w-36 overflow-hidden rounded-full border-[1.5px] border-landing-lime bg-landing-bg shadow-[0_0_16px_rgba(200,224,108,0.2)] sm:mx-0 sm:h-40 sm:w-40">
                  <img src={PROFILE_IMAGE_URL} alt="Raymond Vega, entrenador y profesional del deporte" className="h-full w-full object-cover object-top" />
                </div>
                <div>
                  <p className="font-landing-mono text-[10px] font-medium uppercase tracking-[1px] text-landing-lime">Sobre mí</p>
                  <h3 className="mt-2 font-brand text-2xl font-semibold text-landing-text">Raymond Vega</h3>
                  <p className="mt-3 text-sm leading-6 text-landing-muted">Profesional del entrenamiento, la nutrición y el rendimiento con una visión integral de la salud y la mejora física.</p>
                  <p className="mt-3 text-sm font-medium leading-6 text-landing-lime">Método, seguimiento y adaptación individual para construir un progreso realista, medible y sostenible.</p>
                </div>
              </div>

              <div className="mt-7 grid gap-3 lg:grid-cols-3">
                {highlightedCredentials.map((credential) => (
                  <div key={credential.title} className={`rounded-xl border-[0.5px] border-landing-border border-l-2 bg-landing-card p-[18px] ${credential.featured ? "border-l-landing-lime" : "border-l-landing-silver-end"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border ${credential.featured ? "border-landing-lime/35 bg-landing-lime/10 text-landing-lime" : "border-landing-border bg-landing-bg text-landing-silver-end"}`}>
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`font-landing-mono text-[10px] font-medium uppercase tracking-[1px] ${credential.featured ? "text-landing-lime-dark" : "text-landing-muted"}`}>{credential.tag}</p>
                        <p className="mt-1 font-brand text-[14.5px] font-medium leading-5 text-landing-text">{credential.title}</p>
                        <p className="mt-1 text-xs leading-5 text-landing-muted">{credential.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <a href={PROFILE_PDF_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-landing-border bg-landing-bg px-5 py-3.5 text-sm font-medium text-landing-lime transition-colors duration-200 hover:border-landing-lime/55 hover:bg-landing-lime/5 focus:outline-none focus:ring-2 focus:ring-landing-lime focus:ring-offset-2 focus:ring-offset-landing-bg">
                Ver perfil profesional <ExternalLink className="h-4 w-4" />
              </a>
            </article>

            <div className="mx-auto mt-10 max-w-5xl px-1 pb-1">
              <Button
                type="button"
                onClick={openValuation}
                aria-label="Abrir el formulario para solicitar una valoración"
                className="valuation-cta min-h-16 w-full rounded-lg border border-landing-lime/40 bg-gradient-to-b from-landing-lime to-landing-lime-dark px-7 py-5 text-base font-medium text-landing-bg shadow-[0_3px_12px_rgba(200,224,108,0.25)] transition-[filter,box-shadow] duration-200 hover:brightness-105 hover:text-landing-bg hover:shadow-[0_6px_18px_rgba(200,224,108,0.3)] sm:min-h-[72px] sm:text-lg"
              >
                <span>Solicitar valoración</span>
                <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-landing-bg/10">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </Button>
            </div>
        </div>
      </section>

      <footer className="border-t border-landing-border bg-landing-bg text-landing-muted">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-5 text-sm sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-landing-card p-1"><img src={files.logo.url} alt="Chetesaí Fitness+" className="h-full w-full object-contain" /></div>
              <div><p className="font-medium text-landing-text">Chetesaí Fitness+</p><p>Entrena con cabeza. Mejora con método.</p></div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <Link href="/login" className="transition-colors duration-200 hover:text-landing-lime">Acceso privado</Link>
              <span>© {new Date().getFullYear()} Chetesaí Fitness+</span>
            </div>
          </div>
          <nav aria-label="Información legal" className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-landing-border pt-6 text-sm">
            <Link href="/privacy-policy" className="transition-colors duration-200 hover:text-landing-lime">Política de privacidad</Link>
            <Link href="/terms-of-service" className="transition-colors duration-200 hover:text-landing-lime">Términos y condiciones</Link>
            <Link href="/politica-cookies" className="transition-colors duration-200 hover:text-landing-lime">Política de cookies</Link>
            <Link href="/aviso-legal" className="transition-colors duration-200 hover:text-landing-lime">Aviso legal</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function Field({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return <label className="space-y-2 text-sm font-medium">{label}<input name={name} type={type} required={required} className="w-full rounded-lg border border-landing-border bg-landing-bg px-4 py-3 font-normal text-landing-text outline-none [color-scheme:dark] focus:border-landing-lime" /></label>;
}
