import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEmployees } from "@/hooks/useEmployees";
import { useMonthlyTimeEntries } from "@/hooks/useMonthlyTimeEntries";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WeeklyHoursChart } from "@/components/time-tracking/WeeklyHoursChart";
import { MonthlyHeatmap } from "@/components/time-tracking/MonthlyHeatmap";
import { TeamHoursRanking } from "@/components/time-tracking/TeamHoursRanking";
import { HoursGanttChart } from "@/components/time-tracking/HoursGanttChart";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Download, BarChart3, Users, Calendar, FileText } from "lucide-react";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export default function TimeReports() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [activeTab, setActiveTab] = useState("charts");

  const { organizationId } = useCurrentOrganization();
  const yearOptions = [selectedYear - 1, selectedYear, selectedYear + 1];

  const monthStart = format(startOfMonth(new Date(selectedYear, selectedMonth)), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date(selectedYear, selectedMonth)), "yyyy-MM-dd");

  const { data: employeesList = [] } = useEmployees();
  const activeEmployees = useMemo(
    () => (employeesList || []).filter((e) => e.status === "active"),
    [employeesList]
  );

  const {
    monthEntries,
    weekEntries,
    isLoading,
    weekStart,
    weekEnd,
  } = useMonthlyTimeEntries({
    customStartDate: monthStart,
    customEndDate: monthEnd,
    employeeId: selectedEmployee !== "all" ? selectedEmployee : undefined,
  });

  // Fetch absenteeism data for consolidated report
  const { data: absenteeismData = [] } = useQuery({
    queryKey: ["absenteeism-report", organizationId, monthStart, monthEnd],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("absenteeism")
        .select("*, employee:employee_id(id, full_name)")
        .eq("organization_id", organizationId)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .order("date");
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // KPIs
  const totalHours = useMemo(() => {
    const totalMin = monthEntries.reduce((sum: number, e: any) => sum + (e.total_minutes || 0), 0);
    return (totalMin / 60).toFixed(1);
  }, [monthEntries]);

  const uniqueEmployees = useMemo(() => {
    const set = new Set<string>();
    for (const e of monthEntries as any[]) set.add(e.employee_id);
    return set.size;
  }, [monthEntries]);

  const totalEntries = monthEntries.length;

  const avgHoursPerDay = useMemo(() => {
    const daySet = new Set<string>();
    for (const e of monthEntries as any[]) daySet.add(e.date);
    if (daySet.size === 0) return "0";
    const totalMin = monthEntries.reduce((sum: number, e: any) => sum + (e.total_minutes || 0), 0);
    return (totalMin / 60 / daySet.size).toFixed(1);
  }, [monthEntries]);

  const handleExportCSV = () => {
    if (monthEntries.length === 0) return;
    const header = "Data,Colaborador,Email,Entrada,Saída,Minutos\n";
    const rows = (monthEntries as any[]).map((e) => {
      const name = e.employees?.full_name || e.employees?.email || "";
      const email = e.employees?.email || "";
      return `${e.date},"${name}",${email},${e.clock_in || ""},${e.clock_out || ""},${e.total_minutes || 0}`;
    });
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-ponto-${MONTHS[selectedMonth]}-${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios de Ponto</h1>
          <p className="text-muted-foreground">Visualize e exporte dados de frequência da equipe</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={monthEntries.length === 0}>
          <Download className="size-4 mr-1.5" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Colaborador</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
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
              <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
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
              <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
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
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
            <BarChart3 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">{totalEntries} registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueEmployees}</div>
            <p className="text-xs text-muted-foreground">com registros no mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média/dia</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHoursPerDay}h</div>
            <p className="text-xs text-muted-foreground">horas por dia trabalhado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período</CardTitle>
            <Calendar className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{MONTHS[selectedMonth]}</div>
            <p className="text-xs text-muted-foreground">{selectedYear}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
          <Skeleton className="h-80 lg:col-span-2" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Gantt daily chart */}
          <HoursGanttChart
            entries={monthEntries as any}
            startDate={monthStart}
            endDate={monthEnd}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Heatmap */}
            <MonthlyHeatmap
              entries={monthEntries as any}
              monthStart={monthStart}
              monthEnd={monthEnd}
            />

            {/* Team ranking (only when "all") */}
            {selectedEmployee === "all" && (
              <TeamHoursRanking entries={monthEntries as any} />
            )}

            {/* Weekly chart when specific employee */}
            {selectedEmployee !== "all" && (
              <WeeklyHoursChart
                entries={weekEntries as any}
                weekStart={weekStart}
                weekEnd={weekEnd}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
