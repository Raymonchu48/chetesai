"use client";

import { useEffect } from "react";

export function PwaServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.isSecureContext) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // El acceso web debe seguir funcionando aunque no se pueda instalar la PWA.
      });
    }
  }, []);

  return null;
}
