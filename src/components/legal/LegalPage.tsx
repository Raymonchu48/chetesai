import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const LEGAL_UPDATED_AT = "28 de agosto de 2026";
export const LEGAL_EMAIL = "chetesaifitness@gmail.com";
export const LEGAL_NIF = "42411339Y";
export const LEGAL_FISCAL_ADDRESS = "Porto Cristo, Manacor, 07680, Illes Balears, España";

const legalLinks = [
  { href: "/privacy-policy", label: "Política de privacidad" },
  { href: "/terms-of-service", label: "Términos y condiciones" },
  { href: "/politica-cookies", label: "Política de cookies" },
  { href: "/aviso-legal", label: "Aviso legal" },
];

type LegalPageProps = {
  title: string;
  summary: string;
  children: ReactNode;
};

export function LegalPage({ title, summary, children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[#f7f4ee] text-[#202724]">
      <header className="border-b border-white/10 bg-[#111612] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Volver a Chetesaí Fitness+">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#2f9e24] text-lg font-black">C+</span>
            <span>
              <span className="block font-black">Chetesaí Fitness+</span>
              <span className="block text-xs text-white/55">Información legal</span>
            </span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-[#8cdb78]/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-5 py-12 lg:px-8 lg:py-16">
        <div className="mb-9 max-w-3xl">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#2f9e24]"><ShieldCheck className="h-4 w-4" /> Transparencia y confianza</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-8 text-[#67706b]">{summary}</p>
          <p className="mt-4 text-sm font-semibold text-[#67706b]">Última actualización: {LEGAL_UPDATED_AT}</p>
        </div>

        <article className="space-y-10 rounded-[30px] border border-[#ded8cd] bg-[#fffdf9] p-6 shadow-sm sm:p-9 lg:p-12">
          {children}
        </article>

        <nav aria-label="Documentos legales" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-2xl border border-[#ded8cd] bg-white px-4 py-3 text-center text-sm font-bold transition hover:border-[#2f9e24] hover:text-[#2f9e24]">
              {link.label}
            </Link>
          ))}
        </nav>
      </section>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-black text-[#18211d] sm:text-2xl">{title}</h2>
      <div className="mt-4 space-y-4 leading-7 text-[#59635e] [&_a]:font-semibold [&_a]:text-[#268b1e] [&_a]:underline-offset-4 hover:[&_a]:underline [&_li]:pl-1 [&_strong]:text-[#202724]">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="ml-5 list-disc space-y-2">{children}</ul>;
}

export function LegalNotice({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-[#d7b86b]/55 bg-[#d7b86b]/10 p-5 text-sm leading-6 text-[#4f4530]">{children}</div>;
}
