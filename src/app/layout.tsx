// src/app/layout.tsx
import React from "react";
import type { Metadata } from "next";
import { Fraunces, Geist, Geist_Mono, IBM_Plex_Mono, Instrument_Sans, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./mobile-fixes.css";
import { ScriptExecutor } from "@/components/ScriptExecutor";
import { DevToolsHandler } from "@/components/DevToolsHandler";
import { GlobalErrorCatcher } from "@/components/GlobalErrorCatcher";
import { MobileLandingNav } from "@/components/MobileLandingNav";
import { ChetesaiAiAssistant } from "@/components/ChetesaiAiAssistant";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});
const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ChetesaíFitness+ - Centro de Entrenamiento Personal",
  description: "Gestiona tu centro de entrenamiento personal: clientes, sesiones, pagos y ejercicios",
};

// SUPER IMPORTANT: NOT EDIT THE FOLLOWING 2 LINES TO FORCE NEXT.JS TO RENDER DYNAMICALLY
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${instrumentSans.variable} ${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} antialiased`}>
        <GlobalErrorCatcher />
        <ScriptExecutor />
        <DevToolsHandler />
        <MobileLandingNav />
        <ChetesaiAiAssistant />
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
        </div>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
