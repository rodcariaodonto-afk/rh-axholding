import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Percent } from "lucide-react";
import type { ConsolidatedCosts } from "@/lib/companyCostCalculations";

interface CompanyCostSummaryProps {
  consolidated: ConsolidatedCosts | null;
}

export const CompanyCostSummary = ({ consolidated }: CompanyCostSummaryProps) => {
  if (!consolidated) {
    return <div className="text-muted-foreground">Nenhum dado disponível</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{consolidated.total_employees}</div>
          <p className="text-xs text-muted-foreground mt-1">Contratos ativos</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Folha de Pagamento</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(consolidated.total_payroll)}</div>
          <p className="text-xs text-muted-foreground mt-1">Somente salários</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Custo Total Mensal</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(consolidated.total_with_charges)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Com encargos e provisões
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Encargos + Provisões</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPercent(consolidated.charges_percentage + consolidated.provisions_percentage)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sobre a folha de pagamento
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
