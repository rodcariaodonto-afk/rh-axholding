import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEmployees } from "@/hooks/useEmployees";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useJourneyConfigByEmployee } from "@/hooks/useJourneyConfig";

const MONTHS = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAY_MAP: Record<number, string> = { 0: "dom", 1: "seg", 2: "ter", 3: "qua", 4: "qui", 5: "sex", 6: "sab" };
const WEEKDAY_LABELS: Record<string, string> = { dom: "Dom", seg: "Seg", ter: "Ter", qua: "Qua", qui: "Qui", sex: "Sex", sab: "Sáb" };

function minutesToHm(mins: number) {
  const sign = mins < 0 ? "-" : "";
  const abs = Math.abs(mins);
  return `${sign}${Math.floor(abs / 60)}h${String(abs % 60).padStart(2, "0")}`;
}

function tsToTime(ts: string | null) {
  if (!ts) return "—";
  return format(new Date(ts), "HH:mm");
}

export function BancoHorasEspelho() {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const { data: employees = [] } = useEmployees();
  const activeEmployees = useMemo(() => (employees || []).filter((e) => e.status === "active"), [employees]);

  const startDate = format(startOfMonth(new Date(year, month)), "yyyy-MM-dd");
  const endDate = format(endOfMonth(new Date(year, month)), "yyyy-MM-dd");

  const { data: entries = [], isLoading: loadingEntries } = useTimeEntries({
    employeeId: employeeId || undefined,
    startDate,
    endDate,
  });

  const { data: journeyConfig } = useJourneyConfigByEmployee(employeeId || undefined);

  const days = useMemo(() => {
    if (!employeeId) return [];
    const interval = eachDayOfInterval({ start: startOfMonth(new Date(year, month)), end: endOfMonth(new Date(year, month)) });
    const workDays = journeyConfig?.dias_trabalho || ["seg", "ter", "qua", "qui", "sex"];
    const expectedMinutes = (journeyConfig?.horas_dia || 8) * 60;
    const tolerance = journeyConfig?.tolerancia_atraso || 10;

    return interval.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayOfWeek = WEEKDAY_MAP[getDay(date)];
      const isWorkDay = workDays.includes(dayOfWeek);
      const dayEntries = entries.filter((e: any) => e.date === dateStr);
      const entry = dayEntries[0] as any;

      const workedMinutes = entry?.total_minutes || 0;
      const expected = isWorkDay ? expectedMinutes : 0;
      const diff = workedMinutes - expected;
      const extras = diff > tolerance ? diff : diff > 0 ? 0 : diff;

      return {
        date: dateStr,
        dayOfWeek,
        dayLabel: WEEKDAY_LABELS[dayOfWeek],
        isWorkDay,
        entrada: entry?.clock_in,
        lunchOut: entry?.lunch_out,
        lunchReturn: entry?.lunch_return,
        saida: entry?.clock_out,
        expected,
        worked: workedMinutes,
        diff,
        extras,
        tipo: !isWorkDay && workedMinutes === 0 ? "folga" : workedMinutes === 0 && isWorkDay ? "falta" : "presenca",
      };
    });
  }, [employeeId, entries, journeyConfig, month, year]);

  const totals = useMemo(() => {
    const presentes = days.filter((d) => d.tipo === "presenca").length;
    const faltas = days.filter((d) => d.tipo === "falta").length;
    const totalWorked = days.reduce((s, d) => s + d.worked, 0);
    const totalExpected = days.reduce((s, d) => s + d.expected, 0);
    const totalExtras = days.reduce((s, d) => s + (d.extras > 0 ? d.extras : 0), 0);
    const saldo = totalWorked - totalExpected;
    return { presentes, faltas, totalWorked, totalExpected, totalExtras, saldo };
  }, [days]);

  const exportCSV = () => {
    const header = "Data;Dia;Escala;Entrada;Saída Almoço;Retorno Almoço;Saída;Esperado;Trabalhado;Diferença;Extras;Tipo\n";
    const rows = days.map((d) =>
      `${d.date};${d.dayLabel};${d.isWorkDay ? "Sim" : "Não"};${tsToTime(d.entrada)};${tsToTime(d.lunchOut)};${tsToTime(d.lunchReturn)};${tsToTime(d.saida)};${minutesToHm(d.expected)};${minutesToHm(d.worked)};${minutesToHm(d.diff)};${minutesToHm(d.extras)};${d.tipo}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `espelho_${employeeId}_${year}_${month + 1}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Colaborador</label>
          <Select value={employeeId} onValueChange={setEmployeeId}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>
              {activeEmployees.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.full_name || e.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Mês</label>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Ano</label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[year - 1, year, year + 1].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {employeeId && (
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />Exportar CSV</Button>
        )}
      </div>

      {!employeeId ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Selecione um colaborador para visualizar o espelho.</CardContent></Card>
      ) : loadingEntries ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <>
          {journeyConfig && (
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Jornada: <strong>{journeyConfig.tipo_jornada}</strong></span>
              <span>Horas/dia: <strong>{Number(journeyConfig.horas_dia)}h</strong></span>
              <span>Tolerância: <strong>{journeyConfig.tolerancia_atraso}min</strong></span>
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Dia</TableHead>
                      <TableHead>Escala</TableHead>
                      <TableHead>Entrada</TableHead>
                      <TableHead>S. Almoço</TableHead>
                      <TableHead>R. Almoço</TableHead>
                      <TableHead>Saída</TableHead>
                      <TableHead>Esperado</TableHead>
                      <TableHead>Trabalhado</TableHead>
                      <TableHead>Diferença</TableHead>
                      <TableHead>Tipo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {days.map((d) => (
                      <TableRow key={d.date} className={d.tipo === "falta" ? "bg-destructive/5" : d.tipo === "folga" ? "bg-muted/30" : ""}>
                        <TableCell className="font-mono text-xs">{d.date}</TableCell>
                        <TableCell>{d.dayLabel}</TableCell>
                        <TableCell>{d.isWorkDay ? "Sim" : "—"}</TableCell>
                        <TableCell>{tsToTime(d.entrada)}</TableCell>
                        <TableCell>{tsToTime(d.lunchOut)}</TableCell>
                        <TableCell>{tsToTime(d.lunchReturn)}</TableCell>
                        <TableCell>{tsToTime(d.saida)}</TableCell>
                        <TableCell>{minutesToHm(d.expected)}</TableCell>
                        <TableCell>{minutesToHm(d.worked)}</TableCell>
                        <TableCell className={d.diff < 0 ? "text-destructive" : d.diff > 0 ? "text-green-600" : ""}>
                          {minutesToHm(d.diff)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={d.tipo === "falta" ? "destructive" : d.tipo === "folga" ? "secondary" : "default"} className="text-xs">
                            {d.tipo === "presenca" ? "Presença" : d.tipo === "falta" ? "Falta" : "Folga"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Totalizadores */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Dias presentes</p><p className="text-lg font-bold">{totals.presentes}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Faltas</p><p className="text-lg font-bold text-destructive">{totals.faltas}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Horas esperadas</p><p className="text-lg font-bold">{minutesToHm(totals.totalExpected)}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Horas trabalhadas</p><p className="text-lg font-bold">{minutesToHm(totals.totalWorked)}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Horas extras</p><p className="text-lg font-bold text-green-600">{minutesToHm(totals.totalExtras)}</p></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground">Saldo</p><p className={`text-lg font-bold ${totals.saldo < 0 ? "text-destructive" : "text-green-600"}`}>{minutesToHm(totals.saldo)}</p></CardContent></Card>
          </div>
        </>
      )}
    </div>
  );
}
