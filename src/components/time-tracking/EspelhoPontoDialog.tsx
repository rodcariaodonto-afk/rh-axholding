import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronLeft, ChevronRight, Printer } from "lucide-react";
import { format, getDaysInMonth, getDay, startOfMonth, endOfMonth } from "date-fns";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { useFeriados, type Feriado } from "@/hooks/useFeriados";
import { formatTimeBrasilia } from "@/lib/timezone";

interface EspelhoPontoDialogProps {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h${m.toString().padStart(2, "0")}min`;
}

function findFeriado(dateStr: string, feriados: Feriado[]): Feriado | undefined {
  return feriados.find((f) => {
    if (f.recorrente) {
      return f.data.slice(5) === dateStr.slice(5); // compare MM-DD only
    }
    return f.data === dateStr;
  });
}

export function EspelhoPontoDialog({ open, onClose, employeeId, employeeName }: EspelhoPontoDialogProps) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const monthStart = format(startOfMonth(new Date(year, month)), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date(year, month)), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: entries = [] } = useTimeEntries({ employeeId, startDate: monthStart, endDate: monthEnd });
  const { data: feriados = [] } = useFeriados();

  const entriesByDate = useMemo(() => {
    const map: Record<string, (typeof entries)[0]> = {};
    entries.forEach((e) => { map[e.date] = e; });
    return map;
  }, [entries]);

  const days = useMemo(() => {
    const count = getDaysInMonth(new Date(year, month));
    return Array.from({ length: count }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayOfWeek = getDay(new Date(dateStr));
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const feriado = findFeriado(dateStr, feriados);
      const entry = entriesByDate[dateStr];
      const isWorkday = !isWeekend && !feriado;
      const isMissing = isWorkday && !entry && dateStr < today;
      return { day, dateStr, dayOfWeek, isWeekend, feriado, entry, isMissing };
    });
  }, [year, month, feriados, entriesByDate, today]);

  const totalMinutes = entries.reduce((sum, e) => sum + (e.total_minutes || 0), 0);
  const workedDays = new Set(entries.filter((e) => e.total_minutes && e.total_minutes > 0).map((e) => e.date)).size;
  const missingDays = days.filter((d) => d.isMissing).length;

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <DialogTitle className="text-base">
              Espelho de Ponto — {employeeName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="size-8" onClick={prevMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm font-medium min-w-[130px] text-center">
                {MESES[month]} {year}
              </span>
              <Button variant="outline" size="icon" className="size-8" onClick={nextMonth}>
                <ChevronRight className="size-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
                <Printer className="size-3.5" />
                Exportar PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Dia</TableHead>
                <TableHead className="w-16">Semana</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída Almoço</TableHead>
                <TableHead>Retorno Almoço</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.map(({ day, dateStr, dayOfWeek, isWeekend, feriado, entry, isMissing }) => {
                let rowClass = "";
                if (feriado) rowClass = "bg-blue-50/60 dark:bg-blue-950/20";
                else if (isMissing) rowClass = "bg-red-50/60 dark:bg-red-950/20";
                else if (isWeekend) rowClass = "bg-muted/30";

                return (
                  <TableRow key={dateStr} className={rowClass}>
                    <TableCell className="font-medium text-sm">{String(day).padStart(2, "0")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{DIAS_SEMANA[dayOfWeek]}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry ? formatTimeBrasilia(entry.clock_in) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry?.lunch_out ? formatTimeBrasilia(entry.lunch_out) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry?.lunch_return ? formatTimeBrasilia(entry.lunch_return) : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {entry?.clock_out ? formatTimeBrasilia(entry.clock_out) : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry?.total_minutes != null ? formatMinutes(entry.total_minutes) : "—"}
                    </TableCell>
                    <TableCell>
                      {feriado ? (
                        <Badge className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">{feriado.nome}</Badge>
                      ) : isWeekend ? (
                        <span className="text-xs text-muted-foreground">Fim de semana</span>
                      ) : isMissing ? (
                        <Badge className="text-xs bg-red-500/10 text-red-600 border-red-200">Falta</Badge>
                      ) : entry?.clock_out ? (
                        <Badge variant="secondary" className="text-xs">Finalizado</Badge>
                      ) : entry ? (
                        <Badge className="text-xs bg-green-500/10 text-green-600 border-green-200">Em andamento</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap gap-6 pt-2 border-t text-sm">
          <div>
            <span className="text-muted-foreground">Total no mês: </span>
            <span className="font-semibold">{formatMinutes(totalMinutes)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Dias trabalhados: </span>
            <span className="font-semibold">{workedDays}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Dias faltantes: </span>
            <span className="font-semibold text-red-600">{missingDays}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded bg-blue-100 dark:bg-blue-950 border border-blue-200" />
            Feriado
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded bg-red-100 dark:bg-red-950 border border-red-200" />
            Falta
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-3 rounded bg-muted border" />
            Fim de semana
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
