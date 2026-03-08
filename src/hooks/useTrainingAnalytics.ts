import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDepartments } from "./useDepartments";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { mockTrainingAnalyticsData } from "@/mocks/trainingAnalyticsData";

export interface MonthlyEvolution {
  month: string;
  trainings: number;
  certifications: number;
  hours: number;
}

export interface DepartmentStat {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  trainingsCount: number;
  certificationsCount: number;
  certifiedEmployees: number;
  certifiedPercentage: number;
  avgTrainingsPerEmployee: number;
  totalHours: number;
}

export interface DepartmentRankingItem {
  position: number;
  departmentId: string;
  departmentName: string;
  certifiedPercentage: number;
  avgTrainingsPerEmployee: number;
  score: number;
}

export interface TrainingAnalyticsData {
  // KPIs
  activeEmployees: number;
  totalTrainings: number;
  totalCertifications: number;
  certifiedEmployeesPercentage: number;
  totalHours: number;
  avgHoursPerEmployee: number;
  totalCareerPoints: number;

  // Monthly evolution (12 months)
  monthlyEvolution: MonthlyEvolution[];

  // Per department
  departmentStats: DepartmentStat[];

  // Calculated ranking
  departmentRanking: DepartmentRankingItem[];

  // Distribution by type
  trainingTypeDistribution: { type: string; count: number }[];

  // Distribution by sponsor
  sponsorDistribution: { sponsor: string; count: number }[];
}

interface UseTrainingAnalyticsOptions {
  departmentId?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  isDemoMode?: boolean;
}

