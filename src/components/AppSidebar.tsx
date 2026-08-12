"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Apple,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  Menu,
  PartyPopper,
  PlayCircle,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { files } from "@/assets/files";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { href: "/ejercicios/entrenamiento", label: "Biblioteca visual", icon: PlayCircle },
  { href: "/rutinas", label: "Rutinas", icon: ClipboardList },
  { href: "/progreso", label: "Progreso", icon: Activity },
  { href: "/nutricion", label: "Nutrición", icon: Apple },
  { href: "/sesiones", label: "Sesiones", icon: CalendarDays },
  { href: "/eventos", label: "Eventos", icon: PartyPopper },
  { href: "/pagos", label: "Pagos", icon: CreditCard },
  { href: "/informes", label: "Informes", icon: BarChart3 },
];

export default function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background md:flex md:h-screen md:overflow-hidden">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground shadow-sm md:hidden">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
          <img src={files.logo.url} alt="ChetesaíFitness+ Logo" className="h-10 w-10 shrink-0 rounded-xl bg-white p-0.5 object-contain" />
          <div className="min-w-0">
            <p className="truncate font-bold">ChetesaíFitness+</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">Panel profesional</p>
          </div>
        </Link>
        <button type="button" onClick={() => setMobileOpen(true)} className="grid h-11 w-11 place-items-center rounded-xl border border-sidebar-border text-sidebar-foreground transition hover:bg-sidebar-accent" aria-label="Abrir menú" aria-expanded={mobileOpen}>
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {mobileOpen ? <button type="button" className="fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px] md:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" /> : null}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(86vw,300px)] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-2xl transition-transform duration-300 md:static md:z-auto md:translate-x-0 md:shadow-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "md:w-[72px]" : "md:w-64"}`}>
        <div className="flex min-h-[65px] items-center border-b border-sidebar-border">
          <Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-3 p-4 transition-colors hover:bg-sidebar-accent/50">
            <img src={files.logo.url} alt="ChetesaíFitness+ Logo" className="h-10 w-10 shrink-0 rounded-lg bg-white p-0.5 object-contain" />
            {!collapsed ? <div className="min-w-0 overflow-hidden"><h1 className="truncate text-lg font-bold leading-tight tracking-tight">ChetesaíFitness+</h1><p className="truncate text-[11px] leading-tight text-sidebar-foreground/60">Panel profesional</p></div> : null}
          </Link>
          <button type="button" onClick={() => setMobileOpen(false)} className="mr-3 grid h-10 w-10 place-items-center rounded-lg text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-white md:hidden" aria-label="Cerrar menú"><X className="h-5 w-5" /></button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/ejercicios" && pathname.startsWith(item.href + "/")) || (item.href === "/ejercicios" && pathname === "/ejercicios");
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"} ${collapsed ? "md:justify-center" : ""}`} title={collapsed ? item.label : undefined}>
                <Icon className="h-5 w-5 shrink-0" />
                <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <LogoutButton collapsed={collapsed} />
          <button type="button" onClick={() => setCollapsed(!collapsed)} className="mt-1 hidden w-full items-center justify-center rounded-lg py-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:flex" aria-label={collapsed ? "Expandir menú" : "Contraer menú"}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden bg-background md:overflow-y-auto">{children}</main>
    </div>
  );
}
