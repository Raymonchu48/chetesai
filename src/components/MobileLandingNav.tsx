"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  HelpCircle,
  Menu,
  PanelsTopLeft,
  Tags,
  UserRound,
  X,
} from "lucide-react";
import { TariffsModal } from "@/components/TariffsModal";

const navigationItems = [
  { id: "servicios", label: "Servicios", icon: PanelsTopLeft },
  { id: "proceso", label: "Cómo funciona", icon: ChevronRight },
  { id: "sobre-mi", label: "Sobre mí", icon: UserRound },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

export function MobileLandingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [ratesOpen, setRatesOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;

    const handleRatesClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const control = target?.closest("button, a");
      if (!control || control.closest('[role="dialog"]')) return;

      const label = control.textContent?.trim().toLowerCase() || "";
      if (!label.includes("ver tarifas")) return;

      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setRatesOpen(true);
    };

    document.addEventListener("click", handleRatesClick, true);
    return () => document.removeEventListener("click", handleRatesClick, true);
  }, [pathname]);

  useEffect(() => {
    if (!open && !ratesOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setRatesOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, ratesOpen]);

  if (pathname !== "/") return null;

  function goToSection(sectionId: string) {
    setOpen(false);
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function openRates() {
    setOpen(false);
    setRatesOpen(true);
  }

  function openValuation() {
    setOpen(false);
    window.setTimeout(() => {
      window.dispatchEvent(new Event("chetesai:open-valuation"));
    }, 120);
  }

  function reserveFromRates() {
    setRatesOpen(false);
    window.setTimeout(() => {
      window.dispatchEvent(new Event("chetesai:open-valuation"));
    }, 120);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú de navegación"
        aria-expanded={open}
        aria-controls="mobile-landing-menu"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-[76] grid h-12 w-12 place-items-center rounded-xl border border-landing-border bg-landing-card font-landing-sans text-landing-text shadow-lg xl:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div
        className={`fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm transition-opacity duration-300 xl:hidden ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="mobile-landing-menu"
        aria-label="Navegación móvil"
        className={`fixed left-0 top-0 z-[90] flex h-dvh w-[86%] max-w-sm flex-col border-r border-landing-border bg-landing-card font-landing-sans text-landing-text shadow-2xl transition-transform duration-300 ease-out xl:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-landing-border px-5 py-5">
          <div>
            <p className="font-brand text-sm font-semibold">Chetesaí Fitness+</p>
            <p className="mt-1 text-xs text-landing-muted">Navegación</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="grid h-11 w-11 place-items-center rounded-lg border border-landing-border bg-landing-bg transition-colors duration-200 hover:border-landing-silver-start"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToSection(item.id)}
                  className="flex w-full items-center gap-4 rounded-xl border border-landing-border bg-landing-bg px-4 py-4 text-left transition-colors duration-200 hover:border-landing-lime/35 hover:bg-landing-lime/5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-landing-border bg-landing-card text-landing-lime">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-semibold">{item.label}</span>
                </button>
              );
            })}

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-4 rounded-xl border border-landing-border bg-landing-bg px-4 py-4 transition-colors duration-200 hover:border-landing-lime/35 hover:bg-landing-lime/5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-landing-border bg-landing-card text-landing-lime">
                <CircleUserRound className="h-5 w-5" />
              </span>
              <span className="font-semibold">Acceso clientes</span>
            </Link>
          </div>

          <div className="mt-6 space-y-3 border-t border-landing-border pt-6">
            <button
              type="button"
              onClick={openValuation}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-landing-lime to-landing-lime-dark px-4 py-4 font-medium text-landing-bg shadow-[0_3px_12px_rgba(200,224,108,0.25)]"
            >
              <CalendarDays className="h-5 w-5" />
              Reserva tu valoración
            </button>
            <button
              type="button"
              onClick={openRates}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-landing-silver-start bg-transparent px-4 py-4 font-medium text-landing-text"
            >
              <Tags className="h-5 w-5" />
              Ver tarifas
            </button>
          </div>
        </nav>
      </aside>

      <TariffsModal open={ratesOpen} onClose={() => setRatesOpen(false)} onReserve={reserveFromRates} />
    </>
  );
}
