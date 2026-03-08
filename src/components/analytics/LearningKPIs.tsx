import { Users, GraduationCap, Award, Percent, Clock, Star } from "lucide-react";
import { AnalyticsKPICard } from "./AnalyticsKPICard";
import type { TrainingAnalyticsData } from "@/hooks/useTrainingAnalytics";

interface LearningKPIsProps {
  data: TrainingAnalyticsData;
}

export function LearningKPIs({ data }: LearningKPIsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <AnalyticsKPICard
        title="Colaboradores Ativos"
        value={data.activeEmployees}
        icon={Users}
        iconColor="text-blue-600"
        iconBgColor="bg-blue-100"
        description="Total na base"
      />

      <AnalyticsKPICard
        title="Treinamentos Concluídos"
        value={data.totalTrainings}
        icon={GraduationCap}
        iconColor="text-emerald-600"
        iconBgColor="bg-emerald-100"
        description="No período"
      />

      <AnalyticsKPICard
        title="Certificados Emitidos"
        value={data.totalCertifications}
        icon={Award}
        iconColor="text-amber-600"
        iconBgColor="bg-amber-100"
        description="No período"
      />

      <AnalyticsKPICard
        title="Time Certificado"
        value={`${data.certifiedEmployeesPercentage.toFixed(1)}%`}
        icon={Percent}
        iconColor="text-purple-600"
        iconBgColor="bg-purple-100"
        description="Com ao menos 1 certificação"
      />

      <AnalyticsKPICard
        title="Horas de Capacitação"
        value={data.totalHours.toLocaleString("pt-BR")}
        icon={Clock}
        iconColor="text-cyan-600"
        iconBgColor="bg-cyan-100"
        description={`${data.avgHoursPerEmployee.toFixed(1)}h/pessoa`}
      />

      <AnalyticsKPICard
        title="Pontos de Carreira"
        value={data.totalCareerPoints.toLocaleString("pt-BR")}
        icon={Star}
        iconColor="text-orange-600"
        iconBgColor="bg-orange-100"
        description="Total acumulado"
      />
    </div>
  );
}
