export default function Loading() {
  return (
    <div role="status" className="flex min-h-[70dvh] flex-col items-center justify-center gap-6 bg-[#101713] px-6 text-[#D1D4D2]">
      <img src="/brand/logo-principal.svg" alt="Chetesaí Fitness+" width={240} height={165} />
      <p className="text-sm">Cargando tu espacio…</p>
    </div>
  );
}
