"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BellRing, CalendarClock, CheckCircle2, Mail, RefreshCw, Repeat2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type FinancialAlert = {
  id: string;
  tipo: "pocas_sesiones" | "proximo_vencimiento" | "cuota_vencida";
  nivel: "aviso" | "critico";
  titulo: string;
  descripcion: string;
  cliente_nombre: string;
  email: string | null;
  bono_cliente_id: string | null;
  pago_cliente_id: string | null;
  email_enviado: boolean;
  renovacion_automatica?: boolean;
  renovacion_programada_id?: string | null;
};

type ScheduledRenewal = {
  id: string;
  cliente_nombre: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio_eur: number;
};

type AlertsPayload = {
  alertas: FinancialAlert[];
  renovaciones_programadas: ScheduledRenewal[];
  resumen: {
    total_alertas: number;
    cuotas_vencidas: number;
    renovaciones_programadas: number;
  };
};

const emptyPayload: AlertsPayload = {
  alertas: [],
  renovaciones_programadas: [],
  resumen: { total_alertas: 0, cuotas_vencidas: 0, renovaciones_programadas: 0 },
};

export default function FinancialAlertsCenter() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AlertsPayload>(emptyPayload);
  const [workingId, setWorkingId] = useState<string | null>(null);

  const load = useCallback(async (processAutomatic = false) => {
    setLoading(true);
    try {
      if (processAutomatic) {
        const processResponse = await fetch("/api/bonos/renovaciones", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "procesar_automaticas" }),
        });
        const processResult = (await processResponse.json()) as {
          ok: boolean;
          data?: { creadas: number; correos_enviados: number };
          error?: string;
        };
        if (processResponse.ok && processResult.ok && processResult.data?.creadas) {
          toast.success(
            processResult.data.correos_enviados
              ? "Renovación automática creada y comunicada"
              : "Renovación automática creada"
          );
        }
      }

      const response = await fetch("/api/bonos/renovaciones", { cache: "no-store" });
      const result = (await response.json()) as { ok: boolean; data?: AlertsPayload; error?: string };
      if (!response.ok || !result.ok || !result.data) {
        throw new Error(result.error || "No se pudieron cargar las alertas");
      }
      setData(result.data);
    } catch (error) {
      console.error("Financial alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(true);
  }, [load]);

  async function runAction(alert: FinancialAlert, action: "enviar" | "renovar") {
    setWorkingId(`${action}-${alert.id}`);
    try {
      const response = await fetch("/api/bonos/renovaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "renovar"
            ? { action: "generar_renovacion", bono_cliente_id: alert.bono_cliente_id }
            : {
                action: "enviar_aviso",
                tipo: alert.tipo,
                bono_cliente_id: alert.bono_cliente_id,
                pago_cliente_id: alert.pago_cliente_id,
              }
        ),
      });
      const result = (await response.json()) as {
        ok: boolean;
        data?: { sent?: boolean; alreadySent?: boolean; created?: boolean; emailSent?: boolean; emailError?: string };
        error?: string;
      };
      if (!response.ok || !result.ok) throw new Error(result.error || "No se pudo completar la acción");

      if (action === "renovar") {
        toast.success(result.data?.created === false ? "La renovación ya estaba creada" : "Renovación y cuota generadas");
        if (result.data?.emailError) toast.warning("La renovación se creó, pero el correo no pudo enviarse");
      } else {
        toast.success(result.data?.alreadySent ? "El aviso ya había sido enviado" : "Aviso enviado por correo");
      }
      await load(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo completar la acción");
    } finally {
      setWorkingId(null);
    }
  }

  const attentionCount = data.resumen.total_alertas;

  return (
    <>
      <Button
        type="button"
        className="fixed bottom-6 right-6 z-40 h-14 rounded-full px-5 shadow-xl"
        onClick={() => setOpen(true)}
        aria-label="Abrir alertas de pagos y renovaciones"
      >
        <BellRing className="mr-2 h-5 w-5" />
        Alertas
        {attentionCount > 0 ? (
          <span className="ml-2 grid h-6 min-w-6 place-items-center rounded-full bg-white px-1.5 text-xs font-bold text-primary">
            {attentionCount}
          </span>
        ) : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <BellRing className="h-6 w-6 text-primary" /> Alertas y renovaciones
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            <Metric label="Alertas activas" value={data.resumen.total_alertas} />
            <Metric label="Cuotas vencidas" value={data.resumen.cuotas_vencidas} />
            <Metric label="Renovaciones programadas" value={data.resumen.renovaciones_programadas} />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div>
              <p className="font-semibold">Revisión financiera</p>
              <p className="text-sm text-muted-foreground">Pocas sesiones, vencimientos y cobros pendientes.</p>
            </div>
            <Button variant="outline" size="sm" disabled={loading} onClick={() => load(true)}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
            </Button>
          </div>

          {loading ? (
            <p className="py-12 text-center text-muted-foreground">Revisando bonos y cuotas...</p>
          ) : data.alertas.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center text-emerald-800">
              <CheckCircle2 className="mx-auto h-9 w-9" />
              <p className="mt-3 font-semibold">Todo está al día</p>
              <p className="mt-1 text-sm">No hay bonos próximos a vencer ni cuotas atrasadas.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {data.alertas.map((alert) => {
                const canRenew = Boolean(alert.bono_cliente_id && !alert.renovacion_programada_id);
                return (
                  <div
                    key={alert.id}
                    className={`rounded-2xl border p-4 ${
                      alert.nivel === "critico" ? "border-red-200 bg-red-50/70" : "border-amber-200 bg-amber-50/70"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex gap-3">
                        <div className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${alert.nivel === "critico" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {alert.tipo === "cuota_vencida" ? <CalendarClock className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{alert.titulo}</p>
                            {alert.email_enviado ? <Badge variant="secondary">Aviso enviado</Badge> : null}
                            {alert.renovacion_programada_id ? <Badge className="bg-blue-100 text-blue-800">Renovación programada</Badge> : null}
                            {alert.renovacion_automatica ? <Badge variant="outline">Automática</Badge> : null}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{alert.descripcion}</p>
                          {!alert.email ? <p className="mt-1 text-xs text-red-600">El cliente no tiene correo electrónico.</p> : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        {canRenew ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={workingId === `renovar-${alert.id}`}
                            onClick={() => runAction(alert, "renovar")}
                          >
                            <Repeat2 className="mr-2 h-4 w-4" /> Renovar
                          </Button>
                        ) : null}
                        <Button
                          size="sm"
                          disabled={!alert.email || alert.email_enviado || workingId === `enviar-${alert.id}`}
                          onClick={() => runAction(alert, "enviar")}
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          {alert.email_enviado ? "Enviado" : "Enviar aviso"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {data.renovaciones_programadas.length ? (
            <section className="mt-7">
              <h3 className="flex items-center gap-2 font-semibold"><Repeat2 className="h-5 w-5 text-primary" /> Próximas renovaciones</h3>
              <div className="mt-3 space-y-2">
                {data.renovaciones_programadas.map((renewal) => (
                  <div key={renewal.id} className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{renewal.cliente_nombre} · {renewal.nombre}</p>
                      <p className="text-sm text-muted-foreground">Empieza el {formatDate(renewal.fecha_inicio)} y termina el {formatDate(renewal.fecha_fin)}</p>
                    </div>
                    <p className="font-bold text-primary">{formatMoney(renewal.precio_eur)}</p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-ES");
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(Number(value || 0));
}
