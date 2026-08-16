"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BRAND_LOCKUP = "/brand/chetesai-login-lockup.svg";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/password-recovery/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        redirectTo?: string;
      };

      if (!response.ok || !data.ok) {
        setError(data.error || "No se pudo actualizar la contraseña");
        return;
      }

      setSuccess(data.message || "Contraseña actualizada correctamente.");
      window.setTimeout(() => {
        window.location.assign(data.redirectTo || "/login?passwordReset=1");
      }, 1200);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f6f1] px-4 py-7 text-[#07182b] sm:px-6 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-52 bottom-[-260px] h-[650px] w-[650px] rounded-full border border-[#a5e829]/35" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-56 top-20 h-[650px] w-[650px] rounded-full border border-[#a5e829]/30" />

      <section className="relative z-10 w-full max-w-[760px] rounded-[34px] border border-black/[0.06] bg-white/95 px-5 py-7 shadow-[0_25px_80px_rgba(5,22,38,0.10)] backdrop-blur sm:px-10 sm:py-9">
        <header className="mb-8 flex justify-center">
          <img
            src={BRAND_LOCKUP}
            alt="Chetesaí Fitness+ · Carga tus energías"
            className="block h-auto w-full max-w-[580px] object-contain"
            style={{ aspectRatio: "1000 / 320" }}
          />
        </header>

        <div className="mx-auto max-w-[560px]">
          <div className="mb-7 text-center sm:text-left">
            <p className="mb-3 text-xs font-extrabold tracking-[0.30em] text-[#579600] sm:text-sm">NUEVA CONTRASEÑA</p>
            <h1 className="text-[36px] font-black tracking-[-0.04em] text-[#07182b] sm:text-[44px]">Restablecer contraseña</h1>
            <p className="mt-3 text-base leading-relaxed text-[#707b89]">
              Crea una contraseña nueva para recuperar el acceso a tu cuenta Chetesaí Fitness+.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="font-bold text-[#07182b]">Nueva contraseña</Label>
              <div className="relative">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#909aa8]" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className="h-14 rounded-xl border-[#d9dde2] bg-white pl-12 pr-12 text-base shadow-none focus-visible:border-[#8ee500] focus-visible:ring-[#8ee500]/25"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909aa8] transition hover:text-[#07182b]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="font-bold text-[#07182b]">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la nueva contraseña"
                required
                minLength={8}
                className="h-14 rounded-xl border-[#d9dde2] bg-white px-4 text-base shadow-none focus-visible:border-[#8ee500] focus-visible:ring-[#8ee500]/25"
              />
            </div>

            <p className="text-sm leading-relaxed text-[#7b8591]">
              Usa al menos 8 caracteres y evita reutilizar una contraseña anterior.
            </p>

            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
            {success ? <div className="rounded-xl border border-[#cbd9b4] bg-[#f7fbef] px-4 py-4 text-sm font-medium text-[#315f22]">{success}</div> : null}

            <Button
              type="submit"
              disabled={loading || Boolean(success)}
              className="h-16 w-full rounded-xl bg-[#8ef000] text-lg font-black text-[#07182b] shadow-[0_12px_28px_rgba(142,229,0,0.22)] transition hover:bg-[#82df00]"
            >
              {loading ? "Actualizando contraseña..." : success ? "Contraseña actualizada ✓" : "Guardar nueva contraseña →"}
            </Button>

            <div className="pt-1 text-center">
              <Link href="/forgot-password" className="text-sm font-bold text-[#07182b] underline decoration-[#8ee500] decoration-2 underline-offset-4">
                Solicitar un nuevo enlace
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
