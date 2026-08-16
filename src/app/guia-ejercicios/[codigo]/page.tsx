import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Dumbbell,
  Gauge,
  Lightbulb,
  Repeat2,
  ShieldCheck,
  Target,
  Wind,
} from "lucide-react";
import ProfessionalExerciseVisual from "@/components/exercises/ProfessionalExerciseVisual";
import {
  exercisePath,
  getPublicExercise,
  labelFor,
  PUBLIC_SITE_URL,
} from "@/lib/public-exercises";

type PageProps = { params: Promise<{ codigo: string }> };

function absoluteUrl(path: string) {
  return `${PUBLIC_SITE_URL}${path}`;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { codigo } = await params;
  const exercise = await getPublicExercise(codigo);
  if (!exercise) return { title: "Ejercicio no encontrado | Chetesaí Fitness+" };

  const title = `${exercise.nombre}: técnica y consejos | Chetesaí Fitness+`;
  const description =
    exercise.descripcion ||
    `Aprende la técnica de ${exercise.nombre}, sus errores frecuentes y las claves para ejecutarlo con control.`;
  const canonical = absoluteUrl(exercisePath(exercise.codigo_interno));
  const image = absoluteUrl(`/api/pinterest/${exercise.codigo_interno.toLowerCase()}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      locale: "es_ES",
      url: canonical,
      siteName: "Chetesaí Fitness+",
      title,
      description,
      images: [{ url: image, width: 1000, height: 1500, alt: `Guía visual de ${exercise.nombre}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function PublicExerciseGuidePage({ params }: PageProps) {
  const { codigo } = await params;
  const exercise = await getPublicExercise(codigo);
  if (!exercise) notFound();

  const canonical = absoluteUrl(exercisePath(exercise.codigo_interno));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ExerciseAction",
    name: exercise.nombre,
    description: exercise.descripcion,
    exerciseType: labelFor(exercise.categoria),
    target: labelFor(exercise.grupo_muscular),
    url: canonical,
    image: absoluteUrl(`/api/pinterest/${exercise.codigo_interno.toLowerCase()}`),
  };

  return (
    <main className="min-h-screen bg-[#f5f1e9] text-[#202724]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="border-b border-white/10 bg-[#15201b] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#8cdb78] font-black text-[#15201b]">C+</span>
            <span><strong className="block leading-tight">Chetesaí Fitness+</strong><small className="text-white/55">Biblioteca visual</small></span>
          </Link>
          <Link href="/#contacto" className="hidden items-center gap-2 rounded-xl bg-[#2f9e24] px-5 py-3 text-sm font-black transition hover:bg-[#27891e] sm:inline-flex">
            Entrena conmigo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="border-b border-[#dcd5c9] bg-[#fffdf9]">
        <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#46624f] hover:underline">
            <ArrowLeft className="h-4 w-4" /> Volver a Chetesaí Fitness+
          </Link>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <section className="overflow-hidden rounded-[34px] border border-[#ded8cd] bg-[#fffdf9] shadow-[0_24px_70px_rgba(37,45,40,0.10)]">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[430px] bg-white p-4 md:min-h-[560px] md:p-8">
              <ProfessionalExerciseVisual
                code={exercise.codigo_interno}
                name={exercise.nombre}
                group={exercise.grupo_muscular}
                material={exercise.material}
              />
            </div>
            <div className="bg-[#18211d] p-7 text-white md:p-10 lg:p-12">
              <div className="flex flex-wrap gap-2 text-[11px] font-black uppercase tracking-[0.14em]">
                <span className="rounded-full bg-[#8cdb78] px-3 py-1.5 text-[#18211d]">{exercise.codigo_interno}</span>
                <span className="rounded-full border border-white/20 px-3 py-1.5 text-white/75">{labelFor(exercise.grupo_muscular)}</span>
              </div>
              <p className="mt-9 text-xs font-black uppercase tracking-[0.22em] text-[#8cdb78]">Guía de ejecución</p>
              <h1 className="mt-3 text-4xl font-black leading-[1.02] tracking-tight md:text-6xl">{exercise.nombre}</h1>
              {exercise.nombre_alternativo ? <p className="mt-3 text-sm font-semibold text-[#d8c7a5]">También conocido como {exercise.nombre_alternativo}</p> : null}
              <p className="mt-6 text-base leading-8 text-white/70">
                {exercise.descripcion || "Guía técnica para ejecutar el movimiento de forma controlada, progresiva y adaptada a tu nivel."}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <Metric icon={Target} label="Grupo principal" value={labelFor(exercise.grupo_muscular)} />
                <Metric icon={Gauge} label="Nivel" value={labelFor(exercise.dificultad)} />
                <Metric icon={Dumbbell} label="Material" value={exercise.material || "Sin material"} />
                <Metric icon={Repeat2} label="Categoría" value={labelFor(exercise.categoria)} />
              </div>
            </div>
          </div>
        </section>

        <div className="mt-7 grid gap-7 xl:grid-cols-[1fr_360px]">
          <div className="space-y-7">
            <GuideSection
              icon={BookOpenCheck}
              eyebrow="Técnica"
              title="Cómo realizar el ejercicio"
              content={exercise.pasos_ejecucion || exercise.tecnica || "Mantén una postura estable y ejecuta cada repetición con un rango de movimiento que puedas controlar."}
              tone="green"
            />

            <div className="grid gap-7 md:grid-cols-2">
              <GuideSection
                icon={AlertTriangle}
                eyebrow="A evitar"
                title="Errores frecuentes"
                content={exercise.errores_frecuentes || "Evita perder la alineación, acelerar la fase de retorno o usar una carga que comprometa la técnica."}
                tone="coral"
              />
              <GuideSection
                icon={Lightbulb}
                eyebrow="Consejo profesional"
                title="Claves para hacerlo mejor"
                content={exercise.consejos || "Prioriza el control, una respiración estable y una progresión de carga coherente con tu nivel."}
                tone="sand"
              />
            </div>

            {exercise.respiracion ? (
              <GuideSection icon={Wind} eyebrow="Respiración" title="Coordina el esfuerzo" content={exercise.respiracion} tone="blue" />
            ) : null}
          </div>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[28px] border border-[#d8e4da] bg-[#eaf4eb] p-6">
              <BadgeCheck className="h-8 w-8 text-[#2f6d3b]" />
              <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-[#2f6d3b]">Ficha técnica</p>
              <div className="mt-5 space-y-3 text-sm">
                <Fact label="Músculo secundario" value={exercise.grupo_secundario || "—"} />
                <Fact label="Movimiento" value={exercise.tipo_movimiento || "—"} />
                <Fact label="Plano" value={exercise.plano_movimiento || "—"} />
                <Fact label="Articulación" value={exercise.articulacion_principal || "—"} />
                <Fact label="Lateralidad" value={exercise.lateralidad || "—"} />
              </div>
            </section>

            {(exercise.variante_facil || exercise.regresion || exercise.variante_avanzada || exercise.progresion) ? (
              <section className="rounded-[28px] border border-[#ded8cd] bg-[#fffdf9] p-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#c9653b]">Adaptaciones</p>
                <div className="mt-4 space-y-4 text-sm leading-6 text-[#606963]">
                  {(exercise.variante_facil || exercise.regresion) ? <p><strong className="block text-[#202724]">Más accesible</strong>{exercise.variante_facil || exercise.regresion}</p> : null}
                  {(exercise.variante_avanzada || exercise.progresion) ? <p><strong className="block text-[#202724]">Más exigente</strong>{exercise.variante_avanzada || exercise.progresion}</p> : null}
                </div>
              </section>
            ) : null}

            <section className="rounded-[28px] bg-[#18211d] p-6 text-white">
              <ShieldCheck className="h-8 w-8 text-[#8cdb78]" />
              <h2 className="mt-5 text-xl font-black">Entrena con un plan adaptado a ti</h2>
              <p className="mt-3 text-sm leading-6 text-white/65">La técnica, la carga y el volumen deben ajustarse a tu condición física y a tus objetivos.</p>
              <Link href="/#contacto" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2f9e24] px-5 py-3.5 text-sm font-black transition hover:bg-[#27891e]">
                Solicitar valoración <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          </aside>
        </div>

        <p className="mt-8 text-center text-xs leading-5 text-[#747c77]">
          Contenido educativo. Si tienes dolor, una lesión o una condición médica, consulta con un profesional sanitario antes de entrenar.
        </p>
      </div>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Target; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <Icon className="h-5 w-5 text-[#8cdb78]" />
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
    </div>
  );
}

function GuideSection({
  icon: Icon,
  eyebrow,
  title,
  content,
  tone,
}: {
  icon: typeof Target;
  eyebrow: string;
  title: string;
  content: string;
  tone: "green" | "coral" | "sand" | "blue";
}) {
  const tones = {
    green: "border-[#d8e4da] bg-[#f8fcf8] text-[#2f6d3b]",
    coral: "border-[#efd6ca] bg-[#fff9f5] text-[#c9653b]",
    sand: "border-[#e8dfcf] bg-[#fffdf9] text-[#8c6a32]",
    blue: "border-[#d6e3e8] bg-[#f6fbfc] text-[#397084]",
  };

  return (
    <section className={`rounded-[30px] border p-7 shadow-sm md:p-9 ${tones[tone]}`}>
      <Icon className="h-8 w-8" />
      <p className="mt-5 text-xs font-black uppercase tracking-[0.17em]">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black text-[#202724] md:text-3xl">{title}</h2>
      <TextContent content={content} />
    </section>
  );
}

function TextContent({ content }: { content: string }) {
  const parts = content.split(/\n|;/).map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) return <p className="mt-5 whitespace-pre-line leading-8 text-[#606963]">{content}</p>;
  return <ul className="mt-5 space-y-3 text-[#606963]">{parts.map((part) => <li key={part} className="flex gap-3 leading-7"><span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-current opacity-60" />{part}</li>)}</ul>;
}

function Fact({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-[#2f6d3b]/10 pb-3 last:border-0 last:pb-0"><span className="text-[#617067]">{label}</span><strong className="text-right text-[#203329]">{labelFor(value)}</strong></div>;
}
