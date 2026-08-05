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
    <div className="fixed inset-0 z-[120] overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-md sm:px-6" role="dialog" aria-modal="true" aria-label="Tarifas Chetesaí Fitness+">
      <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-[#f7f4ee] p-5 text-[#202724] shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#2f9e24]">Bonos mensuales</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Elige el ritmo que encaja contigo</h2>
            <p className="mt-2 text-sm text-[#67706b] sm:text-base">Planes flexibles, sin matrícula ni permanencia.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar tarifas" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#ded8cd] bg-white shadow-sm">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {personalPlans.map((plan) => (
            <article key={plan.name} className={`relative rounded-3xl border bg-white p-6 shadow-sm ${plan.popular ? "border-[#2f9e24] ring-2 ring-[#2f9e24]/10" : "border-[#ded8cd]"}`}>
              {plan.popular ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2f9e24] px-4 py-1 text-xs font-bold uppercase text-white">Más popular</span> : null}
              <p className="text-center text-2xl font-black">{plan.name}</p>
              <p className="mt-2 text-center text-sm font-semibold text-[#2f9e24]">{plan.sessions}</p>
              <p className="mt-6 text-center text-4xl font-black">{plan.price}<span className="text-base font-medium text-[#67706b]"> / mes</span></p>
              <p className="mt-1 text-center text-sm text-[#67706b]">{plan.perSession}</p>
              <div className="mt-7 space-y-3">
                {plan.features.map((feature) => <p key={feature} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-[#2f9e24]" />{feature}</p>)}
              </div>
              <button type="button" onClick={onReserve} className={`mt-7 w-full rounded-xl px-4 py-3 font-bold text-white ${plan.popular ? "bg-[#2f9e24]" : "bg-[#202724]"}`}>Elegir {plan.name}</button>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-[#ded8cd] bg-white p-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#2f9e24]">Grupos reducidos 2–4</p>
          <h3 className="mt-2 text-2xl font-black">Comparte el entrenamiento, no la atención</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {groupPlans.map((plan) => (
              <div key={plan.name} className="rounded-2xl bg-[#f1eee7] px-5 py-4 text-center">
                <p className="font-bold">{plan.name}</p>
                <p className="mt-1 text-xs text-[#67706b]">{plan.sessions}</p>
                <p className="mt-2 text-xl font-black text-[#2f9e24]">{plan.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
