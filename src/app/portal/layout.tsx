"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Apple, BookOpen, CalendarDays, ChevronDown, Dumbbell, Menu, PartyPopper, TrendingUp, WalletCards, X } from "lucide-react";

const items = [
  { href: "/portal", label: "Entrenamiento", icon: Dumbbell },
  { href: "/portal/ejercicios", label: "Guías", icon: BookOpen },
  { href: "/portal/citas", label: "Citas", icon: CalendarDays },
  { href: "/portal/eventos", label: "Eventos", icon: PartyPopper },
  { href: "/portal/progreso", label: "Progreso", icon: TrendingUp },
  { href: "/portal/bienestar", label: "Nutrición", icon: Apple },
  { href: "/portal/pagos", label: "Pagos", icon: WalletCards },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const activeItem = items.find((item) => item.href === "/portal" ? pathname === item.href : pathname.startsWith(item.href)) || items[0];
  const ActiveIcon = activeItem.icon;

  return (
    <div className="min-h-screen bg-[#f3f0e8] pb-24 sm:pb-28">
      {children}

      <div className={`fixed inset-0 z-40 bg-[#07110c]/55 backdrop-blur-sm transition-opacity duration-300 md:hidden ${menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`} onClick={() => setMenuOpen(false)} aria-hidden="true" />

      <nav aria-label="Navegación del cliente" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-5xl">
        <div id="client-mobile-menu" className={`mb-2 overflow-hidden rounded-[28px] border border-[#d7b86b]/30 bg-[#111a15]/98 shadow-[0_24px_70px_rgba(7,17,12,0.4)] backdrop-blur-xl transition-all duration-300 md:hidden ${menuOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"}`}>
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
            <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#d7b86b]">Chetesaí Fitness+</p><p className="mt-1 text-sm font-bold text-white">Tu espacio personal</p></div>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="Cerrar menú" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white"><X className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            {items.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/portal" ? pathname === item.href : pathname.startsWith(item.href);
              return <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-sm font-bold transition ${active ? "border-[#8cdb78]/50 bg-[#8cdb78] text-[#101713] shadow-lg shadow-[#8cdb78]/15" : "border-white/8 bg-white/[0.045] text-white/75 hover:border-[#8cdb78]/30 hover:bg-[#8cdb78]/10 hover:text-white"}`}><Icon className="h-5 w-5 shrink-0" />{item.label}</Link>;
            })}
          </div>
        </div>

        <button type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="client-mobile-menu" className="flex w-full items-center justify-between rounded-2xl border border-[#d7b86b]/35 bg-[#111a15]/98 px-4 py-3 text-white shadow-2xl backdrop-blur-xl md:hidden">
          <span className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#8cdb78] text-[#101713]"><ActiveIcon className="h-5 w-5" /></span><span className="text-left"><span className="block text-[9px] font-black uppercase tracking-[0.18em] text-[#d7b86b]">Zona cliente</span><span className="block text-sm font-bold">{activeItem.label}</span></span></span>
          <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold"><Menu className="h-4 w-4" />Menú<ChevronDown className={`h-4 w-4 transition-transform duration-300 ${menuOpen ? "rotate-180" : ""}`} /></span>
        </button>

        <div className="hidden items-center justify-around rounded-[24px] border border-[#d7b86b]/30 bg-[#111a15]/96 p-2 shadow-2xl backdrop-blur-xl md:flex">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/portal" ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} className={`flex min-w-24 flex-col items-center gap-1 rounded-2xl px-3 py-2.5 text-xs font-bold transition ${active ? "bg-[#8cdb78] text-[#101713] shadow-lg shadow-[#8cdb78]/15" : "text-white/65 hover:bg-white/8 hover:text-white"}`}><Icon className="h-5 w-5" />{item.label}</Link>;
          })}
        </div>
      </nav>
    </div>
  );
}
