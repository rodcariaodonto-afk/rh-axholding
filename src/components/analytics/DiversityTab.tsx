import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsKPICard } from "./AnalyticsKPICard";
import { AgePyramidChart } from "./AgePyramidChart";
import { GenderByDepartmentChart } from "./GenderByDepartmentChart";
import { EducationChart } from "./EducationChart";
import { AnalyticsData } from "@/hooks/useAnalyticsData";
import { Users, Palette, Calendar } from "lucide-react";
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

interface DiversityTabProps {
  data: AnalyticsData;
}

const GENDER_COLORS = {
  Masculino: "hsl(217, 91%, 60%)",
  Feminino: "hsl(330, 81%, 60%)",
  "Não-binário": "hsl(262, 83%, 58%)",
  "Prefere não dizer": "hsl(0, 0%, 45%)",
  "Não informado": "hsl(0, 0%, 65%)",
};

const ETHNICITY_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(0, 0%, 45%)",
];

export function DiversityTab({ data }: DiversityTabProps) {
  // Calculate diversity index (simple calculation based on ethnicity spread)
  const ethnicityCount = data.ethnicityDistribution.filter(
    (e) => e.ethnicity !== "Não informado"
  ).length;
  const diversityIndex = Math.min(ethnicityCount * 20, 100);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <AnalyticsKPICard
          title="Representação Feminina"
          value={`${data.femalePercentage.toFixed(1)}%`}
          icon={Users}
          description="Do total de colaboradores"
        />
        <AnalyticsKPICard
          title="Índice de Diversidade"
          value={`${diversityIndex}%`}
          icon={Palette}
          description="Baseado em etnia declarada"
        />
        <AnalyticsKPICard
          title="Idade Média"
          value={data.avgAge > 0 ? `${data.avgAge.toFixed(0)} anos` : "N/A"}
          icon={Calendar}
          description="Colaboradores ativos"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Distribuição por Gênero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.genderDistribution}
                    dataKey="count"
                    nameKey="gender"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    label={({ gender, percent }) =>
                      `${gender}: ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {data.genderDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          GENDER_COLORS[entry.gender as keyof typeof GENDER_COLORS] ||
                          ETHNICITY_COLORS[index % ETHNICITY_COLORS.length]
                        }
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
            </div>
          </CardContent>
        </Card>

        {/* Ethnicity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Diversidade Étnica
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.ethnicityDistribution}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    dataKey="ethnicity"
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
                  <Bar dataKey="count" name="Colaboradores" radius={[0, 4, 4, 0]}>
                    {data.ethnicityDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={ETHNICITY_COLORS[index % ETHNICITY_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Age Pyramid */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Pirâmide Etária por Gênero
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AgePyramidChart data={data.ageDistribution} />
          </CardContent>
        </Card>

        {/* Gender by Department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Gênero por Departamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GenderByDepartmentChart data={data.genderByDepartment} />
          </CardContent>
        </Card>
      </div>

      {/* Education Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            Formação Acadêmica
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Qual é o nível de escolaridade da nossa força de trabalho?
          </p>
        </CardHeader>
        <CardContent>
          <EducationChart data={data.educationDistribution} />
        </CardContent>
      </Card>
    </div>
  );
}
