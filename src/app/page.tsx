"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Plus,
  ShieldCheck,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { files, heroSlideshow } from "@/assets/files";

const PROFILE_IMAGE_URL = "https://raymonchu48.github.io/Deportivo/Mi_imagen.png";
const PROFILE_PDF_URL = "https://raymonchu48.github.io/Deportivo/Carta_presentacion_deportiva_profesional.pdf";

const services = [
  { image: "/brand/chetesai-entrenamiento-personal.webp", imageAlt: "Entrenador Chetesaí Fitness+ acompañando una sesión de entrenamiento personal", title: "Entrenamiento personal", description: "Sesiones 1:1 adaptadas a tus objetivos, nivel y estilo de vida." },
  { image: "/brand/chetesai-grupos-reducidos.webp", imageAlt: "Dos clientas entrenando en grupo con supervisión de un entrenador Chetesaí Fitness+", title: "Grupos reducidos", description: "Dos a cuatro personas sin perder atención, técnica ni calidad." },
  { image: "/brand/chetesai-seguimiento-continuo.webp", imageAlt: "Entrenador y clienta con camisetas Chetesaí Fitness+ durante una sesión de seguimiento", imagePosition: "center 33%", title: "Seguimiento continuo", description: "Valoraciones periódicas y ajustes para que sigas avanzando." },
  { image: "/brand/chetesai-rutina-adaptada.webp", imageAlt: "Entrenador Chetesaí Fitness+ guiando una rutina adaptada en grupo", title: "Rutina adaptada", description: "Un plan realista, progresivo y preparado específicamente para ti." },
  { image: "/brand/chetesai-tecnica-progreso.webp", imageAlt: "Entrenador Chetesaí Fitness+ supervisando la técnica de una plancha", imagePosition: "center 25%", title: "Técnica y progreso", description: "Mejora cómo te mueves y consigue resultados medibles." },
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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showRates, setShowRates] = useState(false);
  const [showValuation, setShowValuation] = useState(false);
  const [sending, setSending] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((previous) => (previous + 1) % heroSlideshow.length);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(nextSlide, 5500);
    return () => window.clearInterval(interval);
  }, [nextSlide]);

  function revealRates() {
    setShowRates(true);
    window.setTimeout(() => document.getElementById("tarifas")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  function openValuation() {
    setShowRates(false);
    setShowValuation(true);
    window.setTimeout(() => {
      document.getElementById("formulario-valoracion")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  function goTo(section: string) {
    if (section !== "tarifas") setShowRates(false);
    window.setTimeout(() => {
      document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <main className="min-h-screen bg-[#f7f4ee] text-[#202724]">
      <section id="inicio" className="relative min-h-[640px] overflow-hidden bg-[#050706]">
        {heroSlideshow.map((slide, index) => (
          <div key={index} className="hero-media absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${slide.url})`, opacity: currentSlide === index ? 1 : 0 }} />
        ))}
        <div className="hero-shade absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />

        <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <button type="button" onClick={() => goTo("inicio")} className="flex shrink-0 items-center gap-3 text-left">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg"><img src={files.logo.url} alt="Chetesaí Fitness+" className="h-full w-full object-contain" /></div>
            <div className="hidden sm:block"><p className="font-bold leading-tight text-white">Chetesaí Fitness+</p><p className="text-xs text-white/55">Entrenamiento personalizado</p></div>
          </button>
          <div className="hidden items-center gap-7 text-sm font-medium text-white/80 xl:flex">
            <button type="button" onClick={() => goTo("servicios")} className="transition hover:text-white">Servicios</button>
            <button type="button" onClick={() => goTo("proceso")} className="transition hover:text-white">Cómo funciona</button>
            <button type="button" onClick={() => goTo("sobre-mi")} className="transition hover:text-white">Sobre mí</button>
            <button type="button" onClick={() => goTo("faq")} className="transition hover:text-white">FAQ</button>
            <Link href="/login" className="transition hover:text-white">Acceso clientes</Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button className="rounded-xl bg-[#2f9e24] px-4 hover:bg-[#27891e] lg:px-5" onClick={openValuation}>
              <CalendarDays className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Reserva tu valoración</span>
              <span className="sm:hidden">Reserva</span>
            </Button>
            <Button variant="outline" className="hidden rounded-xl border-white/35 bg-black/20 px-4 text-white hover:bg-white/10 hover:text-white sm:inline-flex lg:px-5" onClick={revealRates}>
              Ver tarifas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-20 pt-16 lg:grid-cols-[230px_1fr] lg:px-8 lg:pb-24 lg:pt-20">
          <div className="hidden border-r border-white/25 pr-10 lg:flex lg:items-center"><div className="w-full overflow-hidden rounded-[30px] bg-white p-3 shadow-2xl"><img src={files.logo.url} alt="Logo completo de Chetesaí Fitness+" className="aspect-square h-auto w-full object-contain" /></div></div>
          <div className="max-w-3xl self-center">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-[#8cdb78]">Entrenamiento personal y grupos reducidos en Mallorca</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight text-white md:text-7xl">Entrena con cabeza.<br /><span className="text-[#d8c7a5]">Mejora con método.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">Un enfoque realista, progresivo y medible para mejorar tu condición física sin rutinas genéricas ni promesas de humo.</p>
            <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#9fe68f]"><Target className="h-4 w-4" />Valoración inicial y planificación personalizada</p>
          </div>
        </div>

      </section>

      <section id="servicios" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2f9e24]">Servicios</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Todo lo que necesitas para entrenar mejor</h2><p className="mx-auto mt-4 max-w-2xl text-[#67706b]">Atención cercana, planificación profesional y seguimiento para que el entrenamiento encaje en tu vida.</p></div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {services.map((service) => {
            return (
              <article
                key={service.title}
                className={`overflow-hidden rounded-[22px] border border-[#ded8cd] bg-[#fffdf9] text-center shadow-sm ${service.image ? "" : "p-5"}`}
              >
                {service.image ? (
                  <div className="relative aspect-[3/2] w-full bg-[#e9e4db]">
                    <Image
                      src={service.image}
                      alt={service.imageAlt ?? service.title}
                      fill
                      sizes="(max-width: 639px) calc(100vw - 2.5rem), (max-width: 1023px) calc(50vw - 2rem), 240px"
                      className="object-cover"
                      style={{ objectPosition: service.imagePosition ?? "center" }}
                    />
                  </div>
                ) : null}
                <div className={service.image ? "px-5 pb-5 pt-4" : ""}>
                  <h3 className={`${service.image ? "" : "mt-4"} text-base font-bold leading-6`}>{service.title}</h3>
                  <p className="mt-2 text-sm leading-5 text-[#67706b]">{service.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="proceso" className="border-y border-[#d7dfd3] bg-[#eef3eb]">
        <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2f9e24]">Cómo funciona</p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">Un proceso sencillo y personal</h2>
            <p className="mx-auto mt-4 max-w-2xl text-[#67706b]">Tres pasos conectados, con acompañamiento desde la primera conversación hasta cada ajuste del plan.</p>
          </div>

          <div className="relative mt-11">
            <div aria-hidden="true" className="absolute bottom-7 left-7 top-7 w-px bg-[#2f9e24]/30 md:hidden" />
            <div aria-hidden="true" className="absolute left-[16.666%] right-[16.666%] top-7 hidden h-px bg-gradient-to-r from-[#2f9e24]/25 via-[#2f9e24] to-[#2f9e24]/25 md:block" />
            <div className="grid gap-9 md:grid-cols-3 md:gap-8">
              {steps.map((step) => {
                const StepIcon = step.icon;
                return (
                  <article key={step.number} className="relative z-10 grid grid-cols-[56px_1fr] items-start gap-5 text-left md:block md:text-center">
                    <div className="relative grid h-14 w-14 place-items-center rounded-full border-4 border-[#eef3eb] bg-[#2f9e24] text-white shadow-lg shadow-[#2f9e24]/15 md:mx-auto">
                      <StepIcon className="h-5 w-5" />
                      <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-[#18211d] text-[10px] font-black text-white">{step.number}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-black md:mt-5">{step.title}</h3>
                      <p className="mt-2 max-w-xs text-sm leading-6 text-[#67706b] md:mx-auto">{step.description}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-11 text-center">
            <Button onClick={openValuation} className="rounded-xl bg-[#2f9e24] px-6 py-5 hover:bg-[#27891e]">
              Solicitar valoración <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {showRates ? <section id="tarifas" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2f9e24]">Bonos mensuales</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Elige el ritmo que encaja contigo</h2><p className="mx-auto mt-4 max-w-2xl text-[#67706b]">Planes flexibles, sin matrícula ni permanencia.</p></div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">{personalPlans.map((plan) => <article key={plan.name} className={`relative rounded-3xl border bg-[#fffdf9] p-7 shadow-sm ${plan.popular ? "border-[#2f9e24] ring-2 ring-[#2f9e24]/10" : "border-[#ded8cd]"}`}>{plan.popular ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2f9e24] px-4 py-1 text-xs font-bold uppercase text-white">Más popular</span> : null}<p className="text-center text-2xl font-black">{plan.name}</p><p className="mt-2 text-center text-sm font-semibold text-[#2f9e24]">{plan.sessions}</p><p className="mt-6 text-center text-4xl font-black">{plan.price}<span className="text-base font-medium text-[#67706b]"> / mes</span></p><p className="mt-1 text-center text-sm text-[#67706b]">{plan.perSession}</p><div className="mt-7 space-y-3">{plan.features.map((feature) => <p key={feature} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-[#2f9e24]" />{feature}</p>)}</div><Button className={`mt-7 w-full rounded-xl ${plan.popular ? "bg-[#2f9e24] hover:bg-[#27891e]" : "bg-[#202724] hover:bg-[#303a35]"}`} onClick={openValuation}>Elegir {plan.name}</Button></article>)}</div>
        <div className="mt-10 rounded-3xl border border-[#ded8cd] bg-[#fffdf9] p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2f9e24]">Grupos reducidos 2–4</p><h3 className="mt-2 text-2xl font-black">Comparte el entrenamiento, no la atención</h3><p className="mt-2 text-[#67706b]">Puedes venir con tu grupo o solicitar plaza en uno compatible.</p></div><div className="grid gap-3 sm:grid-cols-3">{groupPlans.map((plan) => <div key={plan.name} className="rounded-2xl bg-[#f1eee7] px-5 py-4 text-center"><p className="font-bold">{plan.name}</p><p className="mt-1 text-xs text-[#67706b]">{plan.sessions}</p><p className="mt-2 text-xl font-black text-[#2f9e24]">{plan.price}</p></div>)}</div></div></div>
      </section> : null}

      <section id="faq" className="border-b border-[#ded8cd] bg-[#fffdf9]">
        <div className="mx-auto max-w-4xl px-5 py-16 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2f9e24]">Preguntas frecuentes</p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">Antes de empezar</h2>
            <p className="mx-auto mt-4 max-w-xl text-[#67706b]">Lo esencial, explicado de forma clara antes de reservar tu primera valoración.</p>
          </div>

          <div className="mt-10 overflow-hidden rounded-[28px] border border-[#ded8cd] bg-white shadow-sm">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              const buttonId = `faq-button-${index}`;
              const answerId = `faq-answer-${index}`;
              return (
                <div key={faq.question} className={index < faqs.length - 1 ? "border-b border-[#e8e2d8]" : ""}>
                  <button
                    id={buttonId}
                    type="button"
                    onClick={() => setOpenFaqIndex((current) => current === index ? null : index)}
                    aria-expanded={isOpen}
                    aria-controls={answerId}
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left transition hover:bg-[#f7f4ee] sm:px-7"
                  >
                    <span className="font-bold text-[#202724]">{faq.question}</span>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition-colors ${isOpen ? "bg-[#2f9e24] text-white" : "bg-[#eef3eb] text-[#2f9e24]"}`}>
                      <Plus className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`} />
                    </span>
                  </button>
                  {isOpen ? (
                    <div id={answerId} role="region" aria-labelledby={buttonId} className="px-6 pb-5 pr-16 text-sm leading-6 text-[#67706b] sm:px-7 sm:pr-20">
                      {faq.answer}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contacto" className="bg-[#18211d] text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          {showValuation ? (
            <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[#111612] shadow-2xl shadow-black/30 lg:grid lg:grid-cols-[0.92fr_1.08fr]">
            <div className="p-7 sm:p-9 lg:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8cdb78]">Primera valoración</p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">Cuéntame tu objetivo</h2>
            <p className="mt-5 max-w-lg leading-7 text-white/65">Envíame tus datos y te responderé para valorar tu punto de partida y encontrar la modalidad más adecuada.</p>
            <div className="mt-8 space-y-4 text-sm text-white/75">
              <p className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#8cdb78]" />Mallorca, Islas Baleares</p>
              <p className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#8cdb78]" />chetesaifitnnes@gmail.com</p>
              <p className="flex items-center gap-3"><Clock className="h-5 w-5 text-[#8cdb78]" />Respuesta habitual en menos de 24 horas</p>
              <p className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#8cdb78]" />Tus datos se utilizarán únicamente para atender la solicitud</p>
            </div>
          </div>

            <form id="formulario-valoracion" onSubmit={submitReservation} className="scroll-mt-5 border-t border-[#ded8cd] bg-white p-7 text-[#202724] sm:p-9 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:border-l lg:border-t-0 lg:p-10">
              <div className="mb-7">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#2f9e24]">Formulario de valoración</p>
                <h3 className="mt-2 text-2xl font-black sm:text-3xl">Tu valoración empieza aquí</h3>
                <p className="mt-2 text-sm leading-6 text-[#67706b]">Completa tus datos y te responderé para confirmar el mejor punto de partida.</p>
              </div>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field name="nombre" label="Nombre" required />
              <Field name="email" label="Email" type="email" required />
              <Field name="telefono" label="Teléfono" type="tel" />
              <label className="space-y-2 text-sm font-semibold">Modalidad<select name="modalidad" defaultValue="orientacion" className="w-full rounded-xl border border-[#d8d2c8] px-4 py-3 font-normal outline-none focus:border-[#2f9e24]"><option value="entrenamiento_personal">Entrenamiento personal</option><option value="grupo_reducido">Grupo reducido</option><option value="orientacion">Quiero orientación</option></select></label>
              <Field name="fecha_preferida" label="Fecha preferida" type="date" required />
              <Field name="franja_horaria" label="Hora aproximada" type="time" required />
            </div>
            <p className="mt-2 text-xs text-[#67706b]">La hora solicitada queda pendiente de confirmación según disponibilidad.</p>
            <label className="mt-4 block space-y-2 text-sm font-semibold">Objetivo principal<input name="objetivo" className="w-full rounded-xl border border-[#d8d2c8] px-4 py-3 font-normal outline-none focus:border-[#2f9e24]" placeholder="Mejorar condición física, ganar fuerza, perder grasa..." /></label>
            <label className="mt-4 block space-y-2 text-sm font-semibold">Cuéntame un poco más<textarea name="mensaje" rows={4} className="w-full rounded-xl border border-[#d8d2c8] px-4 py-3 font-normal outline-none focus:border-[#2f9e24]" /></label>
            <label className="mt-4 flex items-start gap-3 text-xs leading-5 text-[#67706b]"><input type="checkbox" name="consentimiento" required className="mt-1" />Acepto que mis datos sean utilizados para responder a esta solicitud de información.</label>
            {formMessage ? <p className={`mt-4 rounded-xl px-4 py-3 text-sm ${formMessage.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{formMessage.text}</p> : null}
            <Button type="submit" disabled={sending} className="mt-6 w-full rounded-xl bg-[#2f9e24] py-6 text-base hover:bg-[#27891e]">{sending ? "Enviando solicitud..." : "Solicitar valoración"}</Button>
            </form>
            </div>
          ) : null}

            <article id="sobre-mi" className="mx-auto mt-10 max-w-5xl scroll-mt-24 rounded-[28px] border border-[#b38d45]/35 bg-[#0f1713]/75 p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6">
              <div className="grid gap-5 sm:grid-cols-[132px_1fr] sm:items-center">
                <div className="mx-auto overflow-hidden rounded-2xl border border-white/15 bg-black/30 shadow-xl sm:mx-0">
                  <img src={PROFILE_IMAGE_URL} alt="Ramón Curbalán, entrenador y profesional del deporte" className="h-44 w-32 object-cover object-top sm:h-48 sm:w-full" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d7b86b]">Sobre mí</p>
                  <h3 className="mt-2 text-2xl font-black text-white">Ramón Curbalán</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">Profesional del entrenamiento, la nutrición y el rendimiento con una visión integral de la salud y la mejora física.</p>
                  <p className="mt-3 text-sm font-semibold leading-6 text-[#9fe68f]">Método, seguimiento y adaptación individual para construir un progreso realista, medible y sostenible.</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {highlightedCredentials.map((credential) => (
                  <div key={credential.title} className={`rounded-2xl border p-4 ${credential.featured ? "border-[#d7b86b]/55 bg-[#d7b86b]/10" : "border-white/10 bg-white/[0.04]"}`}>
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${credential.featured ? "bg-[#d7b86b] text-[#111612]" : "bg-[#8cdb78]/15 text-[#9fe68f]"}`}>
                        <Award className="h-5 w-5" />
                      </div>
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-[0.16em] ${credential.featured ? "text-[#e7cb87]" : "text-[#8cdb78]"}`}>{credential.tag}</p>
                        <p className="mt-1 text-sm font-bold leading-5 text-white">{credential.title}</p>
                        <p className="mt-1 text-xs leading-5 text-white/60">{credential.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <a href={PROFILE_PDF_URL} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#b38d45] px-5 py-3.5 text-sm font-black text-[#111612] transition hover:bg-[#c8a65b] focus:outline-none focus:ring-2 focus:ring-[#d7b86b] focus:ring-offset-2 focus:ring-offset-[#18211d]">
                Ver perfil profesional <ExternalLink className="h-4 w-4" />
              </a>
            </article>
        </div>
      </section>

      <footer className="bg-[#111612] text-white/55">
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-5 text-sm sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white p-1"><img src={files.logo.url} alt="Chetesaí Fitness+" className="h-full w-full object-contain" /></div>
              <div><p className="font-bold text-white">Chetesaí Fitness+</p><p>Entrena con cabeza. Mejora con método.</p></div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <Link href="/login" className="transition hover:text-white">Acceso privado</Link>
              <span>© {new Date().getFullYear()} Chetesaí Fitness+</span>
            </div>
          </div>
          <nav aria-label="Información legal" className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-white/10 pt-6 text-sm">
            <Link href="/privacy-policy" className="transition hover:text-[#8cdb78]">Política de privacidad</Link>
            <Link href="/terms-of-service" className="transition hover:text-[#8cdb78]">Términos y condiciones</Link>
            <Link href="/politica-cookies" className="transition hover:text-[#8cdb78]">Política de cookies</Link>
            <Link href="/aviso-legal" className="transition hover:text-[#8cdb78]">Aviso legal</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

function Field({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return <label className="space-y-2 text-sm font-semibold">{label}<input name={name} type={type} required={required} className="w-full rounded-xl border border-[#d8d2c8] px-4 py-3 font-normal outline-none focus:border-[#2f9e24]" /></label>;
}
