import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useTimeBalance } from "@/hooks/useTimeBalance";
import { useMonthlyTimeEntries } from "@/hooks/useMonthlyTimeEntries";
import { useEmployees } from "@/hooks/useEmployees";
import { MonthlySalarySummary } from "@/components/time-tracking/MonthlySalarySummary";
import { ClockInOutButton } from "@/components/time-tracking/ClockInOutButton";
import { DailyTimeline } from "@/components/time-tracking/DailyTimeline";
import { TimeTrackingDashboard } from "@/components/time-tracking/TimeTrackingDashboard";
import { TimeEntriesTable } from "@/components/time-tracking/TimeEntriesTable";
import { TimeBalanceTable } from "@/components/time-tracking/TimeBalanceTable";
import { MonthlyHeatmap } from "@/components/time-tracking/MonthlyHeatmap";
import { TeamHoursRanking } from "@/components/time-tracking/TeamHoursRanking";
import { DailyVisualControlChart } from "@/components/time-tracking/DailyVisualControlChart";
import { LocationSettings } from "@/components/time-tracking/LocationSettings";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

function TimeTrackingDisclaimer() {
  return (
    <Alert variant="default" className="border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20">
      <AlertTriangle className="size-4 text-yellow-600 dark:text-yellow-500" />
      <AlertTitle className="text-yellow-800 dark:text-yellow-400">Controle interno — sem homologação oficial</AlertTitle>
      <AlertDescription className="text-yellow-700 dark:text-yellow-300/80 text-xs leading-relaxed mt-1">
        Este módulo de ponto é uma ferramenta de <strong>controle interno</strong> e <strong>não substitui</strong> um
        sistema de Registro Eletrônico de Ponto homologado nos termos da{" "}
        <strong>Portaria 671/2021 do MTE</strong> (REP-C, REP-A ou REP-P). Os registros aqui realizados não geram os
        documentos fiscais obrigatórios (AFD/AEJ) e, portanto, <strong>não possuem validade jurídica</strong> para fins
        trabalhistas, fiscalizações ou processos judiciais. Para conformidade legal, utilize um sistema que atenda
        integralmente à legislação vigente e à LGPD.
      </AlertDescription>
    </Alert>
  );
}

export default function TimeTracking() {
  const { user } = useAuth();
  const { isAdmin, isPeople } = useUserRole(user?.id);
  const isManager = isAdmin || isPeople;

  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  // Employee view: own entries
  const { data: myTodayEntries = [], isLoading: loadingMyToday } = useTimeEntries({
    employeeId: user?.id,
    date: today,
  });

  const { data: myWeekEntries = [], isLoading: loadingMyWeek } = useTimeEntries({
    employeeId: user?.id,
    startDate: weekStart,
    endDate: weekEnd,
  });

  // Admin view: filter
  const [adminDateFilter, setAdminDateFilter] = useState(today);

  const { data: allEntries = [], isLoading: loadingAll } = useTimeEntries({
    date: adminDateFilter,
  });

  const { data: balances = [], isLoading: loadingBalances } = useTimeBalance({
    referenceMonth: monthStart,
  });

  // Overview filters
  const [overviewEmployee, setOverviewEmployee] = useState<string>("all");
  const [overviewMonth, setOverviewMonth] = useState(new Date().getMonth());
  const [overviewYear, setOverviewYear] = useState(new Date().getFullYear());

  const overviewStartDate = format(startOfMonth(new Date(overviewYear, overviewMonth)), "yyyy-MM-dd");
  const overviewEndDate = format(endOfMonth(new Date(overviewYear, overviewMonth)), "yyyy-MM-dd");

  const MONTHS = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const yearOptions = [overviewYear - 2, overviewYear - 1, overviewYear, overviewYear + 1];

  const { data: employeesList = [] } = useEmployees();
  const activeEmployees = useMemo(
    () => (employeesList || []).filter((e) => e.status === "active"),
    [employeesList]
  );

  // Overview data with filters
  const { monthEntries, weekEntries, isLoading: loadingOverview, weekStart: ovWeekStart, weekEnd: ovWeekEnd } = useMonthlyTimeEntries({
    customStartDate: overviewStartDate,
    customEndDate: overviewEndDate,
    employeeId: overviewEmployee !== "all" ? overviewEmployee : undefined,
  });

  // Monthly totals for employee
  const { data: myMonthEntries = [] } = useTimeEntries({
    employeeId: user?.id,
    startDate: monthStart,
    endDate: monthEnd,
  });
  const monthlyMinutes = myMonthEntries.reduce((sum, e) => sum + (e.total_minutes || 0), 0);
  const monthlyHours = Math.floor(monthlyMinutes / 60);
  const monthlyMins = monthlyMinutes % 60;

  if (!isManager) {
    // Collaborator view
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meu Ponto</h1>
          <p className="text-muted-foreground">Registre sua entrada e saída</p>
        </div>

        <TimeTrackingDisclaimer />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ClockInOutButton />
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Horas no mês</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{monthlyHours}h{monthlyMins.toString().padStart(2, "0")}min</p>
                <p className="text-xs text-muted-foreground">{myMonthEntries.length} registros</p>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registros de hoje</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMyToday ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <DailyTimeline entries={myTodayEntries as any} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registros da semana</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMyWeek ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <TimeEntriesTable entries={myWeekEntries as any} showEmployee={false} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Admin/People view
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestão de Ponto</h1>
        <p className="text-muted-foreground">Acompanhe e gerencie os registros de ponto da equipe</p>
      </div>

      <TimeTrackingDisclaimer />

      <TimeTrackingDashboard />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="entries">Registros</TabsTrigger>
          <TabsTrigger value="balance">Banco de Horas</TabsTrigger>
          <TabsTrigger value="locations">Locais</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Colaborador</label>
              <Select value={overviewEmployee} onValueChange={setOverviewEmployee}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os colaboradores</SelectItem>
                  {activeEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name || emp.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Mês</label>
              <Select value={String(overviewMonth)} onValueChange={(v) => setOverviewMonth(Number(v))}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Ano</label>
              <Select value={String(overviewYear)} onValueChange={(v) => setOverviewYear(Number(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {overviewEmployee === "all" ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Selecione um colaborador para visualizar os gráficos.
              </CardContent>
            </Card>
          ) : loadingOverview ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full" />
              <Skeleton className="h-80 w-full lg:col-span-2" />
            </div>
          ) : (
            <div className="space-y-6">
              <MonthlySalarySummary
                employeeId={overviewEmployee}
                month={overviewMonth}
                year={overviewYear}
                monthEntries={monthEntries as any}
              />
              {/* Daily visual control chart - full width */}
              <DailyVisualControlChart
                entries={monthEntries as any}
                startDate={overviewStartDate}
                endDate={overviewEndDate}
              />

              <MonthlyHeatmap
                entries={monthEntries as any}
                monthStart={overviewStartDate}
                monthEnd={overviewEndDate}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="entries" className="space-y-4">
          <div className="flex items-center gap-4">
            <Input
              type="date"
              value={adminDateFilter}
              onChange={(e) => setAdminDateFilter(e.target.value)}
              className="w-48"
            />
          </div>
          {loadingAll ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <TimeEntriesTable entries={allEntries as any} showEmployee />
          )}
        </TabsContent>

        <TabsContent value="balance">
          {loadingBalances ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <TimeBalanceTable balances={balances as any} />
          )}
        </TabsContent>

        <TabsContent value="locations">
          <LocationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
