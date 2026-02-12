"use client";

import Link from "next/link";
import {
  Users,
  CalendarDays,
  CreditCard,
  Dumbbell,
  ArrowRight,
  Target,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { files } from "@/assets/files";

const features = [
  {
    icon: Users,
    title: "Gestion de Clientes",
    description: "Controla la informacion de todos tus clientes, objetivos, estado y seguimiento personalizado.",
    href: "/clientes",
  },
  {
    icon: CalendarDays,
    title: "Sesiones de Entrenamiento",
    description: "Programa y gestiona todas las sesiones de entrenamiento con tus clientes.",
    href: "/sesiones",
  },
  {
    icon: CreditCard,
    title: "Control de Pagos",
    description: "Lleva un registro completo de los pagos mensuales, pendientes y metodos de cobro.",
    href: "/pagos",
  },
  {
    icon: Dumbbell,
    title: "Biblioteca de Ejercicios",
    description: "Catalogo completo de ejercicios organizados por grupo muscular y dificultad.",
    href: "/ejercicios",
  },
];

const stats = [
  { icon: Target, label: "5 clientes/dia", sublabel: "Modelo de negocio" },
  { icon: TrendingUp, label: "3.750 EUR/mes", sublabel: "Ingresos estimados" },
  { icon: Clock, label: "Lunes a Viernes", sublabel: "Horario operativo" },
];

export default function Main() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${files.hero_gym.url})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="flex items-center gap-4 mb-6">
            <img
              src={files.logo.url}
              alt="ChetesaíFitness+ Logo"
              className="w-14 h-14 rounded-xl object-contain bg-white/10 backdrop-blur-sm p-1"
            />
            <span className="text-white/60 text-sm font-medium tracking-widest uppercase">
              Centro de Entrenamiento
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tight mb-6">
            Chetesaí<span className="text-primary">Fitness+</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-xl mb-10 leading-relaxed">
            Plataforma integral para gestionar tu centro de entrenamiento personal.
            Clientes, sesiones, pagos y ejercicios en un solo lugar.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="text-base px-8 py-6 rounded-xl font-semibold shadow-xl shadow-primary/25">
                Ir al Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/clientes">
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 rounded-xl font-semibold border-white/20 text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm"
              >
                Ver Clientes
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-5 py-4 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">{stat.label}</p>
                    <p className="text-white/50 text-sm">{stat.sublabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-primary font-semibold text-sm tracking-widest uppercase mb-3">Funcionalidades</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Todo lo que necesitas para tu centro
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link key={feature.href} href={feature.href} className="group">
                <div className="bg-card border border-border rounded-2xl p-7 h-full transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-card-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  <div className="mt-5 flex items-center gap-2 text-primary font-medium text-sm">
                    Acceder
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={files.logo.url} alt="ChetesaíFitness+ Logo" className="w-7 h-7 rounded object-contain" />
            <span className="font-bold">ChetesaíFitness+</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Centro de Entrenamiento Personal - Cuota mensual 180 EUR
          </p>
        </div>
      </footer>
    </div>
  );
}
