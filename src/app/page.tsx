"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Users,
  Dumbbell,
  ArrowRight,
  ClipboardList,
  Activity,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  ChartNoAxesCombined,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { files, heroSlideshow } from "@/assets/files";

const features = [
  {
    icon: Users,
    title: "Gestión integral de clientes",
    description: "Centraliza perfiles, objetivos, estado, datos personales y seguimiento individual desde un único panel profesional.",
    href: "/clientes",
    action: "Gestionar clientes",
  },
  {
    icon: Dumbbell,
    title: "Biblioteca profesional de ejercicios",
    description: "Crea fichas técnicas completas con imágenes, animaciones, vídeos, biomecánica, consejos y errores frecuentes.",
    href: "/ejercicios",
    action: "Abrir biblioteca",
  },
  {
    icon: ClipboardList,
    title: "Rutinas personalizadas",
    description: "Diseña planes por días, configura cargas, series, tempo, RPE, superseries e instrucciones específicas para cada cliente.",
    href: "/rutinas",
    action: "Crear rutinas",
  },
  {
    icon: Activity,
    title: "Seguimiento del rendimiento",
    description: "Registra series, repeticiones, cargas, RPE, volumen e historial real de cada entrenamiento desde el portal del cliente.",
    href: "/rutinas/asignaciones",
    action: "Asignar planes",
  },
];

const highlights = [
  {
    icon: ShieldCheck,
    label: "Acceso seguro por roles",
    sublabel: "Administrador, profesional y cliente",
  },
  {
    icon: UserRoundCheck,
    label: "Planes individualizados",
    sublabel: "Una experiencia adaptada a cada persona",
  },
  {
    icon: ChartNoAxesCombined,
    label: "Progreso basado en datos",
    sublabel: "Historial, cargas, volumen y adherencia",
  },
];

export default function Main() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((previous) => (previous + 1) % heroSlideshow.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  return (
    <div className="min-h-screen bg-background">
      <div className="relative min-h-[650px] overflow-hidden md:min-h-[760px]">
        {heroSlideshow.map((slide, index) => (
          <div
            key={index}
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
            style={{
              backgroundImage: `url(${slide.url})`,
              opacity: currentSlide === index ? 1 : 0,
              zIndex: currentSlide === index ? 1 : 0,
            }}
          />
        ))}

        <div className="absolute inset-0 z-[2] bg-gradient-to-br from-black/80 via-black/60 to-[#183226]/80" />

        <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mb-7 flex items-center gap-4">
            <img
              src={files.logo.url}
              alt="Chetesaí Fitness+"
              className="h-16 w-16 rounded-2xl bg-white/90 object-contain p-1.5 shadow-lg backdrop-blur-sm md:h-20 md:w-20"
            />
            <div>
              <span className="block text-sm font-medium uppercase tracking-[0.2em] text-white/65">
                Entrenamiento · Nutrición · Seguimiento
              </span>
              <span className="mt-1 block text-xs font-semibold tracking-wide text-[#f0b35d]">
                Carga tus energías y renueva tu vida
              </span>
            </div>
          </div>

          <div className="max-w-3xl">
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#8fd09b]">
              <Sparkles className="h-4 w-4" /> Plataforma profesional integral
            </p>
            <h1 className="mb-7 text-5xl font-black leading-[0.95] tracking-tight text-white md:text-7xl">
              Chetesaí<span className="text-primary">Fitness+</span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-white/75 md:text-xl">
              Diseña programas personalizados, acompaña a cada cliente y transforma su progreso en información útil para tomar mejores decisiones.
            </p>
          </div>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="rounded-xl px-8 py-6 text-base font-semibold shadow-xl shadow-primary/25">
                Entrar al panel profesional
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/portal">
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl border-white/20 bg-white/5 px-8 py-6 text-base font-semibold text-white backdrop-blur-sm hover:bg-white/10"
              >
                Acceso del cliente
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 px-5 py-5 backdrop-blur-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                    <Icon className="h-5 w-5 text-[#8fd09b]" />
                  </div>
                  <div>
                    <p className="font-bold leading-tight text-white">{item.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/55">{item.sublabel}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex items-center gap-2">
            {heroSlideshow.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Mostrar imagen ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  currentSlide === index ? "w-8 bg-primary" : "w-3 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Ecosistema Chetesaí
          </p>
          <h2 className="text-3xl font-bold text-foreground md:text-4xl">
            Del diseño del plan al progreso real del cliente
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-muted-foreground">
            Herramientas conectadas para planificar, asignar, ejecutar y evaluar cada proceso de entrenamiento con criterio profesional.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href} className="group">
                <article className="h-full rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-card-foreground">{feature.title}</h3>
                  <p className="leading-relaxed text-muted-foreground">{feature.description}</p>
                  <div className="mt-5 flex items-center gap-2 text-sm font-medium text-primary">
                    {feature.action}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-3">
            <img src={files.logo.url} alt="Chetesaí Fitness+" className="h-9 w-9 rounded-lg bg-white object-contain p-0.5" />
            <span className="font-bold">Chetesaí Fitness+</span>
          </div>
          <p className="text-center text-sm text-muted-foreground sm:text-right">
            Plataforma profesional de entrenamiento, nutrición y seguimiento personalizado.
          </p>
        </div>
      </footer>
    </div>
  );
}
