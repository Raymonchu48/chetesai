"use client";

import { useEffect, useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CalendarDays,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
} from "lucide-react";

interface DashboardData {
  totalClientes: number;
  clientesActivos: number;
  totalIngresos: number;
  pagosPendientes: number;
  sesionesHoy: number;
  sesionesCompletadas: number;
  sesionesProgramadas: number;
  totalSesiones: number;
  totalPagos: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        const json = (await res.json()) as { ok: boolean; data?: DashboardData };
        if (json.ok && json.data) {
          setData(json.data);
        }
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const kpiCards = data
    ? [
        {
          title: "Clientes Activos",
          value: data.clientesActivos,
          total: data.totalClientes,
          icon: Users,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
        {
          title: "Ingresos Totales",
          value: `${data.totalIngresos.toLocaleString("es-ES")} EUR`,
          total: null,
          icon: DollarSign,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          title: "Sesiones Hoy",
          value: data.sesionesHoy,
          total: data.totalSesiones,
          icon: CalendarDays,
          color: "text-violet-600",
          bg: "bg-violet-50",
        },
        {
          title: "Pagos Pendientes",
          value: data.pagosPendientes,
          total: data.totalPagos,
          icon: CreditCard,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
      ]
    : [];

  const businessMetrics = [
    { label: "Cuota Mensual", value: "180 EUR", icon: DollarSign },
    { label: "Meta Ingresos", value: "3.750 EUR/mes", icon: TrendingUp },
    { label: "Meta Gastos", value: "1.750 EUR/mes", icon: AlertCircle },
    { label: "Beneficio Neto", value: "2.000 EUR/mes", icon: CheckCircle2 },
  ];

  return (
    <AppSidebar>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Resumen general de tu centro de entrenamiento</p>
        </div>

        {/* KPI Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {kpiCards.map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.title} className="border border-border hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
                        <p className="text-2xl font-bold mt-1 text-foreground">{kpi.value}</p>
                        {kpi.total !== null && (
                          <p className="text-xs text-muted-foreground mt-1">de {kpi.total} total</p>
                        )}
                      </div>
                      <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${kpi.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Business Plan Metrics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Plan de Negocio - Resumen Financiero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {businessMetrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="bg-muted/50 rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <p className="font-bold text-foreground">{metric.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress bar */}
            {data && (
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progreso hacia meta mensual</span>
                  <span className="font-medium text-foreground">
                    {data.totalIngresos.toLocaleString("es-ES")} / 3.750 EUR
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((data.totalIngresos / 3750) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Resumen de Sesiones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Programadas</span>
                </div>
                <Badge variant="secondary">{data?.sesionesProgramadas ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">Completadas</span>
                </div>
                <Badge variant="secondary">{data?.sesionesCompletadas ?? 0}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-violet-500" />
                  <span className="text-sm">Total</span>
                </div>
                <Badge variant="secondary">{data?.totalSesiones ?? 0}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Estado de Pagos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm">Cobrados</span>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                  {data ? data.totalPagos - data.pagosPendientes : 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">Pendientes</span>
                </div>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                  {data?.pagosPendientes ?? 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Ingresos Totales</span>
                </div>
                <Badge variant="secondary">
                  {data?.totalIngresos.toLocaleString("es-ES") ?? 0} EUR
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppSidebar>
  );
}
