export const PRIVACY_POLICY_VERSION = "2026-08-28";

export const CONSENT_NOTICES = {
  health_data:
    "Autorizo expresamente a Chetesaí Fitness+ a tratar los datos de salud, condición física, medidas corporales, lesiones, limitaciones, nutrición y hábitos que facilite, exclusivamente para realizar mi valoración, adaptar el servicio y efectuar el seguimiento profesional.",
  progress_photos:
    "Autorizo expresamente a Chetesaí Fitness+ a tratar las fotografías de progreso que aporte voluntariamente, exclusivamente para su comparación privada y mi seguimiento profesional. No autorizo con ello su publicación, publicidad ni difusión.",
} as const;

export type ConsentType = keyof typeof CONSENT_NOTICES;
export type ConsentValue = boolean | null;

export type ConsentRecord = {
  granted: ConsentValue;
  policyVersion: string | null;
  recordedAt: string | null;
};
export type ConsentState = Record<ConsentType, ConsentRecord>;

export const EMPTY_CONSENT_STATE: ConsentState = {
  health_data: { granted: null, policyVersion: null, recordedAt: null },
  progress_photos: { granted: null, policyVersion: null, recordedAt: null },
};
