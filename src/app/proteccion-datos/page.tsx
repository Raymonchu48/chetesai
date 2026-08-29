"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock3, Download, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

type RequestRow = {
  id: string;
  request_type: "access_export" | "erasure";
  status: "pending" | "in_progress" | "completed" | "rejected" | "cancelled";
  requested_at: string;
  resolved_at: string | null;
  resolution_note: string | null;
  clientes?: { nombre?: string; email?: string | null } | null;
};

const statusLabels = {
  pending: "Pendiente",
  in_progress: "En proceso",
  completed: "Completada",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

export default function DataProtectionPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/privacy/requests", { cache: "no-store" });
      const result = (await response.json()) as { ok: boolean; data?: RequestRow[]; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudieron cargar las solicitudes");
      setRequests(result.data || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openCount = useMemo(
    () => requests.filter((item) => item.status === "pending" || item.status === "in_progress").length,
    [requests]
  );

  async function updateRequest(id: string, status: RequestRow["status"]) {
    setSavingId(id);
    try {
      const response = await fetch("/api/privacy/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, resolution_note: notes[id] || "" }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo actualizar");
      toast.success("Solicitud actualizada");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AppSidebar>
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Privacidad y RGPD</p>
            <h1 className="mt-2 flex items-center gap-3 text-3xl font-bold tracking-tight"><ShieldCheck className="h-8 w-8 text-primary" />Protección de datos</h1>
            <p className="mt-2 text-muted-foreground">Consentimientos auditables y seguimiento operativo de derechos.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />Actualizar</Button>
        </header>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Metric icon={<Clock3 />} label="Solicitudes abiertas" value={String(openCount)} />
          <Metric icon={<CheckCircle2 />} label="Resueltas" value={String(requests.filter((item) => item.status === "completed").length)} />
          <Metric icon={<ShieldCheck />} label="Plazo operativo" value="1 mes" />
        </div>

        <Card className="mb-6 border-amber-200 bg-amber-50/60">
          <CardContent className="p-6 text-sm leading-6 text-amber-950">
            <h2 className="font-bold">Procedimiento de supresión</h2>
            <p className="mt-2">Verifica la solicitud, identifica qué información debe conservarse bloqueada por obligación fiscal o contractual, elimina o anonimiza el resto —incluidas las fotografías— y documenta la actuación. Marca la solicitud como completada únicamente al terminar el proceso.</p>
          </CardContent>
        </Card>

        {loading && !requests.length ? <p className="py-16 text-center text-muted-foreground">Cargando solicitudes...</p> : !requests.length ? (
          <Card><CardContent className="py-16 text-center"><ShieldCheck className="mx-auto h-11 w-11 text-primary" /><h2 className="mt-4 text-xl font-bold">No hay solicitudes pendientes</h2><p className="mt-2 text-muted-foreground">Las peticiones realizadas desde el portal del cliente aparecerán aquí.</p></CardContent></Card>
        ) : (
          <div className="space-y-4">
            {requests.map((item) => {
              const closed = ["completed", "rejected", "cancelled"].includes(item.status);
              return (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {item.request_type === "erasure" ? <Trash2 className="h-5 w-5 text-red-600" /> : <Download className="h-5 w-5 text-primary" />}
                          <h2 className="font-bold">{item.request_type === "erasure" ? "Supresión de datos" : "Exportación de datos"}</h2>
                          <Badge variant="outline">{statusLabels[item.status]}</Badge>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{item.clientes?.nombre || "Cliente eliminado"} · {item.clientes?.email || "Identidad anonimizada"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Solicitada: {formatDate(item.requested_at)}</p>
                        {item.resolution_note ? <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm">{item.resolution_note}</p> : null}
                      </div>
                      {!closed ? <div className="w-full max-w-lg space-y-3"><Textarea value={notes[item.id] || ""} onChange={(event) => setNotes({ ...notes, [item.id]: event.target.value })} placeholder="Documenta la revisión, datos eliminados o motivo de conservación..." /><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={savingId === item.id} onClick={() => updateRequest(item.id, "in_progress")}>En proceso</Button><Button disabled={savingId === item.id} onClick={() => updateRequest(item.id, "completed")}>Marcar completada</Button><Button variant="destructive" disabled={savingId === item.id} onClick={() => updateRequest(item.id, "rejected")}>Rechazar</Button></div></div> : null}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppSidebar>
  );
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <Card><CardContent className="flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span><div><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold">{value}</p></div></CardContent></Card>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
