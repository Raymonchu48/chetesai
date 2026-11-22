import Link from "next/link";
import { ShieldCheck, UserRound, ArrowRight, Globe2 } from "lucide-react";

export const metadata = { title: "Acceder a Chetesaí Fitness+" };

export default function AccessSelector() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#101713] px-4 py-10 text-[#f2f5ec]">
      <section className="w-full max-w-xl rounded-3xl border border-[#425448] bg-[#18251c] p-6 shadow-2xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-[#b7d777]">Chetesaí Fitness+</p>
        <h1 className="mt-3 font-brand text-3xl font-bold !text-[#f2f5ec]">Elige tu acceso</h1>
        <p className="mt-3 text-sm leading-6 text-[#c5d1c4]">
          Para proteger tus datos, el portal de clientes y el panel profesional tienen sesiones independientes.
          Selecciona tu área antes de introducir tu contraseña.
        </p>
        <div className="mt-8 grid gap-4">
          <a href="https://app.chetesaifitness.com/login" className="flex min-h-20 items-center gap-4 rounded-2xl border border-[#688459] bg-[#e4f2d9] p-4 text-[#15301b] transition hover:bg-[#cce8b6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a4d27c]">
            <UserRound className="h-7 w-7 shrink-0" />
            <span className="flex-1"><strong className="block text-base">Soy cliente</strong><span className="text-xs">Entrenamientos, nutrición y Coach IA</span></span>
            <ArrowRight className="h-5 w-5" />
          </a>
          <a href="https://pro.chetesaifitness.com/login" className="flex min-h-20 items-center gap-4 rounded-2xl border border-[#77956f] bg-[#273e2d] p-4 text-[#f2f5ec] transition hover:bg-[#345239] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a4d27c]">
            <ShieldCheck className="h-7 w-7 shrink-0" />
            <span className="flex-1"><strong className="block text-base">Soy profesional</strong><span className="text-xs">Gestión de clientes y seguimiento profesional</span></span>
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>
        <div className="mt-6 border-t border-[#4a624d] pt-5">
          <p className="mb-3 text-sm font-semibold text-[#dcebd8]">¿Quieres visitar nuestra web sin iniciar sesión?</p>
          <a href="https://www.chetesaifitness.com/" className="flex min-h-16 items-center gap-4 rounded-2xl border-2 border-[#b7d777] bg-[#334a32] p-4 text-[#f6ffe9] transition hover:bg-[#435f3e] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c6ef91]">
            <Globe2 className="h-6 w-6 shrink-0" />
            <span className="flex-1"><strong className="block text-base">Ir a la web de Chetesaí</strong><span className="text-xs text-[#e0eeda]">Servicios, información y contacto · Acceso público</span></span>
            <ArrowRight className="h-5 w-5 shrink-0" />
          </a>
        </div>
        <p className="mt-5 text-xs text-[#b6c8b7]">Cada cuenta conserva sus permisos. No se transfieren contraseñas entre portales.</p>
      </section>
    </main>
  );
}
