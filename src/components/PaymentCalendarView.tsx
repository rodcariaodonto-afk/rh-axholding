import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, addMonths, subMonths, getDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentCalendarViewProps {
  payments: any[];
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-700",
  paid: "bg-emerald-500/20 text-emerald-700",
  cancelled: "bg-red-500/20 text-red-700 line-through",
};

export const PaymentCalendarView = ({ payments }: PaymentCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPadding = getDay(monthStart);

  const getPaymentsForDay = (day: Date) => {
    return payments.filter(p => {
      const payDate = parseISO(p.payment_date);
      return isSameDay(payDate, day);
    });
  };

  const totalForMonth = useMemo(() => {
    return payments
      .filter(p => {
        const d = parseISO(p.payment_date);
        return d >= monthStart && d <= monthEnd && p.status !== "cancelled";
      })
      .reduce((sum, p) => sum + Number(p.amount), 0);
  }, [payments, monthStart, monthEnd]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Calendário de Pagamentos</CardTitle>
          <Badge variant="outline">
            Total: R$ {totalForMonth.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </Badge>
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
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {WEEKDAYS.map(day => (
            <div key={day} className="bg-muted p-2 text-center text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="bg-background p-2 min-h-[70px]" />
          ))}
          {days.map(day => {
            const dayPayments = getPaymentsForDay(day);
            return (
              <div key={day.toISOString()} className="bg-background p-1.5 min-h-[70px] border-t">
                <div className="text-xs font-medium text-foreground mb-1">{format(day, "d")}</div>
                <div className="space-y-0.5">
                  {dayPayments.slice(0, 2).map(p => (
                    <div
                      key={p.id}
                      className={`text-[10px] truncate rounded px-1 py-0.5 ${statusColors[p.status] || ""}`}
                    >
                      R$ {Number(p.amount).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                    </div>
                  ))}
                  {dayPayments.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1">
                      +{dayPayments.length - 2}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500/20" />
            <span>Pendente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-500/20" />
            <span>Pago</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500/20" />
            <span>Cancelado</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
