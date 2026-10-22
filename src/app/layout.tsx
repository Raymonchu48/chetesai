// src/app/layout.tsx
import React from "react";
import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, Geist_Mono, Instrument_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./mobile-fixes.css";
import { ScriptExecutor } from "@/components/ScriptExecutor";
import { DevToolsHandler } from "@/components/DevToolsHandler";
import { GlobalErrorCatcher } from "@/components/GlobalErrorCatcher";
import { MobileLandingNav } from "@/components/MobileLandingNav";
import { ChetesaiAiAssistant } from "@/components/ChetesaiAiAssistant";
import { PwaRegistration } from "@/components/PwaRegistration";
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

export const viewport: Viewport = { themeColor: "#101713" };

export const metadata: Metadata = {
  applicationName: "Chetesaí Fitness+",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Chetesaí" },
  icons: {
    icon: [{ url: "/brand/favicon.svg", type: "image/svg+xml" }, { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/brand/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  title: "Chetesaí Fitness+ - Centro de Entrenamiento Personal",
  description: "Gestiona tu centro de entrenamiento personal: clientes, sesiones, pagos y ejercicios",
};

// SUPER IMPORTANT: NOT EDIT THE FOLLOWING 2 LINES TO FORCE NEXT.JS TO RENDER DYNAMICALLY
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} ${instrumentSans.variable} ${spaceGrotesk.variable} antialiased`}>
        <PwaRegistration />
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
