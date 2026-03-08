import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Info, XCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TrainingAnalyticsData } from "@/hooks/useTrainingAnalytics";

interface LearningInsight {
  type: "warning" | "danger" | "success" | "info";
  title: string;
  description: string;
  department?: string;
}

function generateLearningInsights(data: TrainingAnalyticsData): LearningInsight[] {
  const insights: LearningInsight[] = [];
  const avgCertifiedPercentage = data.certifiedEmployeesPercentage;
  const avgTrainingsPerEmployee = data.activeEmployees > 0
    ? data.totalTrainings / data.activeEmployees
    : 0;

  // Check for departments below average (less than 70% of average)
  data.departmentStats
    .filter((d) => d.employeeCount >= 3 && d.certifiedPercentage < avgCertifiedPercentage * 0.7)
    .forEach((d) => {
      const gap = avgCertifiedPercentage - d.certifiedPercentage;
      insights.push({
        type: "warning",
        title: `${d.departmentName} abaixo da média`,
        description: `Com ${d.certifiedPercentage.toFixed(0)}% de certificação, está ${gap.toFixed(0)}% abaixo da média da empresa.`,
        department: d.departmentName,
      });
    });

  // Departments with standout performance (more than 130% of average)
  data.departmentStats
    .filter((d) => d.employeeCount >= 3 && d.certifiedPercentage > avgCertifiedPercentage * 1.3)
    .forEach((d) => {
      const lead = d.certifiedPercentage - avgCertifiedPercentage;
      insights.push({
        type: "success",
        title: `${d.departmentName} em destaque`,
        description: `Com ${d.certifiedPercentage.toFixed(0)}% de certificação, está ${lead.toFixed(0)}% acima da média da empresa.`,
        department: d.departmentName,
      });
    });

  // Departments without trainings
  data.departmentStats
    .filter((d) => d.trainingsCount === 0 && d.employeeCount >= 2)
    .forEach((d) => {
      insights.push({
        type: "danger",
        title: `${d.departmentName} sem treinamentos`,
        description: `Nenhum treinamento registrado para os ${d.employeeCount} colaboradores do departamento.`,
        department: d.departmentName,
      });
    });

  // Departments with low training per employee
  data.departmentStats
    .filter((d) => d.employeeCount >= 3 && d.avgTrainingsPerEmployee < avgTrainingsPerEmployee * 0.5)
    .forEach((d) => {
      if (!insights.some((i) => i.department === d.departmentName)) {
        insights.push({
          type: "warning",
          title: `${d.departmentName} com baixa participação`,
          description: `Média de ${d.avgTrainingsPerEmployee.toFixed(1)} treinamentos por colaborador, abaixo da média de ${avgTrainingsPerEmployee.toFixed(1)}.`,
          department: d.departmentName,
        });
      }
    });

  // General insights
  if (data.certifiedEmployeesPercentage < 50 && data.activeEmployees > 10) {
    insights.push({
      type: "info",
      title: "Oportunidade de melhoria",
      description: `Apenas ${data.certifiedEmployeesPercentage.toFixed(0)}% do time possui ao menos uma certificação. Considere programas de incentivo.`,
    });
  }

  if (data.certifiedEmployeesPercentage >= 70) {
    insights.push({
      type: "success",
      title: "Excelente taxa de certificação",
      description: `${data.certifiedEmployeesPercentage.toFixed(0)}% do time possui ao menos uma certificação. Continue incentivando!`,
    });
  }

  // Limit to 5 most relevant insights
  return insights.slice(0, 5);
}

function getInsightIcon(type: LearningInsight["type"]) {
  switch (type) {
    case "warning":
      return AlertTriangle;
    case "danger":
      return XCircle;
    case "success":
      return CheckCircle2;
    case "info":
      return Info;
  }
}

function getInsightStyles(type: LearningInsight["type"]) {
  switch (type) {
    case "warning":
      return {
        container: "border-amber-200 bg-amber-50/50",
        icon: "text-amber-600",
      };
    case "danger":
      return {
        container: "border-red-200 bg-red-50/50",
        icon: "text-red-600",
      };
    case "success":
      return {
        container: "border-emerald-200 bg-emerald-50/50",
        icon: "text-emerald-600",
      };
    case "info":
      return {
        container: "border-blue-200 bg-blue-50/50",
        icon: "text-blue-600",
      };
  }
}

interface LearningInsightsProps {
  data: TrainingAnalyticsData;
}

export function LearningInsights({ data }: LearningInsightsProps) {
  const insights = generateLearningInsights(data);

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-medium">
            <Lightbulb className="size-5 text-amber-500" />
            Insights Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Não há insights disponíveis para o período selecionado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <Lightbulb className="size-5 text-amber-500" />
          Insights Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const Icon = getInsightIcon(insight.type);
            const styles = getInsightStyles(insight.type);

            return (
              <div
                key={index}
                className={cn(
                  "flex gap-3 rounded-lg border p-3",
                  styles.container
                )}
              >
                <Icon className={cn("size-5 shrink-0 mt-0.5", styles.icon)} />
                <div>
                  <p className="font-medium text-sm">{insight.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {insight.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
