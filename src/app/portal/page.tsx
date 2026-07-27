import LogoutButton from "@/components/LogoutButton";

export default function PortalPage() {
  return (
    <main className="min-h-screen bg-[#f7f4ee] px-5 py-10 text-[#29312e]">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-col gap-5 rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold tracking-[0.22em] text-[#c9653b]">CHETESAÍ FITNESS+</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Portal del cliente</h1>
            <p className="mt-2 text-sm text-[#707872]">
              Tu espacio privado para consultar planes, progreso y próximas citas.
            </p>
          </div>
          <div className="w-full max-w-52 rounded-xl border border-[#e7dfd3] bg-white p-1 text-[#46624f] sm:w-52">
            <LogoutButton />
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          {[
            ["Mi entrenamiento", "Consulta tu planificación y próximas sesiones."],
            ["Mi nutrición", "Revisa tus pautas y el seguimiento nutricional."],
            ["Mi progreso", "Accede a tus mediciones y evolución."],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-3xl border border-[#e7dfd3] bg-[#fffdf9] p-6 shadow-sm"
            >
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-[#707872]">{description}</p>
              <p className="mt-6 text-xs font-bold tracking-[0.16em] text-[#46624f]">PRÓXIMAMENTE</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
