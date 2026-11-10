"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppSidebar from "@/components/AppSidebar";
import { AlertTriangle, CheckCircle2, Clock3, Inbox, MessageCircle, RefreshCcw, Send } from "lucide-react";

type Alert = {
  id: string;
  cliente_id: string;
  tipo: "consulta" | "molestias";
  mensaje: string;
  estado: "pendiente" | "en_revision" | "resuelto" | "revisado";
  created_at: string;
  respuesta?: string | null;
  respondido_at?: string | null;
  clientes?: { nombre?: string } | null;
};
type Filter = "todos" | "pendiente" | "en_revision" | "resuelto" | "molestias";

const statusText: Record<string, string> = {
  pendiente: "Pendiente", en_revision: "En revisión", resuelto: "Resuelto", revisado: "Revisado",
};
const statusClass: Record<string, string> = {
  pendiente: "border-amber-200 bg-amber-50 text-amber-900",
  en_revision: "border-blue-200 bg-blue-50 text-blue-900",
  resuelto: "border-emerald-200 bg-emerald-50 text-emerald-900",
  revisado: "border-emerald-200 bg-emerald-50 text-emerald-900",
};
export default function CoachAlertsPage() {
  const [items, setItems] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [selected, setSelected] = useState("");
  const [reply, setReply] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/coach-avisos", { cache: "no-store" });
      const data = await response.json() as { ok?: boolean; error?: string; avisos?: Alert[] };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo cargar la bandeja");
      setItems(data.avisos || []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error al consultar los avisos");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const counts = useMemo(() => ({
    pendientes: items.filter(a => a.estado === "pendiente").length,
    molestias: items.filter(a => a.tipo === "molestias" && a.estado !== "resuelto" && a.estado !== "revisado").length,
    revision: items.filter(a => a.estado === "en_revision").length,
    resueltos: items.filter(a => a.estado === "resuelto" || a.estado === "revisado").length,
  }), [items]);
  const visible = items.filter(a =>
    filter === "todos" ? true :
    filter === "molestias" ? a.tipo === "molestias" :
    filter === "resuelto" ? a.estado === "resuelto" || a.estado === "revisado" :
    a.estado === filter
  );

  async function update(item: Alert, changes: { estado?: string; respuesta?: string }) {
    setBusy(item.id);
    setError("");
    try {
      const response = await fetch("/api/coach-avisos", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, ...changes }),
      });
      const data = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "No se pudo guardar");
      setSelected("");
      setReply("");
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Error al guardar");
    } finally { setBusy(""); }
  }

  return <AppSidebar>
    <div className="mx-auto max-w-6xl space-y-6 p-4 pb-12 sm:p-6 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-[#337c35]">Panel profesional · Comunicación</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Centro de avisos del Coach IA</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#56665a]">Consultas y avisos de bienestar enviados por clientes. Las respuestas y los cambios de estado quedan registrados. La IA no modifica planes ni toma decisiones clínicas.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#ced8cb] bg-white px-4 text-sm font-semibold disabled:opacity-50">
          <RefreshCcw className="h-4 w-4" /> Actualizar
        </button>
      </div>
      {error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Pendientes", number: counts.pendientes, icon: Clock3 },
          { label: "Molestias activas", number: counts.molestias, icon: AlertTriangle },
          { label: "En revisión", number: counts.revision, icon: MessageCircle },
          { label: "Resueltos", number: counts.resueltos, icon: CheckCircle2 },
        ].map(card => <div key={card.label} className="rounded-2xl border border-[#d9e1d6] bg-white p-4 shadow-sm">
          <card.icon className="mb-3 h-5 w-5 text-[#337c35]" />
          <p className="text-2xl font-bold">{card.number}</p>
          <p className="text-xs font-medium text-[#56665a]">{card.label}</p>
        </div>)}
      </div>

      <section aria-label="Bandeja de consultas" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold"><Inbox className="h-5 w-5" /> Bandeja de consultas</h2>
          <div className="flex flex-wrap gap-2" aria-label="Filtros de avisos">
            {(["todos", "pendiente", "en_revision", "molestias", "resuelto"] as const).map(value =>
              <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}
                className={`min-h-11 rounded-full border px-3 text-xs font-bold ${filter === value ? "border-[#265d2d] bg-[#265d2d] text-white" : "border-[#d1dcd0] bg-white text-[#28472e]"}`}>
                {value === "todos" ? "Todos" : value === "molestias" ? "Molestias" : statusText[value]}
              </button>
            )}
          </div>
        </div>
        {loading ? <p className="rounded-2xl bg-white p-6">Cargando avisos…</p> :
          !visible.length ? <div className="rounded-2xl border border-dashed border-[#cad7ca] bg-white p-8 text-center text-sm text-[#647168]">No hay avisos en esta categoría.</div> :
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map(item => <article key={item.id} className="rounded-2xl border border-[#d6dfd3] bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.tipo === "molestias" ? "bg-amber-100 text-amber-800" : "bg-[#eaf6e6] text-[#337c35]"}`}>
                    {item.tipo === "molestias" ? <AlertTriangle className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                  </span>
                  <div>
                    <h3 className="font-bold">{item.clientes?.nombre || "Cliente"}</h3>
                    <p className="text-xs text-[#607067]">{item.tipo === "molestias" ? "Aviso de molestias" : "Consulta al profesional"}</p>
                  </div>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusClass[item.estado] || statusClass.pendiente}`}>{statusText[item.estado] || item.estado}</span>
              </div>
              <p className="mt-3 text-xs text-[#607067]">{new Date(item.created_at).toLocaleString("es-ES")}</p>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm">{item.mensaje}</p>
              {item.respuesta ? <div className="mt-4 rounded-xl border border-[#cee1c8] bg-[#f1f8ef] p-3 text-sm"><p className="mb-1 font-bold">Respuesta profesional</p><p className="whitespace-pre-wrap break-words">{item.respuesta}</p>{item.respondido_at ? <p className="mt-2 text-xs text-[#526c53]">{new Date(item.respondido_at).toLocaleString("es-ES")}</p> : null}</div> : null}
              <div className="mt-4 flex flex-wrap gap-2">
                {item.estado === "pendiente" ? <button type="button" disabled={busy === item.id} onClick={() => void update(item, { estado: "en_revision" })} className="min-h-11 rounded-xl border border-[#d5e2d1] px-3 text-xs font-bold">En revisión</button> : null}
                {item.estado !== "resuelto" && item.estado !== "revisado" ? <button type="button" disabled={busy === item.id} onClick={() => void update(item, { estado: "resuelto" })} className="min-h-11 rounded-xl border border-[#bcd9b4] bg-[#e8f5e4] px-3 text-xs font-bold text-[#225f2b]">Marcar resuelto</button> : null}
                <button type="button" onClick={() => { setSelected(selected === item.id ? "" : item.id); setReply(item.respuesta || ""); }} className="min-h-11 rounded-xl bg-[#265d2d] px-4 text-xs font-bold text-white">{selected === item.id ? "Cerrar respuesta" : item.respuesta ? "Editar respuesta" : "Responder"}</button>
                <Link href={`/clientes?cliente_id=${encodeURIComponent(item.cliente_id)}`} className="flex min-h-11 items-center rounded-xl border border-[#d5e2d1] px-3 text-xs font-bold">Ver clientes</Link>
              </div>
              {selected === item.id ? <div className="mt-4 space-y-2">
                <label htmlFor={`reply-${item.id}`} className="text-sm font-semibold">Mensaje para el cliente</label>
                <textarea id={`reply-${item.id}`} value={reply} onChange={event => setReply(event.target.value)} maxLength={2000} rows={4} className="w-full rounded-xl border border-[#bfcdbd] bg-white p-3 text-sm" placeholder="Escribe una respuesta profesional…" />
                <button type="button" disabled={busy === item.id || reply.trim().length < 2} onClick={() => void update(item, { respuesta: reply })} className="flex min-h-11 items-center gap-2 rounded-xl bg-[#265d2d] px-4 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" /> Guardar y enviar respuesta</button>
              </div> : null}
            </article>)}
          </div>}
      </section>
    </div>
  </AppSidebar>;
}
