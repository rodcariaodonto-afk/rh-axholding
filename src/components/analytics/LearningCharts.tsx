import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import type { TrainingAnalyticsData } from "@/hooks/useTrainingAnalytics";

interface LearningChartsProps {
  data: TrainingAnalyticsData;
}

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

const chartConfig = {
  trainings: {
    label: "Treinamentos",
    color: "hsl(var(--chart-1))",
  },
  certifications: {
    label: "Certificações",
    color: "hsl(var(--chart-2))",
  },
  hours: {
    label: "Horas",
    color: "hsl(var(--chart-3))",
  },
};

export function LearningCharts({ data }: LearningChartsProps) {
  // Prepare bar chart data - sorted by certifications
  const certificationsByDept = [...data.departmentStats]
    .sort((a, b) => b.certificationsCount - a.certificationsCount)
    .slice(0, 7);

  const hoursByDept = [...data.departmentStats]
    .sort((a, b) => b.totalHours - a.totalHours)
    .slice(0, 7);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Monthly Evolution Bar Chart */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Evolução Mensal de Treinamentos e Certificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={data.monthlyEvolution}>
              <CartesianGrid vertical={false} className="stroke-muted" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="trainings"
                fill="var(--chart-1)"
                radius={4}
                name="Treinamentos"
              />
              <Bar
                dataKey="certifications"
                fill="var(--chart-2)"
                radius={4}
                name="Certificações"
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Certifications by Department */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Certificados por Departamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              data={certificationsByDept}
              layout="vertical"
              margin={{ left: 0, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="departmentName"
                type="category"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="certificationsCount"
                radius={[0, 4, 4, 0]}
                name="Certificações"
              >
                {certificationsByDept.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Hours by Department */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Horas de Capacitação por Departamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[280px] w-full">
            <BarChart
              data={hoursByDept}
              layout="vertical"
              margin={{ left: 0, right: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="departmentName"
                type="category"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                width={100}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="totalHours"
                radius={[0, 4, 4, 0]}
                name="Horas"
              >
                {hoursByDept.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
