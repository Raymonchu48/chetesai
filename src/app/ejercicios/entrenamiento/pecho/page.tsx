import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import { ArrowRight, Dumbbell, Gauge, Target, TriangleAlert } from "lucide-react";

const zones = [
  { title: "Pectoral mayor · porción clavicular", text: "Participa especialmente en flexión y aducción horizontal del hombro; cobra protagonismo en presses inclinados y variantes con trayectoria ascendente." },
  { title: "Pectoral mayor · porción esternal", text: "Principal motor en presses horizontales, flexiones y movimientos de aducción horizontal con control escapular." },
  { title: "Pectoral menor y estabilizadores", text: "Colaboran en el control de la cintura escapular. Su función exige equilibrio entre movilidad, estabilidad y técnica respiratoria." },
];

const patterns = ["Press horizontal", "Press inclinado", "Flexiones", "Aperturas y aducción horizontal"];

export default function PechoPage() {
  return (
    <AppSidebar>
      <main className="mx-auto max-w-7xl p-5 md:p-8">
        <section className="overflow-hidden rounded-[2rem] border bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white shadow-xl">
          <div className="grid items-center gap-8 p-6 md:grid-cols-[1.05fr_.95fr] md:p-10">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[.18em] text-emerald-100">
                <Dumbbell className="h-3.5 w-3.5" /> Chetesaí Fitness+ · Pecho
              </div>
              <h1 className="text-4xl font-black tracking-tight md:text-6xl">Pecho fuerte con técnica, control y amplitud</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                Bloque visual dedicado al pectoral: anatomía funcional, patrones de empuje, selección de ángulos y control escapular para progresar sin sacrificar técnica.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/ejercicios/entrenamiento?grupo=pecho" className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.02]">
                  Ver ejercicios <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/ejercicios" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/15">
                  Gestionar biblioteca
                </Link>
              </div>
            </div>

            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur">
              <svg viewBox="0 0 320 400" className="h-full w-full" role="img" aria-label="Mapa anatómico estilizado del pecho">
                <defs>
                  <linearGradient id="torsoChest" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#f8fafc" stopOpacity="0.95" /><stop offset="100%" stopColor="#94a3b8" stopOpacity="0.72" /></linearGradient>
                  <linearGradient id="chest" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6ee7b7" /><stop offset="100%" stopColor="#10b981" /></linearGradient>
                </defs>
                <circle cx="160" cy="56" r="38" fill="url(#torsoChest)" />
                <path d="M111 98 C84 108 69 127 65 157 L76 302 C80 329 102 350 128 357 L192 357 C218 350 240 329 244 302 L255 157 C251 127 236 108 209 98 C194 92 180 88 160 88 C140 88 126 92 111 98Z" fill="url(#torsoChest)" />
                <path d="M101 120 C119 103 138 99 158 102 L158 173 C138 177 117 174 98 161 C92 145 93 132 101 120Z" fill="url(#chest)" />
                <path d="M219 120 C201 103 182 99 162 102 L162 173 C182 177 203 174 222 161 C228 145 227 132 219 120Z" fill="url(#chest)" />
                <path d="M108 111 C125 99 142 96 158 99 L158 121 C140 122 124 126 109 134 C104 125 104 118 108 111Z" fill="#34d399" opacity="0.72" />
                <path d="M212 111 C195 99 178 96 162 99 L162 121 C180 122 196 126 211 134 C216 125 216 118 212 111Z" fill="#34d399" opacity="0.72" />
                <path d="M118 178 C131 185 145 189 158 189 L158 214 C141 213 126 208 113 200Z" fill="#22c55e" opacity="0.28" />
                <path d="M202 178 C189 185 175 189 162 189 L162 214 C179 213 194 208 207 200Z" fill="#22c55e" opacity="0.28" />
              </svg>
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-center text-xs font-semibold text-white/75 backdrop-blur">
                Pectoral mayor · porción clavicular · porción esternal
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
            <p className="text-sm leading-7 text-muted-foreground">Mantener escápulas estables sin forzar retracción excesiva, evitar rebotes en el punto de máxima elongación y ajustar el rango a la movilidad del hombro. En presses, la trayectoria debe ser controlada, con muñeca neutra y codos orientados según la variante.</p>
            <Link href="/ejercicios/entrenamiento?grupo=pecho" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-primary">Abrir biblioteca de pecho <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
    </AppSidebar>
  );
}
