import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import { ArrowRight, Dumbbell, ShieldCheck, Target, TrendingUp } from "lucide-react";

const zones = [
  { title: "Dorsal ancho", text: "Anchura de espalda, tracciones verticales y control escapular." },
  { title: "Trapecio y romboides", text: "Retracción escapular, estabilidad y trabajo de la zona media-alta." },
  { title: "Erectores espinales", text: "Control lumbopélvico, bisagra de cadera y estabilidad del tronco." },
];

const patterns = ["Dominadas y jalones", "Remos horizontales", "Pullover y extensión de hombro", "Bisagras y estabilidad lumbar"];

export default function EspaldaPage() {
  return (
    <AppSidebar>
      <main className="mx-auto max-w-7xl p-5 md:p-8">
        <section className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white shadow-xl">
          <div className="grid items-center gap-8 p-6 md:grid-cols-[1.05fr_.95fr] md:p-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-emerald-100">
                <Dumbbell className="h-3.5 w-3.5" /> Chetesaí Fitness+ · Espalda
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Espalda fuerte, estable y funcional</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                Vista visual del grupo muscular para seleccionar patrones de tracción, mejorar la técnica y acceder directamente a la biblioteca de ejercicios de espalda.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/ejercicios/entrenamiento?grupo=espalda" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02]">
                  Ver ejercicios <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/ejercicios" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                  Gestionar biblioteca
                </Link>
              </div>
            </div>

            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <svg viewBox="0 0 320 400" className="h-full w-full" role="img" aria-label="Mapa anatómico estilizado de la espalda">
                <defs>
                  <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.72" />
                  </linearGradient>
                  <linearGradient id="muscle" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6ee7b7" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <circle cx="160" cy="55" r="38" fill="url(#body)" />
                <path d="M113 93 C88 111 80 153 88 188 L103 271 C108 303 121 333 139 364 L181 364 C199 333 212 303 217 271 L232 188 C240 153 232 111 207 93 C194 84 181 79 160 79 C139 79 126 84 113 93Z" fill="url(#body)" />
                <path d="M112 114 C95 143 98 195 111 232 C124 220 136 205 143 184 L146 116 C134 113 123 112 112 114Z" fill="url(#muscle)" opacity="0.95" />
                <path d="M208 114 C225 143 222 195 209 232 C196 220 184 205 177 184 L174 116 C186 113 197 112 208 114Z" fill="url(#muscle)" opacity="0.95" />
                <path d="M143 101 L160 88 L177 101 L185 148 L160 162 L135 148Z" fill="#34d399" opacity="0.9" />
                <path d="M132 152 C145 164 175 164 188 152 L184 190 C174 201 146 201 136 190Z" fill="#22c55e" opacity="0.8" />
                <path d="M144 205 C151 215 169 215 176 205 L181 295 C174 315 146 315 139 295Z" fill="#16a34a" opacity="0.72" />
                <line x1="160" y1="92" x2="160" y2="325" stroke="#052e16" strokeOpacity="0.45" strokeWidth="3" strokeDasharray="5 6" />
              </svg>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-center text-xs font-semibold text-white/75 backdrop-blur">
                Dorsal · trapecio · romboides · erectores espinales
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-3">
          {zones.map((zone) => (
            <article key={zone.title} className="rounded-3xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Target className="h-5 w-5" /></div>
              <h2 className="text-xl font-black">{zone.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{zone.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border bg-card p-6 md:p-7">
            <div className="mb-5 flex items-center gap-3"><TrendingUp className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">Patrones prioritarios</h2></div>
            <div className="grid gap-3 sm:grid-cols-2">{patterns.map((pattern, index) => <div key={pattern} className="rounded-2xl border bg-muted/30 p-4"><span className="text-xs font-black text-primary">0{index + 1}</span><p className="mt-1 font-bold">{pattern}</p></div>)}</div>
          </div>
          <div className="rounded-3xl border bg-card p-6 md:p-7">
            <div className="mb-5 flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-primary" /><h2 className="text-2xl font-black">Criterios técnicos</h2></div>
            <p className="text-sm leading-7 text-muted-foreground">Priorizar posición neutra de columna, control escapular, amplitud de movimiento útil y progresión de carga sin sacrificar la técnica. La biblioteca visual permite revisar errores y regresiones antes de prescribir cada ejercicio.</p>
            <Link href="/ejercicios/entrenamiento?grupo=espalda" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary">Abrir biblioteca de espalda <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
    </AppSidebar>
  );
}
