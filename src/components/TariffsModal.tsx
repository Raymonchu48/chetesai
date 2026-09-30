"use client";

import { CheckCircle2, X } from "lucide-react";

const personalPlans = [
  {
    name: "Básico",
    sessions: "4 sesiones / mes",
    price: "75 €",
    perSession: "18,75 € por sesión",
    features: ["Valoración inicial", "Programación mensual", "Seguimiento básico"],
  },
  {
    name: "Activo",
    sessions: "8 sesiones / mes",
    price: "130 €",
    perSession: "16,25 € por sesión",
    popular: true,
    features: ["Valoración inicial", "Revisión quincenal", "Mensajería de soporte"],
  },
  {
    name: "Intensivo",
    sessions: "12 sesiones / mes",
    price: "165 €",
    perSession: "13,75 € por sesión",
    features: ["Valoración inicial", "Ajustes semanales", "Revisión técnica en vídeo"],
  },
];

const groupPlans = [
  { name: "Grupo Básico", sessions: "4 sesiones / mes", price: "45 €" },
  { name: "Grupo Activo", sessions: "8 sesiones / mes", price: "80 €" },
  { name: "Grupo Intensivo", sessions: "12 sesiones / mes", price: "110 €" },
];

export function TariffsModal({ open, onClose, onReserve }: { open: boolean; onClose: () => void; onReserve: () => void }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/80 px-4 py-6 font-landing-sans backdrop-blur-md sm:px-6" role="dialog" aria-modal="true" aria-label="Tarifas Chetesaí Fitness+">
      <div className="mx-auto max-w-6xl rounded-xl border border-landing-border bg-landing-bg p-5 text-landing-text shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-landing-mono text-[10px] font-medium uppercase tracking-[1px] text-landing-lime">Bonos mensuales</p>
            <h2 className="mt-2 font-brand text-3xl font-semibold sm:text-4xl">Elige el ritmo que encaja contigo</h2>
            <p className="mt-2 text-sm text-landing-muted sm:text-base">Planes flexibles, sin matrícula ni permanencia.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar tarifas" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-landing-border bg-landing-card shadow-sm transition-colors duration-200 hover:border-landing-silver-start">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {personalPlans.map((plan) => (
            <article key={plan.name} className={`relative rounded-xl border-[0.5px] bg-landing-card p-6 shadow-[0_2px_10px_rgba(0,0,0,0.25)] ${plan.popular ? "border-landing-lime ring-1 ring-landing-lime/25" : "border-landing-border"}`}>
              {plan.popular ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-b from-landing-lime to-landing-lime-dark px-4 py-1 font-landing-mono text-[10px] font-medium uppercase tracking-[1px] text-landing-bg">Más popular</span> : null}
              <p className="text-center font-brand text-2xl font-semibold">{plan.name}</p>
              <p className="mt-2 text-center font-landing-mono text-xs font-medium text-landing-lime">{plan.sessions}</p>
              <p className="mt-6 text-center font-brand text-4xl font-semibold">{plan.price}<span className="font-landing-sans text-base font-normal text-landing-muted"> / mes</span></p>
              <p className="mt-1 text-center text-sm text-landing-muted">{plan.perSession}</p>
              <div className="mt-7 space-y-3">
                {plan.features.map((feature) => <p key={feature} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-landing-lime" />{feature}</p>)}
              </div>
              <button type="button" onClick={onReserve} className="mt-7 w-full rounded-lg bg-gradient-to-b from-landing-lime to-landing-lime-dark px-4 py-3 font-medium text-landing-bg shadow-[0_3px_12px_rgba(200,224,108,0.2)] transition-[filter] duration-200 hover:brightness-105">Elegir {plan.name}</button>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-xl border-[0.5px] border-landing-border bg-landing-card p-6">
          <p className="font-landing-mono text-[10px] font-medium uppercase tracking-[1px] text-landing-lime">Grupos reducidos 2–4</p>
          <h3 className="mt-2 font-brand text-2xl font-medium">Comparte el entrenamiento, no la atención</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {groupPlans.map((plan) => (
              <div key={plan.name} className="rounded-xl border-[0.5px] border-landing-border bg-landing-bg px-5 py-4 text-center">
                <p className="font-brand font-medium">{plan.name}</p>
                <p className="mt-1 text-xs text-landing-muted">{plan.sessions}</p>
                <p className="mt-2 font-landing-mono text-xl font-medium text-landing-lime">{plan.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
