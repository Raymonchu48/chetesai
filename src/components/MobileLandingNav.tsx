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

const navigationItems = [
  { id: "servicios", label: "Servicios", icon: PanelsTopLeft },
  { id: "proceso", label: "Cómo funciona", icon: ChevronRight },
  { id: "sobre-mi", label: "Sobre mí", icon: UserRound },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

export function MobileLandingNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (pathname !== "/") return null;

  function goToSection(sectionId: string) {
    setOpen(false);
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function showRates() {
    const ratesButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button")).find((button) => {
      const isRatesButton = button.textContent?.toLowerCase().includes("ver tarifas");
      const isInsideMobileMenu = Boolean(button.closest("#mobile-landing-menu"));
      return isRatesButton && !isInsideMobileMenu;
    });

    setOpen(false);
    window.setTimeout(() => ratesButton?.click(), 120);
  }

  return (
    <>
      <button
        type="button"
        aria-label="Abrir menú de navegación"
        aria-expanded={open}
        aria-controls="mobile-landing-menu"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-[6.75rem] z-[70] grid h-12 w-12 place-items-center rounded-2xl border border-[#b38d45]/40 bg-[#101713]/90 text-white shadow-2xl backdrop-blur-xl xl:hidden"
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
        className={`fixed left-0 top-0 z-[90] flex h-dvh w-[86%] max-w-sm flex-col border-r border-[#b38d45]/25 bg-[#101713] text-white shadow-2xl transition-transform duration-300 ease-out xl:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div>
            <p className="text-sm font-black">Chetesaí Fitness+</p>
            <p className="mt-1 text-xs text-white/55">Navegación</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5"
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
                  className="flex w-full items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-4 text-left transition hover:border-[#8cdb78]/35 hover:bg-[#8cdb78]/10"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#8cdb78]/10 text-[#8cdb78]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-semibold">{item.label}</span>
                </button>
              );
            })}

            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.035] px-4 py-4 transition hover:border-[#8cdb78]/35 hover:bg-[#8cdb78]/10"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#8cdb78]/10 text-[#8cdb78]">
                <CircleUserRound className="h-5 w-5" />
              </span>
              <span className="font-semibold">Acceso clientes</span>
            </Link>
          </div>

          <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
            <button
              type="button"
              onClick={() => goToSection("contacto")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2f9e24] px-4 py-4 font-bold text-white shadow-lg shadow-[#2f9e24]/15"
            >
              <CalendarDays className="h-5 w-5" />
              Reserva tu valoración
            </button>
            <button
              type="button"
              onClick={showRates}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-4 py-4 font-bold text-white"
            >
              <Tags className="h-5 w-5" />
              Ver tarifas
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
