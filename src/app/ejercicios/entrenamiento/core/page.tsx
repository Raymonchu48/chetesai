import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import { ArrowRight, Dumbbell, Gauge, ShieldCheck, Target, TriangleAlert } from "lucide-react";

const zones = [
  { title: "Recto abdominal", text: "Participa en la flexión del tronco y en el control de la posición costillas-pelvis." },
  { title: "Oblicuos", text: "Gestionan rotación, anti-rotación y estabilidad lateral del tronco." },
  { title: "Transverso y estabilizadores profundos", text: "Contribuyen a la presión intraabdominal y al control lumbopélvico durante el movimiento." },
];

const patterns = ["Anti-extensión", "Anti-rotación", "Anti-flexión lateral", "Control lumbopélvico"];

export default function CorePage() {
  return (
    <AppSidebar>
      <main className="mx-auto max-w-7xl p-5 md:p-8">
        <section className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white shadow-xl">
          <div className="grid items-center gap-8 p-6 md:grid-cols-[1.05fr_.95fr] md:p-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-emerald-100">
                <Dumbbell className="h-3.5 w-3.5" /> Chetesaí Fitness+ · Core
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Core estable, fuerte y funcional</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                El core actúa como sistema de transferencia de fuerzas. Priorizar estabilidad, respiración y control lumbopélvico mejora la eficiencia técnica del resto del entrenamiento.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/ejercicios/entrenamiento?grupo=core" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02]">
                  Ver ejercicios <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/ejercicios" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                  Gestionar biblioteca
                </Link>
              </div>
            </div>

            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <svg viewBox="0 0 320 400" className="h-full w-full" role="img" aria-label="Mapa anatómico estilizado del core">
                <defs>
                  <linearGradient id="coreTorso" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" /><stop offset="100%" stopColor="#94a3b8" stopOpacity="0.72" /></linearGradient>
                  <linearGradient id="coreMuscle" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6ee7b7" /><stop offset="100%" stopColor="#10b981" /></linearGradient>
                </defs>
                <circle cx="160" cy="52" r="36" fill="url(#coreTorso)" />
                <path d="M111 96 C91 111 83 139 85 171 L94 308 C98 338 119 356 142 360 L178 360 C201 356 222 338 226 308 L235 171 C237 139 229 111 209 96 C192 87 178 83 160 83 C142 83 128 87 111 96Z" fill="url(#coreTorso)" />
                <rect x="132" y="136" width="56" height="150" rx="22" fill="url(#coreMuscle)" opacity="0.9" />
                <path d="M122 139 C105 158 105 247 124 286 C132 271 136 244 136 210 C136 175 132 152 122 139Z" fill="#34d399" opacity="0.6" />
                <path d="M198 139 C215 158 215 247 196 286 C188 271 184 244 184 210 C184 175 188 152 198 139Z" fill="#34d399" opacity="0.6" />
                {[165,195,225,255].map((y)=><line key={y} x1="132" x2="188" y1={y} y2={y} stroke="#064e3b" strokeWidth="3" opacity="0.45" />)}
                <line x1="160" x2="160" y1="136" y2="286" stroke="#064e3b" strokeWidth="3" opacity="0.45" />
              </svg>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-center text-xs font-semibold text-white/75 backdrop-blur">
                Recto abdominal · oblicuos · estabilizadores profundos
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-3">
          {zones.map((zone) => <article key={zone.title} className="rounded-3xl border bg-card p-6 shadow-sm"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Target className="h-5 w-5" /></div><h2 className="text-xl font-black">{zone.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{zone.text}</p></article>)}
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border bg-card p-6 md:p-7">
            <div className="mb-5 flex items-center gap-3"><Gauge className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">Patrones prioritarios</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{patterns.map((pattern, index) => <div key={pattern} className="rounded-2xl border bg-muted/30 p-4"><span className="text-xs font-black text-primary">0{index + 1}</span><p className="mt-1 font-bold">{pattern}</p></div>)}</div>
          </div>
          <div className="rounded-3xl border bg-card p-6 md:p-7">
            <div className="mb-5 flex items-center gap-3"><TriangleAlert className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">Puntos de control</h2></div>
            <p className="text-sm leading-7 text-muted-foreground">Evitar hiperextensión lumbar, compensaciones cervicales y bloqueo respiratorio. Coordinar respiración, control costillas-pelvis y progresión de palancas antes de añadir carga.</p>
            <div className="mt-5 flex items-center gap-2 rounded-2xl border bg-muted/30 p-4 text-sm text-muted-foreground"><ShieldCheck className="h-5 w-5 text-primary" /> La calidad del control precede a la intensidad.</div>
            <Link href="/ejercicios/entrenamiento?grupo=core" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary">Abrir biblioteca de core <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
    </AppSidebar>
  );
}
