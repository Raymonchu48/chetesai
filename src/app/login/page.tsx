"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccessRole = "profesional" | "cliente";

type LoginResponse = {
  ok: boolean;
  error?: string;
  redirectTo?: string;
  user?: { role?: string };
};

const BRAND_LOCKUP = "/brand/chetesai-login-lockup.svg";

function ProfessionalIcon({ active }: { active: boolean }) {
  const roleDescription =
    accessRole === "profesional"
      ? "Gestiona clientes, planes y evolución desde un único espacio."
      : "Consulta tus entrenamientos, nutrición y progreso personal.";

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#041426] px-3 py-4 text-[#07182b] sm:px-6 sm:py-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 18%, rgba(142,240,0,0.18), transparent 27%), radial-gradient(circle at 88% 82%, rgba(199,162,84,0.16), transparent 28%), linear-gradient(145deg, #03101f 0%, #071d33 48%, #0b2941 100%)",
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.11]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-[#8ef000]/15 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-[#c7a254]/15 blur-3xl" />

      <section className="relative z-10 grid w-full max-w-[1050px] overflow-hidden rounded-[28px] border border-white/15 bg-[#fbfcfa] shadow-[0_32px_100px_rgba(0,0,0,0.42)] lg:grid-cols-[0.88fr_1.12fr] lg:rounded-[38px]">
        <aside className="relative overflow-hidden bg-[#07182b] px-5 py-5 text-white sm:px-8 sm:py-7 lg:flex lg:min-h-[720px] lg:flex-col lg:justify-between lg:px-10 lg:py-10">
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-[#8ef000]/25" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full border border-[#c7a254]/25" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-[#8ef000]/10 blur-2xl" />

          <div className="relative rounded-2xl border border-white/10 bg-white px-4 py-3 shadow-[0_16px_45px_rgba(0,0,0,0.25)] sm:px-6 sm:py-4">
            <img
              src={BRAND_LOCKUP}
              alt="Chetesaí Fitness+ · Carga tus energías"
              className="mx-auto block h-auto w-full max-w-[420px] object-contain"
              style={{ aspectRatio: "1000 / 320" }}
            />
          </div>

          <div className="relative mt-5 hidden lg:block">
            <p className="text-xs font-black tracking-[0.28em] text-[#9af51e]">TU ESPACIO CHETESAÍ</p>
            <h2 className="mt-4 max-w-sm text-[34px] font-black leading-[1.05] tracking-[-0.04em]">
              Todo tu progreso, en un mismo lugar.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-relaxed text-white/65">
              Accede de forma segura a las herramientas que te ayudan a avanzar cada día.
            </p>

            <div className="mt-8 space-y-4">
              {["Entrenamiento personalizado", "Nutrición y seguimiento", "Evolución siempre visible"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-bold text-white/90">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8ef000] text-[#07182b] shadow-[0_0_22px_rgba(142,240,0,0.25)]">
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3"><path d="m5 12 4 4L19 6" /></svg>
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative mt-5 hidden text-xs text-white/40 lg:block">Chetesaí Fitness+ · Carga tus energías</p>
        </aside>

        <div className="px-5 py-6 sm:px-10 sm:py-9 lg:px-12 lg:py-10">
          <div className="mb-6">
            <p className="mb-2 text-[11px] font-black tracking-[0.28em] text-[#579600] sm:text-xs">BIENVENIDO DE NUEVO</p>
            <h1 className="text-[36px] font-black leading-none tracking-[-0.045em] text-[#07182b] sm:text-[46px]">Iniciar sesión</h1>
            <p className="mt-3 min-h-10 text-sm leading-relaxed text-[#687585] sm:text-base" aria-live="polite">{roleDescription}</p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-2xl border border-[#e2e6e8] bg-[#eef1ef] p-1.5 shadow-inner" role="tablist" aria-label="Tipo de acceso">
            <button
              type="button"
              role="tab"
              aria-selected={accessRole === "profesional"}
              onClick={() => { setAccessRole("profesional"); setError(""); }}
              className={"flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-3.5 text-sm font-black transition-all sm:px-3 sm:text-base " + (accessRole === "profesional" ? "bg-gradient-to-r from-[#9af51e] to-[#82e900] text-[#07182b] shadow-[0_9px_24px_rgba(142,229,0,0.28)]" : "text-[#6f7988] hover:text-[#07182b]")}
            >
              <ProfessionalIcon active={accessRole === "profesional"} /> <span>Profesional</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={accessRole === "cliente"}
              onClick={() => { setAccessRole("cliente"); setError(""); }}
              className={"flex min-w-0 items-center justify-center gap-2 rounded-xl px-2 py-3.5 text-sm font-black transition-all sm:px-3 sm:text-base " + (accessRole === "cliente" ? "bg-gradient-to-r from-[#9af51e] to-[#82e900] text-[#07182b] shadow-[0_9px_24px_rgba(142,229,0,0.28)]" : "text-[#6f7988] hover:text-[#07182b]")}
            >
              <ClientIcon /> <span>Cliente</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4.5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-[#07182b]">Correo electrónico</Label>
              <div className="relative">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#84909e]" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" required className="h-14 rounded-xl border-[#d8dee2] bg-[#f5f7f7] pl-12 pr-4 text-base shadow-inner transition focus-visible:border-[#79c900] focus-visible:bg-white focus-visible:ring-[#8ee500]/25" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-[#07182b]">Contraseña</Label>
              <div className="relative">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#84909e]" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required className="h-14 rounded-xl border-[#d8dee2] bg-[#f5f7f7] pl-12 pr-12 text-base shadow-inner transition focus-visible:border-[#79c900] focus-visible:bg-white focus-visible:ring-[#8ee500]/25" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#84909e] transition hover:text-[#07182b]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 text-xs sm:text-sm">
              <label className="flex cursor-pointer items-center gap-2.5 text-[#687585]">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-5 w-5 rounded border-[#aeb8c1] accent-[#8ee500]" />
                Recordarme
              </label>
              <Link href={forgotPasswordHref} className="text-right font-bold text-[#07182b] underline decoration-[#8ee500] decoration-2 underline-offset-4 transition hover:text-[#4d7900]">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {notice ? <div className="rounded-xl border border-[#cbd9b4] bg-[#f7fbef] px-4 py-3 text-sm font-medium text-[#315f22]">{notice}</div> : null}
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

            <Button type="submit" disabled={loading || googleLoading} className="h-15 w-full rounded-xl bg-gradient-to-r from-[#9af51e] to-[#82e900] text-base font-black text-[#07182b] shadow-[0_12px_30px_rgba(142,229,0,0.28)] transition hover:-translate-y-0.5 hover:from-[#a5fa34] hover:to-[#8ef000] hover:shadow-[0_16px_36px_rgba(142,229,0,0.34)] sm:text-lg">
              {loading ? "Comprobando acceso..." : "Entrar como " + (accessRole === "cliente" ? "cliente" : "profesional") + "  →"}
            </Button>

            <div className="flex items-center gap-4 py-0.5 text-xs font-medium text-[#98a0aa]">
              <span className="h-px flex-1 bg-[#dfe4e6]" />
              <span>o continúa con</span>
              <span className="h-px flex-1 bg-[#dfe4e6]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="flex h-13 w-full items-center justify-center gap-3 rounded-xl border border-[#d6dce0] bg-white text-sm font-bold text-[#07182b] shadow-[0_5px_16px_rgba(7,24,43,0.06)] transition hover:border-[#b9c3ca] hover:bg-[#f9faf9] disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
            >
              <GoogleIcon />
              {googleLoading ? "Conectando con Google..." : "Continuar con Google"}
            </button>

            <div className="flex gap-3 rounded-xl border border-[#d9e6c8] bg-[#f5faee] px-4 py-3 text-xs leading-relaxed text-[#315f22] sm:text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#4b7b2c] text-[11px] font-black">i</span>
              <p>El acceso y los permisos dependen del rol asignado a cada cuenta.</p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
