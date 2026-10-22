"use client";

import { useEffect, useState } from "react";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstall() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);
  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;
    setIos(/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
    const ready = (event: Event) => { event.preventDefault(); setPrompt(event as InstallEvent); };
    const installed = () => { setPrompt(null); setIos(false); setHelp(false); };
    window.addEventListener("beforeinstallprompt", ready);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", ready);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function install() {
    if (!prompt) { setHelp(value => !value); return; }
    try { await prompt.prompt(); await prompt.userChoice; }
    finally { setPrompt(null); }
  }

  if (!prompt && !ios) return null;
  return (
    <div className="my-3 max-w-xs text-sm">
      <button type="button" onClick={() => { void install().catch(() => setHelp(true)); }} className="min-h-11 rounded-xl border border-[#B49A61]/60 bg-[#101713] px-4 py-2 font-semibold text-[#D1D4D2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#89B94D]">
        Instalar APP
      </button>
      {help ? <p role="status" className="mt-2 rounded-lg bg-[#101713] p-3 text-[#D1D4D2]">{ios ? "En Safari, abre Compartir y selecciona Añadir a pantalla de inicio." : "Abre el menú del navegador y busca Instalar aplicación o Añadir a pantalla de inicio."}</p> : null}
    </div>
  );
}
