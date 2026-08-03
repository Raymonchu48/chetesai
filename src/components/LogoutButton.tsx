"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } finally {
      router.replace("/login");
      router.refresh();
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={`flex w-full items-center gap-3 rounded-lg border border-[#46624f] bg-[#46624f] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#354d3d] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 ${
        collapsed ? "justify-center" : ""
      }`}
      title={collapsed ? "Cerrar sesión" : undefined}
    >
      <LogOut className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{loading ? "Cerrando sesión..." : "Cerrar sesión"}</span>}
    </button>
  );
}
