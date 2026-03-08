import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployeeContract } from "@/hooks/useEmployeeContract";
import { DollarSign, Clock, TrendingUp, TrendingDown } from "lucide-react";
import { getDaysInMonth, getDay } from "date-fns";

interface MonthlySalarySummaryProps {
  employeeId: string;
  month: number; // 0-indexed
  year: number;
  monthEntries: any[];
}

function countBusinessDays(year: number, month: number): number {
  const totalDays = getDaysInMonth(new Date(year, month));
  let count = 0;
  for (let d = 1; d <= totalDays; d++) {
    const dow = getDay(new Date(year, month, d));
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

export function MonthlySalarySummary({ employeeId, month, year, monthEntries }: MonthlySalarySummaryProps) {
  const { contracts, isLoading } = useEmployeeContract(employeeId);

  const activeContract = useMemo(
    () => contracts?.find((c) => c.is_active) ?? contracts?.[0],
    [contracts]
  );

  const calc = useMemo(() => {
    if (!activeContract) return null;

    const baseSalary = activeContract.base_salary || 0;
    const weeklyHours = activeContract.weekly_hours || 44;
    const businessDays = countBusinessDays(year, month);
    const dailyHours = weeklyHours / 5;
    const expectedMonthlyHours = businessDays * dailyHours;

    const totalWorkedMinutes = monthEntries.reduce(
      (sum: number, e: any) => sum + (e.total_minutes || 0),
      0
    );
    const totalWorkedHours = totalWorkedMinutes / 60;

    const hourlyRate = expectedMonthlyHours > 0 ? baseSalary / expectedMonthlyHours : 0;
    const proportionalSalary = hourlyRate * totalWorkedHours;
    const difference = proportionalSalary - baseSalary;

    return {
      baseSalary,
      weeklyHours,
      expectedMonthlyHours,
      totalWorkedHours,
      hourlyRate,
      proportionalSalary,
      difference,
    };
  }, [activeContract, monthEntries, month, year]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  if (!activeContract || !calc) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Resumo Salarial</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum contrato ativo encontrado para este colaborador.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const formatHours = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return `${hrs}h${mins.toString().padStart(2, "0")}`;
  };

  const isOvertime = calc.difference > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="size-4 text-muted-foreground" />
          Resumo Salarial do Mês
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Salário Base</p>
            <p className="text-lg font-semibold">{formatCurrency(calc.baseSalary)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Valor/Hora</p>
            <p className="text-lg font-semibold">{formatCurrency(calc.hourlyRate)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" /> Horas Esperadas
            </p>
            <p className="text-lg font-semibold">{formatHours(calc.expectedMonthlyHours)}</p>
            <p className="text-[10px] text-muted-foreground">{calc.weeklyHours}h semanais</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" /> Horas Trabalhadas
            </p>
            <p className="text-lg font-semibold">{formatHours(calc.totalWorkedHours)}</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-6">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Salário Proporcional</p>
            <p className="text-xl font-bold">{formatCurrency(calc.proportionalSalary)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Diferença</p>
            <div className="flex items-center gap-1">
              {isOvertime ? (
                <TrendingUp className="size-4 text-green-500" />
              ) : (
                <TrendingDown className="size-4 text-destructive" />
              )}
              <p className={`text-lg font-semibold ${isOvertime ? "text-green-500" : "text-destructive"}`}>
                {calc.difference > 0 ? "+" : ""}{formatCurrency(calc.difference)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
