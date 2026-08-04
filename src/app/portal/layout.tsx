"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, CalendarDays, Dumbbell, PartyPopper, TrendingUp, WalletCards } from "lucide-react";

const items = [
  { href: "/portal", label: "Entrenamiento", icon: Dumbbell },
  { href: "/portal/citas", label: "Citas", icon: CalendarDays },
  { href: "/portal/eventos", label: "Eventos", icon: PartyPopper },
  { href: "/portal/progreso", label: "Progreso", icon: TrendingUp },
  { href: "/portal/bienestar", label: "Nutrición", icon: Apple },
  { href: "/portal/pagos", label: "Pagos", icon: WalletCards },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen pb-24">
      {children}
      <nav className="fixed inset-x-3 bottom-3 z-50 mx-auto flex max-w-4xl items-center justify-start overflow-x-auto rounded-2xl border border-[#d8dfd9] bg-[#fffdf9]/95 p-2 shadow-2xl backdrop-blur-xl sm:justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === "/portal" ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-20 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition sm:min-w-24 ${
                active ? "bg-[#46624f] text-white" : "text-[#65706a] hover:bg-[#eef2ee] hover:text-[#29312e]"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
