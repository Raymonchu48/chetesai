import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import { ArrowRight, Dumbbell, Gauge, Target, TriangleAlert } from "lucide-react";

const zones = [
  { title: "Glúteo mayor", text: "Principal extensor de cadera. Clave en hip thrust, peso muerto, sentadilla y aceleración." },
  { title: "Glúteo medio", text: "Estabiliza la pelvis y participa en la abducción de cadera, especialmente en apoyo unilateral." },
  { title: "Glúteo menor", text: "Contribuye al control frontal de la cadera y a la estabilidad durante la marcha y los cambios de apoyo." },
];

const patterns = ["Extensión de cadera", "Abducción de cadera", "Bisagra", "Trabajo unilateral"];

export default function GluteosPage() {
  return (
    <AppSidebar>
      <main className="mx-auto max-w-7xl p-5 md:p-8">
        <section className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white shadow-xl">
          <div className="grid items-center gap-8 p-6 md:grid-cols-[1.05fr_.95fr] md:p-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-emerald-100">
                <Dumbbell className="h-3.5 w-3.5" /> Chetesaí Fitness+ · Glúteos
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Glúteos fuertes, estables y funcionales</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                Fuerza de extensión, control pélvico y estabilidad unilateral. El bloque visual de glúteos conecta rendimiento, técnica y prevención de compensaciones.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/ejercicios/entrenamiento?grupo=gluteos" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02]">
                  Ver ejercicios <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/ejercicios" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                  Gestionar biblioteca
                </Link>
              </div>
            </div>
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <svg viewBox="0 0 320 400" className="h-full w-full" role="img" aria-label="Mapa anatómico estilizado de glúteos">
                <defs>
                  <linearGradient id="body" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f8fafc" stopOpacity="0.96"/><stop offset="100%" stopColor="#94a3b8" stopOpacity="0.7"/></linearGradient>
                  <linearGradient id="glute" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6ee7b7"/><stop offset="100%" stopColor="#10b981"/></linearGradient>
                </defs>
                <circle cx="160" cy="49" r="34" fill="url(#body)"/>
                <path d="M116 91 C93 104 82 125 83 151 L94 250 C98 277 113 302 130 319 L190 319 C207 302 222 277 226 250 L237 151 C238 125 227 104 204 91 C189 83 176 79 160 79 C144 79 131 83 116 91Z" fill="url(#body)"/>
                <path d="M112 210 C120 182 137 167 158 168 L158 263 C135 267 116 250 112 210Z" fill="url(#glute)"/>
                <path d="M208 210 C200 182 183 167 162 168 L162 263 C185 267 204 250 208 210Z" fill="url(#glute)"/>
                <ellipse cx="126" cy="184" rx="23" ry="18" fill="#34d399" opacity="0.48"/>
                <ellipse cx="194" cy="184" rx="23" ry="18" fill="#34d399" opacity="0.48"/>
                <path d="M118 256 C123 293 133 331 139 374" stroke="#cbd5e1" strokeWidth="28" strokeLinecap="round"/>
                <path d="M202 256 C197 293 187 331 181 374" stroke="#cbd5e1" strokeWidth="28" strokeLinecap="round"/>
              </svg>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-center text-xs font-semibold text-white/75 backdrop-blur">Glúteo mayor · medio · menor</div>
            </div>
          </div>
        </section>
        <section className="mt-7 grid gap-5 lg:grid-cols-3">
          {zones.map((zone) => <article key={zone.title} className="rounded-3xl border bg-card p-6 shadow-sm"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Target className="h-5 w-5"/></div><h2 className="text-xl font-black">{zone.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{zone.text}</p></article>)}
        </section>
        <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border bg-card p-6 md:p-7"><div className="mb-5 flex items-center gap-3"><Gauge className="h-5 w-5 text-primary"/><h2 className="text-2xl font-black">Patrones prioritarios</h2></div><div className="grid gap-3 sm:grid-cols-2">{patterns.map((pattern,index)=><div key={pattern} className="rounded-2xl border bg-muted/30 p-4"><span className="text-xs font-black text-primary">0{index+1}</span><p className="mt-1 font-bold">{pattern}</p></div>)}</div></div>
          <div className="rounded-3xl border bg-card p-6 md:p-7"><div className="mb-5 flex items-center gap-3"><TriangleAlert className="h-5 w-5 text-primary"/><h2 className="text-2xl font-black">Puntos de control</h2></div><p className="text-sm leading-7 text-muted-foreground">Evitar hiperextender la zona lumbar al finalizar la extensión de cadera, mantener rodilla y pie alineados en apoyos unilaterales y priorizar control pélvico antes de aumentar la carga.</p><Link href="/ejercicios/entrenamiento?grupo=gluteos" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary">Abrir biblioteca de glúteos <ArrowRight className="h-4 w-4"/></Link></div>
        </section>
      </main>
    </AppSidebar>
  );
}
