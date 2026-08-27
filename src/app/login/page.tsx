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
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="7" r="3" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2M8 11l4 2 4-2" />
      {active ? <path d="M3 8h3M18 8h3" /> : null}
    </svg>
  );
}

function ClientIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="7" r="3" />
      <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.509h3.227c1.89-1.741 2.986-4.305 2.986-7.35Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.964-.895 6.614-2.423l-3.227-2.509c-.895.6-2.041.955-3.387.955-2.605 0-4.809-1.759-5.6-4.123H3.064v2.591A9.997 9.997 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.9A6.02 6.02 0 0 1 6.086 12c0-.659.114-1.3.314-1.9V7.509H3.064A9.997 9.997 0 0 0 2 12c0 1.614.386 3.141 1.064 4.491L6.4 13.9Z" />
      <path fill="#EA4335" d="M12 5.977c1.468 0 2.786.505 3.823 1.495l2.864-2.863C16.959 2.995 14.695 2 12 2a9.997 9.997 0 0 0-8.936 5.509L6.4 10.1c.791-2.364 2.995-4.123 5.6-4.123Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [accessRole, setAccessRole] = useState<AccessRole>("profesional");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const savedEmail = window.localStorage.getItem("chetesai_login_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("oauthError");
    if (oauthError) setError(oauthError);
    if (params.get("passwordReset") === "1") {
      setNotice("Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.");
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, accessRole }),
      });
      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        return;
      }

      if (rememberMe) window.localStorage.setItem("chetesai_login_email", email);
      else window.localStorage.removeItem("chetesai_login_email");

      router.replace(data.redirectTo || (accessRole === "cliente" ? "/portal" : "/dashboard"));
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setError("");
    setNotice("");
    setGoogleLoading(true);
    window.location.assign(`/api/auth/google/start?role=${accessRole}`);
  }

  const forgotPasswordHref = email.trim()
    ? `/forgot-password?email=${encodeURIComponent(email.trim())}`
    : "/forgot-password";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f6f1] px-4 py-7 text-[#07182b] sm:px-6 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-52 bottom-[-260px] h-[650px] w-[650px] rounded-full border border-[#a5e829]/35" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-36 bottom-[-210px] h-[560px] w-[560px] rounded-full border border-[#a5e829]/25" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-56 top-20 h-[650px] w-[650px] rounded-full border border-[#a5e829]/30" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-36 h-[560px] w-[560px] rounded-full border border-[#a5e829]/20" />

      <section className="relative z-10 w-full max-w-[900px] rounded-[34px] border border-black/[0.06] bg-white/95 px-5 py-7 shadow-[0_25px_80px_rgba(5,22,38,0.10)] backdrop-blur sm:px-10 sm:py-9">
        <header className="mb-8 flex justify-center">
          <img
            src={BRAND_LOCKUP}
            alt="Chetesaí Fitness+ · Carga tus energías"
            className="block h-auto w-full max-w-[680px] object-contain"
            style={{ aspectRatio: "1000 / 320" }}
          />
        </header>

        <div className="mx-auto max-w-[650px]">
          <div className="mb-7 text-center sm:text-left">
            <p className="mb-3 text-xs font-extrabold tracking-[0.30em] text-[#579600] sm:text-sm">BIENVENIDO DE NUEVO</p>
            <h1 className="text-[38px] font-black tracking-[-0.04em] text-[#07182b] sm:text-[48px]">Iniciar sesión</h1>
            <p className="mt-2 text-base text-[#707b89]">Elige tu rol y entra con tu cuenta para ver tu panel.</p>
          </div>

          <div className="mb-7 grid grid-cols-2 rounded-full bg-[#f0f1ed] p-1.5" role="tablist" aria-label="Tipo de acceso">
            <button type="button" role="tab" aria-selected={accessRole === "profesional"} onClick={() => { setAccessRole("profesional"); setError(""); }} className={`flex items-center justify-center gap-2 rounded-full px-3 py-3.5 text-sm font-black transition-all sm:text-base ${accessRole === "profesional" ? "bg-[#98f21f] text-[#07182b] shadow-[0_8px_20px_rgba(142,229,0,0.22)]" : "text-[#6f7988]"}`}>
              <ProfessionalIcon active={accessRole === "profesional"} /> Profesional
            </button>
            <button type="button" role="tab" aria-selected={accessRole === "cliente"} onClick={() => { setAccessRole("cliente"); setError(""); }} className={`flex items-center justify-center gap-2 rounded-full px-3 py-3.5 text-sm font-black transition-all sm:text-base ${accessRole === "cliente" ? "bg-[#98f21f] text-[#07182b] shadow-[0_8px_20px_rgba(142,229,0,0.22)]" : "text-[#6f7988]"}`}>
              <ClientIcon /> Cliente
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-[#07182b]">Correo electrónico</Label>
              <div className="relative">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#909aa8]" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" required className="h-14 rounded-xl border-[#d9dde2] bg-white pl-12 pr-4 text-base shadow-none focus-visible:border-[#8ee500] focus-visible:ring-[#8ee500]/25" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-[#07182b]">Contraseña</Label>
              <div className="relative">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#909aa8]" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>
                <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required className="h-14 rounded-xl border-[#d9dde2] bg-white pl-12 pr-12 text-base shadow-none focus-visible:border-[#8ee500] focus-visible:ring-[#8ee500]/25" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#909aa8] transition hover:text-[#07182b]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <label className="flex cursor-pointer items-center gap-3 text-[#6f7988]">
                <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-5 w-5 rounded border-[#b6bec8] accent-[#8ee500]" />
                Recordarme
              </label>
              <Link href={forgotPasswordHref} className="font-bold text-[#07182b] underline decoration-[#8ee500] decoration-2 underline-offset-4 transition hover:text-[#4d7900]">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {notice ? <div className="rounded-xl border border-[#cbd9b4] bg-[#f7fbef] px-4 py-3 text-sm font-medium text-[#315f22]">{notice}</div> : null}
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

            <Button type="submit" disabled={loading || googleLoading} className="h-16 w-full rounded-xl bg-[#8ef000] text-lg font-black text-[#07182b] shadow-[0_12px_28px_rgba(142,229,0,0.22)] transition hover:bg-[#82df00] hover:shadow-[0_14px_32px_rgba(142,229,0,0.28)]">
              {loading ? "Comprobando acceso..." : `Entrar como ${accessRole === "cliente" ? "cliente" : "profesional"}  →`}
            </Button>

            <div className="flex items-center gap-4 py-1 text-xs font-medium text-[#98a0aa]">
              <span className="h-px flex-1 bg-[#e3e5e7]" />
              <span>o continúa con</span>
              <span className="h-px flex-1 bg-[#e3e5e7]" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-[#d9dde2] bg-white text-base font-bold text-[#07182b] shadow-sm transition hover:border-[#bfc5cc] hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <GoogleIcon />
              {googleLoading ? "Conectando con Google..." : "Continuar con Google"}
            </button>

            <div className="flex gap-3 rounded-2xl border border-[#cbd9b4] bg-[#f7fbef] px-4 py-4 text-sm leading-relaxed text-[#315f22]">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-[#4b7b2c] font-black">i</span>
              <p>El acceso y los permisos dependen del rol asignado a cada cuenta.</p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
