import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import { ArrowRight, Dumbbell, Gauge, Target, TriangleAlert } from "lucide-react";

const zones = [
  { title: "Deltoides anterior", text: "Participa en flexión de hombro y patrones de empuje por encima de la cabeza." },
  { title: "Deltoides lateral", text: "Principal responsable de la abducción y del desarrollo visual de la anchura del hombro." },
  { title: "Deltoides posterior", text: "Clave en extensión horizontal, estabilidad escapular y equilibrio del complejo del hombro." },
];

const patterns = ["Press vertical", "Elevaciones laterales", "Pájaros / reverse fly", "Rotación externa y control escapular"];

export default function HombrosPage() {
  return (
    <AppSidebar>
      <main className="mx-auto max-w-7xl p-5 md:p-8">
        <section className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white shadow-xl">
          <div className="grid items-center gap-8 p-6 md:grid-cols-[1.05fr_.95fr] md:p-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-emerald-100">
                <Dumbbell className="h-3.5 w-3.5" /> Chetesaí Fitness+ · Hombros
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Hombros fuertes, móviles y equilibrados</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                Siguiente bloque visual de Chetesaí Fitness+: deltoides, control escapular, patrones de empuje y trabajo preventivo del complejo del hombro.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/ejercicios/entrenamiento?grupo=hombros" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02]">
                  Ver ejercicios <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/ejercicios" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                  Gestionar biblioteca
                </Link>
              </div>
            </div>

            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <svg viewBox="0 0 320 400" className="h-full w-full" role="img" aria-label="Mapa anatómico estilizado de hombros">
                <defs>
                  <linearGradient id="torso" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" /><stop offset="100%" stopColor="#94a3b8" stopOpacity="0.72" /></linearGradient>
                  <linearGradient id="deltoid" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6ee7b7" /><stop offset="100%" stopColor="#10b981" /></linearGradient>
                </defs>
                <circle cx="160" cy="56" r="38" fill="url(#torso)" />
                <path d="M111 98 C83 108 67 129 63 160 L74 302 C78 329 101 351 128 357 L192 357 C219 351 242 329 246 302 L257 160 C253 129 237 108 209 98 C194 92 180 88 160 88 C140 88 126 92 111 98Z" fill="url(#torso)" />
                <path d="M110 101 C84 109 67 127 63 151 C67 172 82 184 102 186 C112 160 119 128 110 101Z" fill="url(#deltoid)" />
                <path d="M210 101 C236 109 253 127 257 151 C253 172 238 184 218 186 C208 160 201 128 210 101Z" fill="url(#deltoid)" />
                <path d="M118 106 C128 98 143 94 160 94 C177 94 192 98 202 106 C194 119 181 127 160 127 C139 127 126 119 118 106Z" fill="#34d399" opacity="0.55" />
                <circle cx="98" cy="143" r="31" fill="#22c55e" opacity="0.35" />
                <circle cx="222" cy="143" r="31" fill="#22c55e" opacity="0.35" />
              </svg>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-center text-xs font-semibold text-white/75 backdrop-blur">
                Deltoides anterior · lateral · posterior
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
            <p className="text-sm leading-7 text-muted-foreground">Evitar compensaciones cervicales, controlar la rotación escapular y ajustar la amplitud a la movilidad individual. En ejercicios por encima de la cabeza, priorizar trayectoria estable, carga progresiva y ausencia de dolor.</p>
            <Link href="/ejercicios/entrenamiento?grupo=hombros" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary">Abrir biblioteca de hombros <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
    </AppSidebar>
  );
}
