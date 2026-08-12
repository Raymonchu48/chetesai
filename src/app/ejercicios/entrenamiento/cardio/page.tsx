import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import { Activity, ArrowRight, Gauge, HeartPulse, TimerReset, TriangleAlert } from "lucide-react";

const zones = [
  { title: "Base aeróbica", text: "Trabajo continuo de intensidad baja o moderada para mejorar eficiencia cardiovascular, tolerancia al esfuerzo y recuperación." },
  { title: "Umbral", text: "Bloques sostenidos cercanos al umbral funcional para desarrollar capacidad de mantener esfuerzos exigentes durante más tiempo." },
  { title: "Alta intensidad", text: "Intervalos breves o medios de alta demanda para estimular VO₂, potencia cardiovascular y tolerancia al lactato." },
];

const patterns = ["Cardio continuo", "Intervalos HIIT", "Circuitos metabólicos", "Trabajo por tiempo / distancia"];

export default function CardioPage() {
  return (
    <AppSidebar>
      <main className="mx-auto max-w-7xl p-5 md:p-8">
        <section className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white shadow-xl">
          <div className="grid items-center gap-8 p-6 md:grid-cols-[1.05fr_.95fr] md:p-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-emerald-100">
                <HeartPulse className="h-3.5 w-3.5" /> Chetesaí Fitness+ · Cardio
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Cardio con propósito, intensidad y control</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                Bloque cardiovascular de Chetesaí Fitness+: resistencia aeróbica, umbral, intervalos de alta intensidad y control de la carga mediante tiempo, ritmo y percepción del esfuerzo.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/ejercicios/entrenamiento?grupo=cardio" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02]">
                  Ver ejercicios <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/ejercicios" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                  Gestionar biblioteca
                </Link>
              </div>
            </div>

            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <svg viewBox="0 0 320 400" className="h-full w-full" role="img" aria-label="Visualización estilizada del sistema cardiovascular">
                <defs>
                  <linearGradient id="pulse" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#6ee7b7" /><stop offset="100%" stopColor="#10b981" /></linearGradient>
                </defs>
                <circle cx="160" cy="200" r="112" fill="#ffffff" opacity="0.05" />
                <circle cx="160" cy="200" r="78" fill="#10b981" opacity="0.10" />
                <path d="M58 214 H112 L132 168 L160 250 L185 194 L201 214 H262" fill="none" stroke="url(#pulse)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M160 132 C137 102 88 115 88 163 C88 217 160 264 160 264 C160 264 232 217 232 163 C232 115 183 102 160 132Z" fill="#34d399" opacity="0.18" />
                <circle cx="160" cy="200" r="146" fill="none" stroke="#34d399" strokeOpacity="0.22" strokeWidth="2" strokeDasharray="8 10" />
              </svg>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-center text-xs font-semibold text-white/75 backdrop-blur">
                Aeróbico · Umbral · Alta intensidad
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-3">
          {zones.map((zone) => <article key={zone.title} className="rounded-3xl border bg-card p-6 shadow-sm"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Activity className="h-5 w-5" /></div><h2 className="text-xl font-black">{zone.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{zone.text}</p></article>)}
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border bg-card p-6 md:p-7">
            <div className="mb-5 flex items-center gap-3"><Gauge className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">Patrones prioritarios</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{patterns.map((pattern, index) => <div key={pattern} className="rounded-2xl border bg-muted/30 p-4"><span className="text-xs font-black text-primary">0{index + 1}</span><p className="mt-1 font-bold">{pattern}</p></div>)}</div>
          </div>
          <div className="rounded-3xl border bg-card p-6 md:p-7">
            <div className="mb-5 flex items-center gap-3"><TriangleAlert className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">Puntos de control</h2></div>
            <p className="text-sm leading-7 text-muted-foreground">Ajustar intensidad al nivel individual, progresar volumen antes de elevar agresivamente la intensidad y vigilar técnica cuando aparece fatiga. Utilizar tiempo, distancia, ritmo, frecuencia cardiaca o RPE como referencias de carga.</p>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-muted/30 p-4 text-sm text-muted-foreground"><TimerReset className="h-4 w-4 text-primary" /> Alterna trabajo y recuperación según el objetivo de la sesión.</div>
            <Link href="/ejercicios/entrenamiento?grupo=cardio" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary">Abrir biblioteca de cardio <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
    </AppSidebar>
  );
}
