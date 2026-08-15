"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginResponse = {
  ok: boolean;
  error?: string;
  redirectTo?: string;
};

const BRAND_MARK = "/brand/chetesai-logo-mark.svg";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        return;
      }

      router.replace(data.redirectTo || "/dashboard");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f6f1] px-5 py-10 text-[#07182b]">
      <div aria-hidden="true" className="pointer-events-none absolute -left-48 bottom-[-260px] h-[620px] w-[620px] rounded-full border border-[#a5e829]/40" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-36 bottom-[-220px] h-[560px] w-[560px] rounded-full border border-[#a5e829]/30" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 bottom-[-180px] h-[500px] w-[500px] rounded-full border border-[#a5e829]/20" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-56 top-24 h-[620px] w-[620px] rounded-full border border-[#a5e829]/35" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-44 top-36 h-[560px] w-[560px] rounded-full border border-[#a5e829]/25" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-48 h-[500px] w-[500px] rounded-full border border-[#a5e829]/15" />

      <section className="relative z-10 w-full max-w-[620px] rounded-[34px] border border-black/[0.06] bg-white/95 px-7 py-9 shadow-[0_25px_80px_rgba(5,22,38,0.10)] backdrop-blur sm:px-12 sm:py-11">
        <header className="mb-10 flex items-center gap-5 sm:gap-6">
          <div className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-[22px] bg-[#07111f] p-2.5 shadow-[0_10px_24px_rgba(7,17,31,0.18)] ring-1 ring-black/10 sm:h-[86px] sm:w-[86px]">
            <img src={BRAND_MARK} alt="Chetesaí Fitness+" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 leading-none">
              <span className="text-[22px] font-black tracking-[0.08em] text-[#07182b] sm:text-[27px]">CHETESAÍ</span>
              <span className="text-[22px] font-black tracking-[0.08em] text-[#07182b] sm:text-[27px]">FITNESS<span className="text-[#8ee500]">+</span></span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm font-medium text-[#344252] sm:text-base">
              <span className="h-px w-5 bg-[#8ee500]" />
              <span>Carga tus energías</span>
              <span className="h-px w-5 bg-[#8ee500]" />
            </div>
          </div>
        </header>

        <div className="mb-8">
          <p className="mb-3 text-xs font-extrabold tracking-[0.27em] text-[#579600] sm:text-sm">BIENVENIDO DE NUEVO</p>
          <h1 className="text-[34px] font-black tracking-[-0.03em] text-[#07182b] sm:text-[42px]">Iniciar sesión</h1>
          <p className="mt-2 text-sm text-[#6b7682] sm:text-base">Accede a tu cuenta de Chetesaí Fitness+.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-bold text-[#07182b]">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="correo@ejemplo.com"
              required
              className="h-14 rounded-xl border-[#d9dde2] bg-white px-4 text-base shadow-none focus-visible:border-[#8ee500] focus-visible:ring-[#8ee500]/25"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold text-[#07182b]">Contraseña</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              className="h-14 rounded-xl border-[#d9dde2] bg-white px-4 text-base shadow-none focus-visible:border-[#8ee500] focus-visible:ring-[#8ee500]/25"
            />
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-14 w-full rounded-xl bg-[#98f21f] text-base font-black text-[#07182b] shadow-[0_10px_24px_rgba(142,229,0,0.18)] transition hover:bg-[#87df10] hover:shadow-[0_12px_28px_rgba(142,229,0,0.24)]"
          >
            {loading ? "Comprobando acceso..." : "Entrar  →"}
          </Button>
        </form>
      </section>
    </main>
  );
}