export function useTrainingAnalytics(options: UseTrainingAnalyticsOptions = {}) {
  const { departmentId, startDate, endDate, isDemoMode = false } = options;
  const { data: departments } = useDepartments();

  return useQuery({
    queryKey: ["training-analytics", departmentId, startDate?.toISOString(), endDate?.toISOString(), isDemoMode],
    queryFn: async (): Promise<TrainingAnalyticsData> => {
      if (isDemoMode) {
        // Filter mock data if department is selected
        if (departmentId) {
          const filteredStats = mockTrainingAnalyticsData.departmentStats.filter(
            d => d.departmentId === departmentId
          );
          const filteredRanking = mockTrainingAnalyticsData.departmentRanking.filter(
            d => d.departmentId === departmentId
          );
          
          const totalTrainings = filteredStats.reduce((sum, d) => sum + d.trainingsCount, 0);
          const totalCertifications = filteredStats.reduce((sum, d) => sum + d.certificationsCount, 0);
          const totalEmployees = filteredStats.reduce((sum, d) => sum + d.employeeCount, 0);
          const certifiedEmployees = filteredStats.reduce((sum, d) => sum + d.certifiedEmployees, 0);
          const totalHours = filteredStats.reduce((sum, d) => sum + d.totalHours, 0);

          return {
            ...mockTrainingAnalyticsData,
            activeEmployees: totalEmployees,
            totalTrainings,
            totalCertifications,
            certifiedEmployeesPercentage: totalEmployees > 0 ? (certifiedEmployees / totalEmployees) * 100 : 0,
            totalHours,
            avgHoursPerEmployee: totalEmployees > 0 ? totalHours / totalEmployees : 0,
            departmentStats: filteredStats,
            departmentRanking: filteredRanking,
          };
        }
        return mockTrainingAnalyticsData;
      }

      // Build date filter
      const dateFilter = {
        start: startDate || subMonths(new Date(), 12),
        end: endDate || new Date(),
      };

      // Fetch active employees with department info
      let employeesQuery = supabase
        .from("employees")
        .select("id, department_id, status")
        .eq("status", "active");

      if (departmentId) {
        employeesQuery = employeesQuery.eq("department_id", departmentId);
      }

      const { data: employees, error: employeesError } = await employeesQuery;
      if (employeesError) throw employeesError;

      const employeeIds = employees?.map(e => e.id) || [];

      // Fetch trainings within date range
      let trainingsQuery = supabase
        .from("employee_trainings" as any)
        .select("*")
        .gte("completion_date", dateFilter.start.toISOString().split("T")[0])
        .lte("completion_date", dateFilter.end.toISOString().split("T")[0]);

      if (employeeIds.length > 0) {
        trainingsQuery = trainingsQuery.in("employee_id", employeeIds);
      }

      const { data: trainings, error: trainingsError } = await trainingsQuery;
      if (trainingsError) throw trainingsError;

      const trainingsData = (trainings || []) as any[];

      // Calculate KPIs
      const activeEmployees = employees?.length || 0;
      const totalTrainings = trainingsData.filter(t => t.training_type === "treinamento").length;
      const totalCertifications = trainingsData.filter(t => t.training_type === "certificacao").length;
      const totalHours = trainingsData.reduce((sum, t) => sum + (t.hours || 0), 0);
      const totalCareerPoints = trainingsData.reduce((sum, t) => sum + (t.career_points || 0), 0);

      // Employees with at least one certification
      const employeesWithCertification = new Set(
        trainingsData.filter(t => t.training_type === "certificacao").map(t => t.employee_id)
      ).size;
      const certifiedEmployeesPercentage = activeEmployees > 0
        ? (employeesWithCertification / activeEmployees) * 100
        : 0;

      // Monthly evolution (last 12 months)
      const monthlyEvolution: MonthlyEvolution[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthLabel = format(monthDate, "MMM/yy", { locale: ptBR });

        const monthTrainings = trainingsData.filter(t => {
          const completionDate = parseISO(t.completion_date);
          return completionDate >= monthStart && completionDate <= monthEnd;
        });

        monthlyEvolution.push({
          month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
          trainings: monthTrainings.filter(t => t.training_type === "treinamento").length,
          certifications: monthTrainings.filter(t => t.training_type === "certificacao").length,
          hours: monthTrainings.reduce((sum, t) => sum + (t.hours || 0), 0),
        });
      }

      // Department stats
      const departmentMap = new Map<string, DepartmentStat>();
      const deptList = departments || [];

      for (const dept of deptList) {
        if (departmentId && dept.id !== departmentId) continue;

        const deptEmployees = employees?.filter(e => e.department_id === dept.id) || [];
        const deptEmployeeIds = deptEmployees.map(e => e.id);
        const deptTrainings = trainingsData.filter(t => deptEmployeeIds.includes(t.employee_id));

        const trainingsCount = deptTrainings.filter(t => t.training_type === "treinamento").length;
        const certificationsCount = deptTrainings.filter(t => t.training_type === "certificacao").length;
        const certifiedEmployees = new Set(
          deptTrainings.filter(t => t.training_type === "certificacao").map(t => t.employee_id)
        ).size;
        const totalDeptHours = deptTrainings.reduce((sum, t) => sum + (t.hours || 0), 0);

        departmentMap.set(dept.id, {
          departmentId: dept.id,
          departmentName: dept.name,
          employeeCount: deptEmployees.length,
          trainingsCount,
          certificationsCount,
          certifiedEmployees,
          certifiedPercentage: deptEmployees.length > 0 ? (certifiedEmployees / deptEmployees.length) * 100 : 0,
          avgTrainingsPerEmployee: deptEmployees.length > 0 ? trainingsCount / deptEmployees.length : 0,
          totalHours: totalDeptHours,
        });
      }

      const departmentStats = Array.from(departmentMap.values());

      // Calculate ranking
      const departmentRanking: DepartmentRankingItem[] = departmentStats
        .map(d => ({
          departmentId: d.departmentId,
          departmentName: d.departmentName,
          certifiedPercentage: d.certifiedPercentage,
          avgTrainingsPerEmployee: d.avgTrainingsPerEmployee,
          score: (d.certifiedPercentage * 0.5) + (d.avgTrainingsPerEmployee * 10 * 0.5),
          position: 0,
        }))
        .sort((a, b) => b.score - a.score)
        .map((item, index) => ({ ...item, position: index + 1 }));

      // Type distribution
      const trainingTypeDistribution = [
        { type: "Treinamento", count: totalTrainings },
        { type: "Certificação", count: totalCertifications },
      ];

      // Sponsor distribution
      const empresaCount = trainingsData.filter(t => t.sponsor === "empresa").length;
      const colaboradorCount = trainingsData.filter(t => t.sponsor === "colaborador").length;
      const sponsorDistribution = [
        { sponsor: "Empresa", count: empresaCount },
        { sponsor: "Colaborador", count: colaboradorCount },
      ];

      return {
        activeEmployees,
        totalTrainings,
        totalCertifications,
        certifiedEmployeesPercentage,
        totalHours,
        avgHoursPerEmployee: activeEmployees > 0 ? totalHours / activeEmployees : 0,
        totalCareerPoints,
        monthlyEvolution,
        departmentStats,
        departmentRanking,
        trainingTypeDistribution,
        sponsorDistribution,
      };
    },
    enabled: isDemoMode || !!departments,
  });
}
