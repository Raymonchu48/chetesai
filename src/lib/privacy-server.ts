import "server-only";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import {
  CONSENT_NOTICES,
  EMPTY_CONSENT_STATE,
  PRIVACY_POLICY_VERSION,
  type ConsentState,
  type ConsentType,
} from "@/lib/privacy-contract";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type AuthenticatedUser = {
  id: string;
  email: string;
  created_at?: string;
  last_sign_in_at?: string;
};

export type PrivacyClient = {
  id: string;
  nombre: string;
  email: string | null;
  telefono?: string | null;
};

type ConsentEvent = {
  consent_type: ConsentType;
  granted: boolean;
  policy_version: string;
  recorded_at: string;
};

export async function privacyServiceRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase no está configurado");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const text = await response.text();
  const parsed = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = parsed?.message || parsed?.error || text || `Supabase respondió ${response.status}`;
    throw new Error(message);
  }
  return parsed as T;
}
export async function getPrivacyUser(): Promise<AuthenticatedUser> {
  if (!supabaseUrl || !anonKey) throw new Error("Supabase no está configurado");
  const store = await cookies();
  const token = store.get("chetesai_access_token")?.value;
  if (!token) throw new Error("No autenticado");

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Sesión no válida");
  const user = (await response.json()) as Partial<AuthenticatedUser>;
  if (!user.id || !user.email) throw new Error("Tu cuenta no tiene un correo asociado");
  return user as AuthenticatedUser;
}

export async function getPrivacyClientContext() {
  const user = await getPrivacyUser();
  const clients = await privacyServiceRequest<PrivacyClient[]>(
    `clientes?email=ilike.${encodeURIComponent(user.email)}&select=id,nombre,email,telefono&limit=1`
  );
  if (!clients[0]) throw new Error("Tu cuenta todavía no está vinculada a un cliente");
  return { user, client: clients[0] };
}

export async function getConsentState(clientId: string): Promise<ConsentState> {
  const events = await privacyServiceRequest<ConsentEvent[]>(
    `privacy_consent_events?cliente_id=eq.${encodeURIComponent(clientId)}&select=consent_type,granted,policy_version,recorded_at&order=recorded_at.desc,id.desc`
  );
  const state: ConsentState = {
    health_data: { ...EMPTY_CONSENT_STATE.health_data },
    progress_photos: { ...EMPTY_CONSENT_STATE.progress_photos },
  };

  for (const event of events) {
    if (state[event.consent_type].recordedAt) continue;
    state[event.consent_type] = {
      granted: event.granted,
      policyVersion: event.policy_version,
      recordedAt: event.recorded_at,
    };
  }
  return state;
}

export async function recordConsent(
  clientId: string,
  authUserId: string,
  consentType: ConsentType,
  granted: boolean
) {
  const legalTextHash = createHash("sha256").update(CONSENT_NOTICES[consentType]).digest("hex");
  await privacyServiceRequest("privacy_consent_events", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      cliente_id: clientId,
      auth_user_id: authUserId,
      consent_type: consentType,
      granted,
      policy_version: PRIVACY_POLICY_VERSION,
      legal_text_hash: legalTextHash,
      source: "client_portal",
    }),
  });
}

export async function requireConsent(clientId: string, consentType: ConsentType) {
  const state = await getConsentState(clientId);
  if (state[consentType].granted !== true) {
    const label = consentType === "health_data" ? "datos de salud" : "fotografías de progreso";
    throw new Error(`Consentimiento requerido para tratar ${label}`);
  }
  return state[consentType];
}

export function hashPrivacyEmail(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

export function privacyErrorStatus(message: string) {
  if (message === "No autenticado" || message === "Sesión no válida") return 401;
  if (message.includes("no está vinculada") || message === "No autorizado") return 403;
  if (message.startsWith("Consentimiento requerido")) return 409;
  return 500;
}
