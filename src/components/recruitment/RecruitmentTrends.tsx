import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import type { MonthlyRecruitmentData } from "@/types/recruitment";

interface RecruitmentTrendsProps {
  monthlyData?: MonthlyRecruitmentData[];
  isLoading?: boolean;
}

const chartConfig = {
  jobsOpened: {
    label: "Vagas Abertas",
    color: "hsl(var(--chart-1))",
  },
  jobsClosed: {
    label: "Vagas Fechadas",
    color: "hsl(var(--chart-2))",
  },
  applications: {
    label: "Candidaturas",
    color: "hsl(var(--chart-3))",
  },
  hires: {
    label: "Contratações",
    color: "hsl(var(--chart-4))",
  },
};

const RecruitmentTrends = ({ monthlyData, isLoading }: RecruitmentTrendsProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!monthlyData || monthlyData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Sem dados suficientes para exibir tendências
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução Mensal</CardTitle>
        <CardDescription>
          Vagas, candidaturas e contratações nos últimos 6 meses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="jobsOpened"
              name="Vagas Abertas"
              stroke="var(--color-jobsOpened)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="jobsClosed"
              name="Vagas Fechadas"
              stroke="var(--color-jobsClosed)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="hires"
              name="Contratações"
              stroke="var(--color-hires)"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default RecruitmentTrends;
