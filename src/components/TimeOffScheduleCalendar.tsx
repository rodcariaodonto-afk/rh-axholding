import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWithinInterval, parseISO, addMonths, subMonths, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TimeOffRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
}

interface TimeOffScheduleCalendarProps {
  requests: TimeOffRequest[];
  employees: any[];
  departments: any[];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const TimeOffScheduleCalendar = ({ requests, employees, departments }: TimeOffScheduleCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const approvedRequests = useMemo(() => {
    return requests.filter(r => r.status === "approved");
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (deptFilter === "all") return approvedRequests;
    return approvedRequests.filter(r => {
      const emp = employees?.find(e => e.id === r.employee_id);
      return emp?.department_id === deptFilter;
    });
  }, [approvedRequests, deptFilter, employees]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getRequestsForDay = (day: Date) => {
    return filteredRequests.filter(r => {
      const start = parseISO(r.start_date);
      const end = parseISO(r.end_date);
      return isWithinInterval(day, { start, end });
    });
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees?.find(e => e.id === employeeId);
    return emp?.full_name || emp?.email || "—";
  };

  // Conflict detection: days with 3+ people on vacation
  const conflictDays = useMemo(() => {
    const conflicts: Date[] = [];
    days.forEach(day => {
      const count = getRequestsForDay(day).length;
      if (count >= 3) conflicts.push(day);
    });
    return conflicts;
  }, [days, filteredRequests]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle>Programação de Férias</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Departamentos</SelectItem>
                {departments?.map((dept: any) => (
                  <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </h3>
          <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {conflictDays.length > 0 && (
          <div className="mb-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Conflitos detectados</p>
              <p className="text-xs text-muted-foreground">
                {conflictDays.length} dia(s) com 3+ colaboradores ausentes simultaneamente.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {WEEKDAYS.map(day => (
            <div key={day} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-background p-2 min-h-[80px]" />
          ))}
          {days.map(day => {
            const dayRequests = getRequestsForDay(day);
            const isConflict = dayRequests.length >= 3;
            return (
              <div
                key={day.toISOString()}
                className={`bg-background p-1.5 min-h-[80px] border-t ${isConflict ? "bg-destructive/5" : ""}`}
              >
                <div className={`text-xs font-medium mb-1 ${isConflict ? "text-destructive" : "text-foreground"}`}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayRequests.slice(0, 2).map(r => (
                    <div key={r.id} className="text-[10px] truncate rounded bg-primary/10 text-primary px-1 py-0.5">
                      {getEmployeeName(r.employee_id)}
                    </div>
                  ))}
                  {dayRequests.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayRequests.length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/10" />
            <span>Férias agendadas</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-destructive/10" />
            <span>Conflito (3+ ausentes)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
