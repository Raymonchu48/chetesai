"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BRAND_LOCKUP = "/brand/chetesai-login-lockup.svg";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialEmail = params.get("email");
    const recoveryError = params.get("error");
    if (initialEmail) setEmail(initialEmail);
    if (recoveryError) setError(recoveryError);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/password-recovery/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; message?: string };

      if (!response.ok || !data.ok) {
        setError(data.error || "No se pudo enviar el correo de recuperación");
        return;
      }

      setSuccess(
        data.message ||
          "Si existe una cuenta con ese correo, recibirás un enlace para crear una nueva contraseña."
      );
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
            <p className="mb-3 text-xs font-extrabold tracking-[0.30em] text-[#579600] sm:text-sm">RECUPERAR ACCESO</p>
            <h1 className="text-[36px] font-black tracking-[-0.04em] text-[#07182b] sm:text-[44px]">¿Olvidaste tu contraseña?</h1>
            <p className="mt-3 text-base leading-relaxed text-[#707b89]">
              Introduce el correo asociado a tu cuenta. Te enviaremos un enlace seguro para crear una nueva contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-[#07182b]">Correo electrónico</Label>
              <div className="relative">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#909aa8]" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  className="h-14 rounded-xl border-[#d9dde2] bg-white pl-12 pr-4 text-base shadow-none focus-visible:border-[#8ee500] focus-visible:ring-[#8ee500]/25"
                />
              </div>
            </div>

            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}
            {success ? (
              <div className="rounded-xl border border-[#cbd9b4] bg-[#f7fbef] px-4 py-4 text-sm leading-relaxed text-[#315f22]">
                <strong>Correo solicitado.</strong> {success} Revisa también la carpeta de spam.
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={loading}
              className="h-16 w-full rounded-xl bg-[#8ef000] text-lg font-black text-[#07182b] shadow-[0_12px_28px_rgba(142,229,0,0.22)] transition hover:bg-[#82df00]"
            >
              {loading ? "Enviando enlace..." : "Enviar enlace de recuperación →"}
            </Button>

            <div className="pt-1 text-center">
              <Link href="/login" className="text-sm font-bold text-[#07182b] underline decoration-[#8ee500] decoration-2 underline-offset-4">
                ← Volver a iniciar sesión
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
