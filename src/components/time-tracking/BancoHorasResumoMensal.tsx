import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { useEmployees } from "@/hooks/useEmployees";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useJourneyConfigByEmployee } from "@/hooks/useJourneyConfig";
import { useFeriados, type Feriado } from "@/hooks/useFeriados";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAY_MAP: Record<number, string> = { 0: "dom", 1: "seg", 2: "ter", 3: "qua", 4: "qui", 5: "sex", 6: "sab" };

function minutesToHm(mins: number) {
  const sign = mins < 0 ? "-" : "";
  const abs = Math.abs(mins);
  return `${sign}${Math.floor(abs / 60)}h${String(abs % 60).padStart(2, "0")}`;
}

function isFeriadoDate(dateStr: string, feriados: Feriado[]): boolean {
  return feriados.some((f) =>
    f.recorrente ? f.data.slice(5) === dateStr.slice(5) : f.data === dateStr
  );
}

export function BancoHorasResumoMensal() {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: employees = [] } = useEmployees();
  const activeEmployees = useMemo(() => (employees || []).filter((e) => e.status === "active"), [employees]);

  const startDate = format(startOfMonth(new Date(year, month)), "yyyy-MM-dd");
  const endDate = format(endOfMonth(new Date(year, month)), "yyyy-MM-dd");

  const { data: entries = [], isLoading } = useTimeEntries({
    employeeId: employeeId || undefined,
    startDate,
    endDate,
  });

  const { data: journeyConfig } = useJourneyConfigByEmployee(employeeId || undefined);
  const { data: feriados = [] } = useFeriados();

  const summary = useMemo(() => {
    if (!employeeId || !journeyConfig) return null;

    const today = format(new Date(), "yyyy-MM-dd");
    const interval = eachDayOfInterval({ start: startOfMonth(new Date(year, month)), end: endOfMonth(new Date(year, month)) });
    const workDays = journeyConfig.dias_trabalho || ["seg", "ter", "qua", "qui", "sex"];
    const expectedMinutesPerDay = (journeyConfig.horas_dia || 8) * 60;
    const toleranciaAtraso = journeyConfig.tolerancia_atraso ?? 10;

    // Total business days in the month (excluding feriados) — for planning reference
    const businessDays = interval.filter((d) => {
      const dateStr = format(d, "yyyy-MM-dd");
      return workDays.includes(WEEKDAY_MAP[getDay(d)]) && !isFeriadoDate(dateStr, feriados);
    }).length;

    let workedDays = 0;
    let absences = 0;
    let totalWorked = 0;
    let totalExpected = 0;
    let totalExtras = 0;

    interval.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      // Skip future days — they have no entries and shouldn't count as absences or inflate expected
      if (dateStr > today) return;

      const dayOfWeek = WEEKDAY_MAP[getDay(date)];
      const isWorkDay = workDays.includes(dayOfWeek);
      const isFeriado = isFeriadoDate(dateStr, feriados);
      const dayEntries = entries.filter((e: any) => e.date === dateStr);
      const worked = dayEntries.reduce((s: number, e: any) => s + (e.total_minutes || 0), 0);

      if (isWorkDay && !isFeriado) {
        totalExpected += expectedMinutesPerDay;
        if (worked > 0) {
          workedDays++;
          totalWorked += worked;
          const diff = worked - expectedMinutesPerDay;
          if (diff > toleranciaAtraso) totalExtras += diff;
        } else {
          absences++;
        }
      } else if (worked > 0) {
        // Worked on weekend or feriado — counts as worked time and extras
        totalWorked += worked;
        totalExtras += worked;
      }
    });

    const saldo = totalWorked - totalExpected;

    return { businessDays, workedDays, absences, totalWorked, totalExpected, totalExtras, saldo };
  }, [employeeId, entries, journeyConfig, feriados, month, year]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Colaborador</label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {activeEmployees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Mês</label>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>{MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Ano</label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>{[year - 1, year, year + 1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {!employeeId ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione um colaborador.</CardContent></Card>
      ) : isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : !summary ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Configure a jornada deste colaborador primeiro.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CalendarDays className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Dias úteis (mês)</p>
                <p className="text-xl font-bold">{summary.businessDays}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Dias trabalhados</p>
                <p className="text-xl font-bold">{summary.workedDays}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Faltas</p>
                <p className="text-xl font-bold text-destructive">{summary.absences}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Horas extras</p>
                <p className="text-xl font-bold text-green-600">{minutesToHm(summary.totalExtras)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Horas esperadas</p>
                <p className="text-xl font-bold">{minutesToHm(summary.totalExpected)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Horas trabalhadas</p>
                <p className="text-xl font-bold">{minutesToHm(summary.totalWorked)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2">
            <CardContent className="p-4 flex items-center gap-3">
              {summary.saldo >= 0 ? <TrendingUp className="h-8 w-8 text-green-600" /> : <TrendingDown className="h-8 w-8 text-destructive" />}
              <div>
                <p className="text-xs text-muted-foreground">Saldo do mês</p>
                <p className={`text-2xl font-bold ${summary.saldo >= 0 ? "text-green-600" : "text-destructive"}`}>{minutesToHm(summary.saldo)}</p>
              </div>
              <Badge variant={summary.saldo >= 0 ? "default" : "destructive"} className="ml-auto">
                {summary.saldo >= 0 ? "Positivo" : "Negativo"}
              </Badge>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
