import { useState, useMemo } from "react";
import { startOfYear, endOfYear } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrainingAnalytics } from "@/hooks/useTrainingAnalytics";
import { LearningFilters } from "./LearningFilters";
import { LearningKPIs } from "./LearningKPIs";
import { LearningCharts } from "./LearningCharts";
import { DepartmentRanking } from "./DepartmentRanking";
import { LearningInsights } from "./LearningInsights";

interface LearningTabProps {
  isDemoMode?: boolean;
}

export function LearningTab({ isDemoMode = false }: LearningTabProps) {
  const currentYear = new Date().getFullYear();
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number>(currentYear);

  const dateRange = useMemo(() => {
    const start = startOfYear(new Date(yearFilter, 0, 1));
    const end = endOfYear(new Date(yearFilter, 0, 1));
    return { start, end };
  }, [yearFilter]);

  const { data, isLoading } = useTrainingAnalytics({
    departmentId: departmentFilter,
    startDate: dateRange.start,
    endDate: dateRange.end,
    isDemoMode,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[400px]" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[350px] lg:col-span-2" />
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">
          Não foi possível carregar os dados de treinamentos.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <LearningFilters
        departmentId={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        year={yearFilter}
        onYearChange={setYearFilter}
      />

      {/* KPIs */}
      <LearningKPIs data={data} />

      {/* Charts */}
      <LearningCharts data={data} />

      {/* Ranking + Insights */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DepartmentRanking ranking={data.departmentRanking} />
        <LearningInsights data={data} />
      </div>
    </div>
  );
}
