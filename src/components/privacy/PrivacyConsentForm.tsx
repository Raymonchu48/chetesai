"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Camera, HeartPulse, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONSENT_NOTICES, type ConsentState } from "@/lib/privacy-contract";
import { toast } from "sonner";

type Choice = "yes" | "no" | "";

type Props = {
  initialConsents: ConsentState;
  compact?: boolean;
  onSaved?: (consents: ConsentState) => void;
};

function toChoice(value: boolean | null): Choice {
  return value === true ? "yes" : value === false ? "no" : "";
}
export default function PrivacyConsentForm({ initialConsents, compact = false, onSaved }: Props) {
  const [health, setHealth] = useState<Choice>(toChoice(initialConsents.health_data.granted));
  const [photos, setPhotos] = useState<Choice>(toChoice(initialConsents.progress_photos.granted));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setHealth(toChoice(initialConsents.health_data.granted));
    setPhotos(toChoice(initialConsents.progress_photos.granted));
  }, [initialConsents]);

  async function save() {
    if (!health || !photos) return toast.error("Indica una respuesta para cada consentimiento");
    setSaving(true);
    try {
      const response = await fetch("/api/portal/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_consents",
          health_data: health === "yes",
          progress_photos: photos === "yes",
        }),
      });
      const result = (await response.json()) as { ok: boolean; data?: { consents: ConsentState }; error?: string };
      if (!response.ok || !result.ok || !result.data) throw new Error(result.error || "No se pudieron guardar las preferencias");
      toast.success("Preferencias de privacidad guardadas");
      onSaved?.(result.data.consents);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <ConsentChoice
        icon={<HeartPulse className="h-5 w-5" />}
        title="Datos de salud y seguimiento"
        description={CONSENT_NOTICES.health_data}
        value={health}
        name="health-consent"
        requiredLabel="Necesario para valoraciones, mediciones y nutrición personalizada."
        onChange={setHealth}
      />
      <ConsentChoice
        icon={<Camera className="h-5 w-5" />}
        title="Fotografías de progreso"
        description={CONSENT_NOTICES.progress_photos}
        value={photos}
        name="photo-consent"
        requiredLabel="Opcional. Puedes utilizar Chetesaí sin aportar fotografías."
        onChange={setPhotos}
      />
      <div className="flex flex-col gap-3 rounded-2xl border border-[#d7b86b]/35 bg-[#d7b86b]/10 p-4 text-sm leading-6 text-[#51482f] sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />Puedes retirar cualquiera de estos consentimientos cuando quieras. La retirada no afecta al tratamiento realizado legítimamente con anterioridad.</p>
        <Link href="/privacy-policy" target="_blank" className="shrink-0 font-bold underline underline-offset-4">Leer política</Link>
      </div>
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving || !health || !photos} className="h-12 rounded-xl bg-[#2f9e24] px-6 font-bold hover:bg-[#27891e]">
          {saving ? "Guardando..." : "Guardar preferencias"}
        </Button>
      </div>
    </div>
  );
}

function ConsentChoice({ icon, title, description, requiredLabel, value, name, onChange }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  requiredLabel: string;
  value: Choice;
  name: string;
  onChange: (value: Choice) => void;
}) {
  return (
    <fieldset className="rounded-2xl border border-[#ded8cd] bg-[#fffdf9] p-5">
      <legend className="sr-only">{title}</legend>
      <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eaf5e8] text-[#2f9e24]">{icon}</span><div><h3 className="font-black text-[#202724]">{title}</h3><p className="text-xs font-semibold text-[#67706b]">{requiredLabel}</p></div></div>
      <p className="mt-4 text-sm leading-6 text-[#59635e]">{description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ChoiceRadio checked={value === "yes"} name={name} value="yes" label="Sí, autorizo expresamente" onChange={() => onChange("yes")} />
        <ChoiceRadio checked={value === "no"} name={name} value="no" label="No autorizo" onChange={() => onChange("no")} />
      </div>
    </fieldset>
  );
}

function ChoiceRadio({ checked, name, value, label, onChange }: { checked: boolean; name: string; value: string; label: string; onChange: () => void }) {
  return <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm font-bold transition ${checked ? "border-[#2f9e24] bg-[#eaf5e8] text-[#245f1f]" : "border-[#ded8cd] bg-white text-[#59635e] hover:border-[#8cdb78]"}`}><input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="h-4 w-4 accent-[#2f9e24]" />{label}</label>;
}
