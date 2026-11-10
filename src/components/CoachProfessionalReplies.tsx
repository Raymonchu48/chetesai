"use client";

import { useCallback, useEffect, useState } from "react";
import { MailCheck, RefreshCcw } from "lucide-react";

type ClientAlert = {
  id: string;
  tipo: "consulta" | "molestias";
  mensaje: string;
  estado: string;
  created_at: string;
  respuesta?: string | null;
  respondido_at?: string | null;
  respuesta_vista_at?: string | null;
};

function isUnread(item: ClientAlert) {
  return Boolean(item.respuesta?.trim()) && Boolean(item.respondido_at) &&
    (!item.respuesta_vista_at || new Date(item.respuesta_vista_at).getTime() < new Date(item.respondido_at!).getTime());
}

export function CoachProfessionalReplies({ active }: { active: boolean }) {
  const [items, setItems] = useState<ClientAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/portal/coach-respuestas", { cache: "no-store" });
      const body = await response.json() as { ok?: boolean; error?: string; avisos?: ClientAlert[] };
      if (!response.ok || !body.ok) throw new Error(body.error || "No se pudieron consultar las respuestas");
      setItems(body.avisos || []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error al recuperar tus consultas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (active) void load(); }, [active, load]);

  async function viewReply(item: ClientAlert) {
    if (expanded.includes(item.id)) {
      setExpanded(previous => previous.filter(id => id !== item.id));
      return;
    }
    setExpanded(previous => [...previous, item.id]);
    if (!isUnread(item)) return;
    setBusy(item.id);
    try {
      const response = await fetch("/api/portal/coach-respuestas", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id }),
      });
      const data = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo registrar la lectura");
      setItems(current => current.map(row => row.id === item.id ? { ...row, respuesta_vista_at: new Date().toISOString() } : row));
      window.dispatchEvent(new Event("chetesai:replies-read"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo registrar la lectura");
    } finally {
      setBusy("");
    }
  }

  if (!active) return null;
  const unread = items.filter(isUnread).length;
  return <section aria-label="Consultas y respuestas del profesional" className="mb-3 rounded-xl border border-[#c6dbc1] bg-[#f0f8ed] p-3 text-xs text-[#244528]">
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className="flex items-center gap-2 font-bold"><MailCheck className="h-4 w-4" /> Mis consultas al profesional {unread ? <span className="rounded-full bg-[#236532] px-2 py-0.5 text-white">{unread} nueva{unread === 1 ? "" : "s"}</span> : null}</p>
      <button type="button" onClick={() => void load()} disabled={loading} className="min-h-10 rounded-lg border border-[#b7d0b2] bg-white px-3 font-semibold disabled:opacity-50"><RefreshCcw className="mr-1 inline h-3.5 w-3.5" />Actualizar</button>
    </div>
    {error ? <p role="alert" className="mb-2 text-red-700">{error}</p> : null}
    {loading ? <p>Cargando consultas…</p> : !items.length ? <p>Aún no has enviado consultas al profesional.</p> :
      <div className="max-h-64 space-y-2 overflow-y-auto">
        {items.map(item => <article key={item.id} className="rounded-lg border border-[#c6dbc1] bg-white p-3">
          <p className="text-[11px] font-semibold text-[#3c6740]">{new Date(item.created_at).toLocaleDateString("es-ES")} · {item.tipo === "molestias" ? "Molestias" : "Consulta"} · {item.estado === "en_revision" ? "En revisión" : item.estado === "resuelto" || item.estado === "revisado" ? "Resuelto" : "Pendiente"}</p>
          <p className="mt-1 whitespace-pre-wrap break-words">{item.mensaje}</p>
          {item.respuesta ? <>
            <button type="button" disabled={busy === item.id} onClick={() => void viewReply(item)}
              className="mt-2 min-h-10 rounded-lg border border-[#91c395] bg-[#e8f5e4] px-3 font-bold text-[#245b31] disabled:opacity-50">
              {expanded.includes(item.id) ? "Ocultar respuesta" : isUnread(item) ? "Nueva respuesta · Leer" : "Ver respuesta"}
            </button>
            {expanded.includes(item.id) ? <div className="mt-2 rounded-lg bg-[#e8f5e4] p-2">
              <p className="font-bold">Respuesta de tu profesional</p>
              <p className="mt-1 whitespace-pre-wrap break-words">{item.respuesta}</p>
              {item.respondido_at ? <p className="mt-1 text-[10px]">{new Date(item.respondido_at).toLocaleString("es-ES")}</p> : null}
            </div> : null}
          </> : <p className="mt-1 italic text-[#607664]">Aún no hay respuesta.</p>}
        </article>)}
      </div>}
  </section>;
}
