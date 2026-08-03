"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Mail,
  MapPin,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { files, heroSlideshow } from "@/assets/files";

const benefits = [
  { icon: UserRound, title: "Entrenamiento 1:1", description: "Atención individual y objetivo claro." },
  { icon: Users, title: "Grupos reducidos 2–4", description: "Más atención, mejor ambiente." },
  { icon: ClipboardCheck, title: "Seguimiento personalizado", description: "Valoramos y ajustamos tu progreso." },
  { icon: TrendingUp, title: "Rutinas y progreso", description: "Entrena con método. Mejora real." },
];

const services = [
  { icon: UserRound, title: "Entrenamiento personal", description: "Sesiones 1:1 adaptadas a tus objetivos, nivel y estilo de vida." },
  { icon: Users, title: "Grupos reducidos", description: "Dos a cuatro personas sin perder atención, técnica ni calidad." },
  { icon: ClipboardCheck, title: "Seguimiento continuo", description: "Valoraciones periódicas y ajustes para que sigas avanzando." },
  { icon: Target, title: "Rutina adaptada", description: "Un plan realista, progresivo y preparado específicamente para ti." },
  { icon: TrendingUp, title: "Técnica y progreso", description: "Mejora cómo te mueves y consigue resultados medibles." },
];

const steps = [
  { number: "1", title: "Solicita tu valoración", description: "Cuéntanos tu objetivo, disponibilidad y modalidad preferida." },
  { number: "2", title: "Valoramos y planificamos", description: "Analizamos tu punto de partida y creamos una propuesta realista." },
  { number: "3", title: "Entrenas y progresas", description: "Te acompañamos, medimos el avance y ajustamos el plan." },
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

export default function Main() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showRates, setShowRates] = useState(false);
  const [sending, setSending] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  function goTo(section: string) {
    if (section !== "tarifas") setShowRates(false);
    document.getElementById(section)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      <section id="inicio" className="relative min-h-[760px] overflow-hidden">
        {heroSlideshow.map((slide, index) => (
          <div key={index} className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000" style={{ backgroundImage: `url(${slide.url})`, opacity: currentSlide === index ? 1 : 0 }} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />

        <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <button type="button" onClick={() => goTo("inicio")} className="flex shrink-0 items-center gap-3 text-left">
            <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-lg"><img src={files.logo.url} alt="Chetesaí Fitness+" className="h-full w-full object-contain" /></div>
            <div className="hidden sm:block"><p className="font-bold leading-tight text-white">Chetesaí Fitness+</p><p className="text-xs text-white/55">Entrenamiento personalizado</p></div>
          </button>
          <div className="hidden items-center gap-7 text-sm font-medium text-white/80 xl:flex">
            <button type="button" onClick={() => goTo("servicios")} className="transition hover:text-white">Servicios</button>
            <button type="button" onClick={() => goTo("proceso")} className="transition hover:text-white">Cómo funciona</button>
            <button type="button" onClick={() => goTo("faq")} className="transition hover:text-white">FAQ</button>
            <Link href="/login" className="transition hover:text-white">Acceso clientes</Link>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button className="rounded-xl bg-[#2f9e24] px-4 hover:bg-[#27891e] lg:px-5" onClick={() => goTo("contacto")}>
              <CalendarDays className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Reserva tu valoración</span>
              <span className="sm:hidden">Reserva</span>
            </Button>
            <Button variant="outline" className="hidden rounded-xl border-white/35 bg-black/20 px-4 text-white hover:bg-white/10 hover:text-white sm:inline-flex lg:px-5" onClick={revealRates}>
              Ver tarifas <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-5 pb-44 pt-16 lg:grid-cols-[230px_1fr] lg:px-8 lg:pt-20">
          <div className="hidden border-r border-white/25 pr-10 lg:flex lg:items-center"><div className="w-full overflow-hidden rounded-[30px] bg-white p-3 shadow-2xl"><img src={files.logo.url} alt="Logo completo de Chetesaí Fitness+" className="aspect-square h-auto w-full object-contain" /></div></div>
          <div className="max-w-3xl self-center">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.18em] text-[#8cdb78]">Entrenamiento personal y grupos reducidos en Mallorca</p>
            <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-tight text-white md:text-7xl">Entrena con cabeza.<br /><span className="text-[#d8c7a5]">Mejora con método.</span></h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">Un enfoque realista, progresivo y medible para mejorar tu condición física sin rutinas genéricas ni promesas de humo.</p>
            <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#9fe68f]"><Target className="h-4 w-4" />Valoración inicial y planificación personalizada</p>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 z-20 mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid overflow-hidden rounded-t-3xl border border-white/15 bg-[#151917]/90 shadow-2xl backdrop-blur-xl md:grid-cols-4">
            {benefits.map((benefit) => { const Icon = benefit.icon; return <div key={benefit.title} className="flex gap-4 border-b border-white/10 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[#8cdb78]/35 bg-[#8cdb78]/10"><Icon className="h-6 w-6 text-[#8cdb78]" /></div><div><h2 className="font-bold text-white">{benefit.title}</h2><p className="mt-1 text-sm leading-5 text-white/60">{benefit.description}</p></div></div>; })}
          </div>
        </div>
      </section>

      <section id="servicios" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2f9e24]">Servicios</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Todo lo que necesitas para entrenar mejor</h2><p className="mx-auto mt-4 max-w-2xl text-[#67706b]">Atención cercana, planificación profesional y seguimiento para que el entrenamiento encaje en tu vida.</p></div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{services.map((service) => { const Icon = service.icon; return <article key={service.title} className="rounded-3xl border border-[#ded8cd] bg-[#fffdf9] p-6 text-center shadow-sm"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#eaf5e8]"><Icon className="h-7 w-7 text-[#2f9e24]" /></div><h3 className="mt-5 text-lg font-bold">{service.title}</h3><p className="mt-3 text-sm leading-6 text-[#67706b]">{service.description}</p></article>; })}</div>
      </section>

      <section id="proceso" className="border-y border-[#ded8cd] bg-[#fffdf9]"><div className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2f9e24]">Cómo funciona</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Un proceso sencillo y personal</h2></div><div className="mt-12 grid gap-5 md:grid-cols-3">{steps.map((step) => <article key={step.number} className="rounded-3xl border border-[#ded8cd] bg-white p-7"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#2f9e24] text-lg font-black text-white">{step.number}</span><h3 className="mt-5 text-xl font-bold">{step.title}</h3><p className="mt-3 leading-7 text-[#67706b]">{step.description}</p></article>)}</div></div></section>

      {showRates ? <section id="tarifas" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
        <div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2f9e24]">Bonos mensuales</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Elige el ritmo que encaja contigo</h2><p className="mx-auto mt-4 max-w-2xl text-[#67706b]">Planes flexibles, sin matrícula ni permanencia.</p></div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">{personalPlans.map((plan) => <article key={plan.name} className={`relative rounded-3xl border bg-[#fffdf9] p-7 shadow-sm ${plan.popular ? "border-[#2f9e24] ring-2 ring-[#2f9e24]/10" : "border-[#ded8cd]"}`}>{plan.popular ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2f9e24] px-4 py-1 text-xs font-bold uppercase text-white">Más popular</span> : null}<p className="text-center text-2xl font-black">{plan.name}</p><p className="mt-2 text-center text-sm font-semibold text-[#2f9e24]">{plan.sessions}</p><p className="mt-6 text-center text-4xl font-black">{plan.price}<span className="text-base font-medium text-[#67706b]"> / mes</span></p><p className="mt-1 text-center text-sm text-[#67706b]">{plan.perSession}</p><div className="mt-7 space-y-3">{plan.features.map((feature) => <p key={feature} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-[#2f9e24]" />{feature}</p>)}</div><Button className={`mt-7 w-full rounded-xl ${plan.popular ? "bg-[#2f9e24] hover:bg-[#27891e]" : "bg-[#202724] hover:bg-[#303a35]"}`} onClick={() => goTo("contacto")}>Elegir {plan.name}</Button></article>)}</div>
        <div className="mt-10 rounded-3xl border border-[#ded8cd] bg-[#fffdf9] p-7"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2f9e24]">Grupos reducidos 2–4</p><h3 className="mt-2 text-2xl font-black">Comparte el entrenamiento, no la atención</h3><p className="mt-2 text-[#67706b]">Puedes venir con tu grupo o solicitar plaza en uno compatible.</p></div><div className="grid gap-3 sm:grid-cols-3">{groupPlans.map((plan) => <div key={plan.name} className="rounded-2xl bg-[#f1eee7] px-5 py-4 text-center"><p className="font-bold">{plan.name}</p><p className="mt-1 text-xs text-[#67706b]">{plan.sessions}</p><p className="mt-2 text-xl font-black text-[#2f9e24]">{plan.price}</p></div>)}</div></div></div>
      </section> : null}

      <section id="faq" className="border-y border-[#ded8cd] bg-[#fffdf9]"><div className="mx-auto max-w-5xl px-5 py-20 lg:px-8"><div className="text-center"><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#2f9e24]">Preguntas frecuentes</p><h2 className="mt-3 text-3xl font-black md:text-5xl">Antes de empezar</h2></div><div className="mt-12 grid gap-4 md:grid-cols-2">{faqs.map((faq) => <article key={faq.question} className="rounded-3xl border border-[#ded8cd] bg-white p-6"><h3 className="font-bold">{faq.question}</h3><p className="mt-3 text-sm leading-6 text-[#67706b]">{faq.answer}</p></article>)}</div></div></section>

      <section id="contacto" className="bg-[#18211d] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
          <div><p className="text-sm font-bold uppercase tracking-[0.2em] text-[#8cdb78]">Primera valoración</p><h2 className="mt-3 text-4xl font-black md:text-5xl">Cuéntame tu objetivo</h2><p className="mt-5 max-w-lg leading-7 text-white/65">Envíame tus datos y te responderé para valorar tu punto de partida y encontrar la modalidad más adecuada.</p><div className="mt-8 space-y-4 text-sm text-white/75"><p className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#8cdb78]" />Mallorca, Islas Baleares</p><p className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#8cdb78]" />contacto@chetesaifitnnes.com</p><p className="flex items-center gap-3"><Clock className="h-5 w-5 text-[#8cdb78]" />Respuesta habitual en menos de 24 horas</p><p className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-[#8cdb78]" />Tus datos se utilizarán únicamente para atender la solicitud</p></div></div>

          <form onSubmit={submitReservation} className="rounded-3xl bg-white p-7 text-[#202724] shadow-2xl">
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
      </section>

      <footer className="bg-[#111612] text-white/55"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 text-sm sm:flex-row lg:px-8"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center overflow-hidden rounded-xl bg-white p-1"><img src={files.logo.url} alt="Chetesaí Fitness+" className="h-full w-full object-contain" /></div><div><p className="font-bold text-white">Chetesaí Fitness+</p><p>Entrena con cabeza. Mejora con método.</p></div></div><div className="flex items-center gap-5"><Link href="/login" className="hover:text-white">Acceso privado</Link><span>© {new Date().getFullYear()} Chetesaí Fitness+</span></div></div></footer>
    </main>
  );
}

function Field({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return <label className="space-y-2 text-sm font-semibold">{label}<input name={name} type={type} required={required} className="w-full rounded-xl border border-[#d8d2c8] px-4 py-3 font-normal outline-none focus:border-[#2f9e24]" /></label>;
}
