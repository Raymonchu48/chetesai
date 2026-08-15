"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AccessRole = "profesional" | "cliente";

type LoginResponse = {
  ok: boolean;
  error?: string;
  redirectTo?: string;
  user?: {
    role?: string;
  };
};

const BRAND_LOCKUP = "/brand/chetesai-login-lockup.svg";

export default function LoginPage() {
  const router = useRouter();
  const [accessRole, setAccessRole] = useState<AccessRole>("profesional");
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
        body: JSON.stringify({ email, password, accessRole }),
      });
      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        return;
      }

      router.replace(data.redirectTo || (accessRole === "cliente" ? "/portal" : "/dashboard"));
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f6f1] px-4 py-8 text-[#07182b] sm:px-6 sm:py-10">
      <div aria-hidden="true" className="pointer-events-none absolute -left-48 bottom-[-260px] h-[620px] w-[620px] rounded-full border border-[#a5e829]/40" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-36 bottom-[-220px] h-[560px] w-[560px] rounded-full border border-[#a5e829]/30" />
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 bottom-[-180px] h-[500px] w-[500px] rounded-full border border-[#a5e829]/20" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-56 top-24 h-[620px] w-[620px] rounded-full border border-[#a5e829]/35" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-44 top-36 h-[560px] w-[560px] rounded-full border border-[#a5e829]/25" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-48 h-[500px] w-[500px] rounded-full border border-[#a5e829]/15" />

      <section className="relative z-10 w-full max-w-[760px] rounded-[34px] border border-black/[0.06] bg-white/95 px-6 py-8 shadow-[0_25px_80px_rgba(5,22,38,0.10)] backdrop-blur sm:px-12 sm:py-10">
        <header className="mb-7 flex justify-center">
          <img src={BRAND_LOCKUP} alt="Chetesaí Fitness+ · Carga tus energías" className="h-auto w-full max-w-[560px] object-contain" />
        </header>

        <div className="mx-auto max-w-[560px]">
          <div className="mb-7">
            <p className="mb-3 text-xs font-extrabold tracking-[0.27em] text-[#579600] sm:text-sm">BIENVENIDO DE NUEVO</p>
            <h1 className="text-[34px] font-black tracking-[-0.03em] text-[#07182b] sm:text-[42px]">Iniciar sesión</h1>
            <p className="mt-2 text-sm text-[#6b7682] sm:text-base">Elige tu rol y entra con tu cuenta para ver tu panel.</p>
          </div>

          <div className="mb-7 grid grid-cols-2 rounded-full bg-[#f0f1ed] p-1" role="tablist" aria-label="Tipo de acceso">
            <button type="button" role="tab" aria-selected={accessRole === "profesional"} onClick={() => { setAccessRole("profesional"); setError(""); }} className={`rounded-full px-4 py-3 text-sm font-black transition-all sm:text-base ${accessRole === "profesional" ? "bg-[#98f21f] text-[#07182b] shadow-[0_6px_16px_rgba(142,229,0,0.18)]" : "text-[#657080] hover:text-[#07182b]"}`}>Profesional</button>
            <button type="button" role="tab" aria-selected={accessRole === "cliente"} onClick={() => { setAccessRole("cliente"); setError(""); }} className={`rounded-full px-4 py-3 text-sm font-black transition-all sm:text-base ${accessRole === "cliente" ? "bg-[#98f21f] text-[#07182b] shadow-[0_6px_16px_rgba(142,229,0,0.18)]" : "text-[#657080] hover:text-[#07182b]"}`}>Cliente</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-[#07182b]">Correo electrónico</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" required className="h-14 rounded-xl border-[#d9dde2] bg-white px-4 text-base shadow-none focus-visible:border-[#8ee500] focus-visible:ring-[#8ee500]/25" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bold text-[#07182b]">Contraseña</Label>
              <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required className="h-14 rounded-xl border-[#d9dde2] bg-white px-4 text-base shadow-none focus-visible:border-[#8ee500] focus-visible:ring-[#8ee500]/25" />
            </div>

            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

            <Button type="submit" disabled={loading} className="mt-2 h-14 w-full rounded-xl bg-[#98f21f] text-base font-black text-[#07182b] shadow-[0_10px_24px_rgba(142,229,0,0.18)] transition hover:bg-[#87df10] hover:shadow-[0_12px_28px_rgba(142,229,0,0.24)]">
              {loading ? "Comprobando acceso..." : `Entrar como ${accessRole === "cliente" ? "cliente" : "profesional"}  →`}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
