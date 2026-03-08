import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsKPICard } from "./AnalyticsKPICard";
import { AnalyticsData } from "@/hooks/useAnalyticsData";
import { WorkforceStabilityChart } from "./WorkforceStabilityChart";
import { UserPlus, UserMinus, TrendingDown } from "lucide-react";
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
} from "recharts";

interface HiringRetentionTabProps {
  data: AnalyticsData;
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function HiringRetentionTab({ data }: HiringRetentionTabProps) {
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnalyticsKPICard
          title="Contratações"
          value={data.hiresLast12Months}
          icon={UserPlus}
          description="Últimos 12 meses"
        />
        <AnalyticsKPICard
          title="Desligamentos"
          value={data.terminationsLast12Months}
          icon={UserMinus}
          description="Últimos 12 meses"
        />
        <AnalyticsKPICard
          title="Taxa de Turnover"
          value={`${data.turnoverRate.toFixed(1)}%`}
          icon={TrendingDown}
          description="Anual"
        />
      </div>

      {/* Workforce Stability Chart - Full Width */}
      <WorkforceStabilityChart data={data.monthlyData} />

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Hires vs Terminations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Contratações vs Desligamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    className="text-muted-foreground"
                  />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
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
                    dataKey="hires"
                    name="Contratações"
                    fill="hsl(142, 76%, 36%)"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="terminations"
                    name="Desligamentos"
                    fill="hsl(0, 84%, 60%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tenure Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Tempo de Casa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.tenureDistribution}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <XAxis type="number" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    dataKey="range"
                    type="category"
                    tick={{ fontSize: 12 }}
                    width={80}
                    axisLine={false}
                    tickLine={false}
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
                    radius={[0, 4, 4, 0]}
                  >
                    {data.tenureDistribution.map((_, index) => {
                      // Gradient from light to dark blue based on tenure (longer = darker)
                      const tenureColors = [
                        "hsl(var(--status-info) / 0.3)",  // < 1 ano - mais claro
                        "hsl(var(--status-info) / 0.5)",  // 1-2 anos
                        "hsl(var(--status-info) / 0.65)", // 2-3 anos
                        "hsl(var(--status-info) / 0.8)",  // 3-5 anos
                        "hsl(var(--status-info))",        // 5+ anos - mais escuro
                      ];
                      return (
                        <Cell
                          key={`tenure-${index}`}
                          fill={tenureColors[index] || "hsl(var(--primary))"}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Termination Reasons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Motivos de Desligamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {data.terminationReasons.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.terminationReasons}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="reason"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={120}
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
                      name="Quantidade"
                      fill="hsl(var(--chart-3))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem dados de desligamentos
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Termination Causes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Causas de Desligamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {data.terminationCauses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.terminationCauses}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      dataKey="cause"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={120}
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
                      name="Quantidade"
                      fill="hsl(var(--chart-4))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem dados de causas
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Termination Decision */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Decisão do Desligamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {data.terminationDecisions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.terminationDecisions}
                      dataKey="count"
                      nameKey="decision"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ decision, percent }) =>
                        `${decision}: ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.terminationDecisions.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "hsl(var(--chart-1))" : "hsl(var(--chart-5))"}
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
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Sem dados de decisões
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
