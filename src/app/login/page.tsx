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
    <main className="min-h-screen bg-[#f7f4ee] flex items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-8 shadow-xl shadow-black/5">
        <div className="mb-8 flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#46624f] text-lg font-black text-white ring-4 ring-[#dbe4d8]">C+</div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-[#1e2824]">Chetesaí Fitness+</p>
            <p className="mt-1 text-xs font-bold tracking-[0.22em] text-[#c9653b]">ACCESO SEGURO</p>
          </div>
        </div>

        <div className="mb-7">
          <h1 className="text-3xl font-bold tracking-tight text-[#29312e]">Iniciar sesión</h1>
          <p className="mt-2 text-sm leading-6 text-[#707872]">Accede al panel profesional o al portal de cliente según el rol asignado.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="correo@ejemplo.com" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" required />
          </div>

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <Button type="submit" disabled={loading} className="w-full bg-[#c9653b] hover:bg-[#b65331]">
            {loading ? "Comprobando acceso..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-7 text-center text-xs leading-5 text-[#707872]">El acceso y los permisos dependen del rol asignado a cada cuenta.</p>
      </section>
    </main>
  );
}
