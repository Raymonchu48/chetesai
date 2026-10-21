import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/app",
    name: "Chetesaí Fitness+",
    short_name: "Chetesaí",
    description: "Tu portal privado de entrenamiento, nutrición y gestión profesional.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#101914",
    theme_color: "#101914",
    lang: "es",
    icons: [
      { src: "/brand/chetesai-app-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/chetesai-app-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  };
}
