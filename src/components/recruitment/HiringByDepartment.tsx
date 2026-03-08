import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import type { DepartmentHiringData } from "@/types/recruitment";

interface HiringByDepartmentProps {
  data?: DepartmentHiringData[];
  isLoading?: boolean;
}

const chartConfig = {
  activeJobs: {
    label: "Vagas Ativas",
    color: "hsl(var(--chart-1))",
  },
  closedJobs: {
    label: "Vagas Fechadas",
    color: "hsl(var(--chart-2))",
  },
  hires: {
    label: "Contratações",
    color: "hsl(var(--chart-4))",
  },
};

const HiringByDepartment = ({ data, isLoading }: HiringByDepartmentProps) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contratações por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contratações por Departamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Sem dados de departamentos disponíveis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contratações por Departamento</CardTitle>
        <CardDescription>
          Distribuição de vagas e contratações por área
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="department" 
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
            <Bar 
              dataKey="activeJobs" 
              name="Vagas Ativas"
              fill="var(--color-activeJobs)" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="closedJobs" 
              name="Vagas Fechadas"
              fill="var(--color-closedJobs)" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="hires" 
              name="Contratações"
              fill="var(--color-hires)" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default HiringByDepartment;
