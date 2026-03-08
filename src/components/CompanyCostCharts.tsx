import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import type { EmployeeWithCost } from "@/hooks/useCompanyCosts";
import type { ConsolidatedCosts } from "@/lib/companyCostCalculations";
import { subMonths, format, isBefore, isAfter, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CompanyCostChartsProps {
  employees: EmployeeWithCost[];
  consolidated: ConsolidatedCosts | null;
}

export const CompanyCostCharts = ({ employees, consolidated }: CompanyCostChartsProps) => {
  if (!consolidated || employees.length === 0) {
    return <div className="text-muted-foreground">Nenhum dado disponível</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Função para verificar se colaborador estava ativo em determinado mês
  const wasActiveInMonth = (employee: EmployeeWithCost, monthDate: Date) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    // Parse das datas
    const hireDate = employee.hire_date ? new Date(employee.hire_date) : null;
    const terminationDate = employee.termination_date ? new Date(employee.termination_date) : null;
    
    // Contratado antes ou durante o mês
    const wasHired = !hireDate || isBefore(hireDate, monthEnd) || hireDate.getTime() === monthEnd.getTime();
    
    // Não estava desligado ou foi desligado depois do início do mês
    const wasNotTerminated = !terminationDate || isAfter(terminationDate, monthStart) || terminationDate.getTime() === monthStart.getTime();
    
    return wasHired && wasNotTerminated;
  };

  // Gerar dados de evolução mensal (últimos 12 meses)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthDate = subMonths(new Date(), 11 - i);
    const monthLabel = format(monthDate, "MMM/yy", { locale: ptBR });
    
    // Filtrar apenas colaboradores ativos naquele mês
    const activeEmployees = employees.filter(emp => wasActiveInMonth(emp, monthDate));
    
    // Calcular custo total do mês
    const totalCost = activeEmployees.reduce((sum, emp) => sum + emp.cost.total_with_charges, 0);
    const totalPayroll = activeEmployees.reduce((sum, emp) => sum + emp.cost.payroll_only, 0);
    
    return {
      month: monthLabel,
      "Custo Total": totalCost,
      "Folha": totalPayroll,
      "Colaboradores": activeEmployees.length,
    };
  });

  // Dados para gráfico de pizza (composição do custo total)
  const pieData = [
    { name: "Salários", value: consolidated.total_payroll, color: "#0ea5e9" },
    { name: "Benefícios", value: consolidated.total_benefits, color: "#8b5cf6" },
    { name: "Encargos", value: consolidated.total_charges, color: "#f59e0b" },
    { name: "Provisões", value: consolidated.total_provisions, color: "#10b981" },
  ];

  // Dados para gráfico de pizza por departamento
  const costsByDepartment = employees.reduce((acc, emp) => {
    const dept = emp.department || "Sem Departamento";
    if (!acc[dept]) {
      acc[dept] = 0;
    }
    acc[dept] += emp.cost.total_with_charges;
    return acc;
  }, {} as Record<string, number>);

  const departmentPieData = Object.entries(costsByDepartment)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ["#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444", "#ec4899", "#06b6d4", "#8b5cf6", "#f97316"];

  return (
    <div className="grid gap-4">
      {/* Gráfico de Linha - Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal dos Custos</CardTitle>
          <CardDescription>
            Custo total da empresa nos últimos 12 meses (apenas colaboradores ativos em cada período)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" tickFormatter={formatCurrency} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value: number, name: string) => {
                  if (name === "Colaboradores") return value;
                  return formatCurrency(value);
                }}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="Custo Total" stroke="#f59e0b" strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="Folha" stroke="#0ea5e9" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="Colaboradores" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Grid 3 colunas para Pizza, Departamentos e Percentuais */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Gráfico de Pizza - Composição */}
        <Card>
          <CardHeader>
            <CardTitle>Composição do Custo Total</CardTitle>
            <CardDescription>
              Distribuição por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / consolidated.total_with_charges) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={formatCurrency} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Pizza - Custos por Departamento */}
        <Card>
          <CardHeader>
            <CardTitle>Custos por Departamento</CardTitle>
            <CardDescription>
              Distribuição de custos entre áreas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${((entry.value / consolidated.total_with_charges) * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {departmentPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={formatCurrency} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Resumo de Percentuais */}
        <Card>
          <CardHeader>
            <CardTitle>Percentuais sobre Folha</CardTitle>
            <CardDescription>
              Impacto de cada categoria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Benefícios</span>
              <span className="text-sm text-muted-foreground">
                {consolidated.benefits_percentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Encargos</span>
              <span className="text-sm text-muted-foreground">
                {consolidated.charges_percentage.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Provisões</span>
              <span className="text-sm text-muted-foreground">
                {consolidated.provisions_percentage.toFixed(1)}%
              </span>
            </div>
            <div className="pt-4 border-t flex justify-between items-center">
              <span className="text-sm font-bold">Total sobre Folha</span>
              <span className="text-sm font-bold">
                {((consolidated.total_with_charges / consolidated.total_payroll - 1) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
