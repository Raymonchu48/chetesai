"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PrivacyConsentForm from "@/components/privacy/PrivacyConsentForm";
import { EMPTY_CONSENT_STATE, type ConsentState } from "@/lib/privacy-contract";

export default function PrivacyConsentPrompt() {
  const [consents, setConsents] = useState<ConsentState>(EMPTY_CONSENT_STATE);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/portal/privacy", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { ok: boolean; data?: { consents: ConsentState } }) => {
        if (!result.ok || !result.data) return;
        setConsents(result.data.consents);
        setOpen(Object.values(result.data.consents).some((item) => item.granted === null));
      })
      .catch(() => undefined);
  }, []);

  return (
    <Dialog open={open}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-[#8cdb78]/30 bg-[#f7f4ee]" onEscapeKeyDown={(event) => event.preventDefault()} onInteractOutside={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Tus datos, bajo tu control</DialogTitle>
          <DialogDescription className="leading-6">Antes de utilizar las funciones de seguimiento, necesitamos que elijas expresamente cómo podemos tratar tus datos de salud y tus fotografías.</DialogDescription>
        </DialogHeader>
        <PrivacyConsentForm initialConsents={consents} compact onSaved={(next) => { setConsents(next); setOpen(false); }} />
      </DialogContent>
    </Dialog>
  );
}
