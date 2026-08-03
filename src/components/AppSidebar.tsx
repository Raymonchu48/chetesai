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
  Users,
} from "lucide-react";
import { useState } from "react";
import { files } from "@/assets/files";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/ejercicios", label: "Ejercicios", icon: Dumbbell },
  { href: "/rutinas", label: "Rutinas", icon: ClipboardList },
  { href: "/progreso", label: "Progreso", icon: Activity },
  { href: "/nutricion", label: "Nutrición", icon: Apple },
  { href: "/sesiones", label: "Sesiones", icon: CalendarDays },
  { href: "/pagos", label: "Pagos", icon: CreditCard },
  { href: "/informes", label: "Informes", icon: BarChart3 },
];

export default function AppSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside
        className={`${
          collapsed ? "w-[72px]" : "w-64"
        } bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col transition-all duration-300 shrink-0`}
      >
        <Link
          href="/dashboard"
          className="p-4 flex items-center gap-3 border-b border-sidebar-border min-h-[65px] hover:bg-sidebar-accent/50 transition-colors"
        >
          <img
            src={files.logo.url}
            alt="ChetesaíFitness+ Logo"
            className="w-10 h-10 rounded-lg object-contain shrink-0 bg-white p-0.5"
          />
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="font-bold text-lg tracking-tight leading-tight">ChetesaíFitness+</h1>
              <p className="text-[11px] text-sidebar-foreground/60 leading-tight">Panel profesional</p>
            </div>
          )}
        </Link>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <LogoutButton collapsed={collapsed} />
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="mt-1 flex w-full items-center justify-center rounded-lg py-2 text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
