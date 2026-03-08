import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsKPICard } from "./AnalyticsKPICard";
import { AnalyticsData } from "@/hooks/useAnalyticsData";
import { Users, TrendingDown, Briefcase, Clock, AlertTriangle, CheckCircle, Info } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface OverviewTabProps {
  data: AnalyticsData;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
  "hsl(var(--chart-7))",
  "hsl(var(--chart-8))",
];

export function OverviewTab({ data }: OverviewTabProps) {
  const strategicInsights = getStrategicInsights(data);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AnalyticsKPICard
          title="Colaboradores Ativos"
          value={data.activeEmployees}
          icon={Users}
          description="Total atual"
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <AnalyticsKPICard
          title="Taxa de Turnover"
          value={`${data.turnoverRate.toFixed(1)}%`}
          icon={TrendingDown}
          description="Últimos 12 meses"
          iconColor="text-amber-600"
          iconBgColor="bg-amber-100"
        />
        <AnalyticsKPICard
          title="Vagas Abertas"
          value={data.openJobs}
          icon={Briefcase}
          description="Em recrutamento"
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <AnalyticsKPICard
          title="Tempo Médio de Casa"
          value={`${data.avgTenureYears.toFixed(1)} anos`}
          icon={Clock}
          description="Colaboradores ativos"
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
         {/* Headcount Evolution */}
         <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
           <CardHeader>
            <CardTitle className="text-base font-medium">Evolução do Headcount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--card-foreground))" }}
                    itemStyle={{ color: "hsl(var(--card-foreground))" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="headcount"
                    name="Headcount"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

         {/* Department Distribution */}
         <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
           <CardHeader>
            <CardTitle className="text-base font-medium">Distribuição por Departamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.departmentDistribution.slice(0, 8)}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--card-foreground))" }}
                    itemStyle={{ color: "hsl(var(--card-foreground))" }}
                  />
                  <Bar
                    dataKey="count"
                    name="Colaboradores"
                    fill="hsl(var(--chart-1))"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
         {/* Contract Type */}
         <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
           <CardHeader>
            <CardTitle className="text-base font-medium">Tipo de Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.contractTypeDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                  >
                    {data.contractTypeDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "hsl(var(--card-foreground))" }}
                    itemStyle={{ color: "hsl(var(--card-foreground))" }}
                    formatter={(value: number, name: string) => [`${value} colaboradores`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend below chart */}
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
              {data.contractTypeDistribution.map((item, index) => {
                const total = data.contractTypeDistribution.reduce((sum, i) => sum + i.count, 0);
                const percent = ((item.count / total) * 100).toFixed(0);
                return (
                  <div key={item.name} className="flex items-center gap-1.5 text-xs">
                    <div
                      className="size-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-muted-foreground">{item.name}: {percent}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

         {/* Strategic Insights */}
         <Card className="lg:col-span-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
           <CardHeader>
            <CardTitle className="text-base font-medium">Alertas Estratégicos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strategicInsights.length > 0 ? (
                strategicInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 rounded-lg border p-3 ${getInsightBorderColor(insight.type)}`}
                  >
                    {getInsightIcon(insight.type)}
                    <div>
                      <p className="font-medium text-sm">{insight.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20 p-3">
                  <CheckCircle className="size-5 text-emerald-500" />
                  <p className="text-sm">
                    Todos os indicadores estão dentro dos parâmetros esperados.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StrategicInsight {
  type: "warning" | "danger" | "info";
  title: string;
  description: string;
}

function getStrategicInsights(data: AnalyticsData): StrategicInsight[] {
  const insights: StrategicInsight[] = [];

  // High turnover alert
  if (data.turnoverRate > 15) {
    insights.push({
      type: "danger",
      title: "Turnover Elevado",
      description: `Taxa de turnover de ${data.turnoverRate.toFixed(1)}% está acima do ideal (15%). Considere analisar os motivos de desligamento.`,
    });
  } else if (data.turnoverRate > 10) {
    insights.push({
      type: "warning",
      title: "Atenção ao Turnover",
      description: `Taxa de turnover de ${data.turnoverRate.toFixed(1)}% requer monitoramento.`,
    });
  }

  // Open positions alert
  if (data.openJobs > 5) {
    insights.push({
      type: "warning",
      title: "Vagas em Aberto",
      description: `${data.openJobs} vagas abertas. Verifique a capacidade de recrutamento.`,
    });
  }

  // Recent terminations
  if (data.terminationsLast12Months > data.hiresLast12Months) {
    insights.push({
      type: "warning",
      title: "Mais Desligamentos que Contratações",
      description: `${data.terminationsLast12Months} desligamentos vs ${data.hiresLast12Months} contratações nos últimos 12 meses.`,
    });
  }

  // Low average tenure
  if (data.avgTenureYears < 1.5 && data.activeEmployees > 10) {
    insights.push({
      type: "info",
      title: "Equipe Recente",
      description: `Tempo médio de casa de ${data.avgTenureYears.toFixed(1)} anos indica equipe relativamente nova.`,
    });
  }

  return insights;
}

function getInsightIcon(type: "warning" | "danger" | "info") {
  switch (type) {
    case "danger":
      return <AlertTriangle className="size-5 text-red-500 shrink-0" />;
    case "warning":
      return <AlertTriangle className="size-5 text-amber-500 shrink-0" />;
    case "info":
      return <Info className="size-5 text-blue-500 shrink-0" />;
  }
}

function getInsightBorderColor(type: "warning" | "danger" | "info") {
  switch (type) {
    case "danger":
      return "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20";
    case "warning":
      return "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20";
    case "info":
      return "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20";
  }
}
