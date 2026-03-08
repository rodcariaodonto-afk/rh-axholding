import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mockRecruitmentMetrics } from "@/mocks/recruitmentData";
import type { RecruitmentMetrics, MonthlyRecruitmentData, DepartmentHiringData, PipelineByStage } from "@/types/recruitment";
import { format, subMonths, differenceInDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UseRecruitmentMetricsOptions {
  isDemoMode?: boolean;
  enabled?: boolean;
}

// Temporary type until Supabase types are regenerated
interface JobWithClosedAt {
  id: string;
  title: string;
  status: string;
  created_at: string;
  closed_at: string | null;
  department_id: string | null;
  departments: { id: string; name: string } | null;
}

interface ApplicationData {
  id: string;
  job_id: string;
  stage: string;
  applied_at: string;
  updated_at: string;
}

export const useRecruitmentMetrics = (options: UseRecruitmentMetricsOptions = {}) => {
  const { isDemoMode = false, enabled = true } = options;

  return useQuery({
    queryKey: ["recruitment-metrics", isDemoMode],
    enabled,
    staleTime: 5 * 60 * 1000, // 5 min — metrics don't need real-time refresh
    queryFn: async (): Promise<RecruitmentMetrics> => {
      if (isDemoMode) {
        return mockRecruitmentMetrics;
      }

      // Fetch jobs with closed_at
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          status,
          created_at,
          closed_at,
          department_id,
          departments (id, name)
        `);

      if (jobsError) throw jobsError;
      
      // Cast to our extended type
      const jobs = (jobsData || []) as unknown as JobWithClosedAt[];

      // Fetch all applications with stage info
      const { data: appsData, error: appsError } = await supabase
        .from("job_applications")
        .select(`
          id,
          job_id,
          stage,
          applied_at,
          updated_at
        `);

      if (appsError) throw appsError;
      
      const applications = (appsData || []) as ApplicationData[];

      // Calculate metrics
      const activeJobs = jobs.filter(j => j.status === "active");
      const closedJobs = jobs.filter(j => j.status === "closed");
      
      // Time to fill: average days from job creation to closed_at
      const closedJobsWithTime = closedJobs.filter(j => j.closed_at);
      const avgTimeToFill = closedJobsWithTime.length > 0
        ? Math.round(
            closedJobsWithTime.reduce((acc, job) => {
              const created = parseISO(job.created_at);
              const closed = parseISO(job.closed_at!);
              return acc + differenceInDays(closed, created);
            }, 0) / closedJobsWithTime.length
          )
        : 0;

      // Time to hire: average days from application to hired stage
      const hiredApps = applications.filter(a => a.stage === "contratado");
      const avgTimeToHire = hiredApps.length > 0
        ? Math.round(
            hiredApps.reduce((acc, app) => {
              const applied = parseISO(app.applied_at);
              const hired = parseISO(app.updated_at);
              return acc + differenceInDays(hired, applied);
            }, 0) / hiredApps.length
          )
        : 0;

      // Volume metrics
      const totalApplications = applications.length;
      const totalJobs = jobs.length || 1;
      const avgCandidatesPerJob = Math.round(totalApplications / totalJobs);

      // Pipeline by stage
      const pipelineByStage: PipelineByStage = {
        selecao: applications.filter(a => a.stage === "selecao").length,
        fit_cultural: applications.filter(a => a.stage === "fit_cultural").length,
        fit_tecnico: applications.filter(a => a.stage === "fit_tecnico").length,
        pre_admissao: applications.filter(a => a.stage === "pre_admissao").length,
        contratado: applications.filter(a => a.stage === "contratado").length,
        rejeitado: applications.filter(a => a.stage === "rejeitado").length,
        banco_talentos: applications.filter(a => a.stage === "banco_talentos").length,
      };

      // Funnel conversion rates
      const totalInSelecao = pipelineByStage.selecao + pipelineByStage.fit_cultural + 
        pipelineByStage.fit_tecnico + pipelineByStage.pre_admissao + pipelineByStage.contratado;
      const passedToInterview = pipelineByStage.fit_cultural + pipelineByStage.fit_tecnico + 
        pipelineByStage.pre_admissao + pipelineByStage.contratado;
      const receivedOffer = pipelineByStage.pre_admissao + pipelineByStage.contratado;

      const applicationToInterviewRate = totalInSelecao > 0 
        ? Math.round((passedToInterview / totalInSelecao) * 100) 
        : 0;
      const interviewToOfferRate = passedToInterview > 0 
        ? Math.round((receivedOffer / passedToInterview) * 100) 
        : 0;
      const offerAcceptanceRate = receivedOffer > 0 
        ? Math.round((pipelineByStage.contratado / receivedOffer) * 100) 
        : 0;

      // Monthly data (last 6 months)
      const monthlyData: MonthlyRecruitmentData[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthStr = format(monthDate, "MMM/yy", { locale: ptBR });
        const monthStart = format(monthDate, "yyyy-MM-01");
        const nextMonth = subMonths(monthDate, -1);
        const monthEnd = format(nextMonth, "yyyy-MM-01");

        const jobsOpened = jobs.filter(j => 
          j.created_at >= monthStart && j.created_at < monthEnd
        ).length;
        
        const jobsClosed = jobs.filter(j => 
          j.closed_at && j.closed_at >= monthStart && j.closed_at < monthEnd
        ).length;
        
        const monthApps = applications.filter(a => 
          a.applied_at >= monthStart && a.applied_at < monthEnd
        ).length;
        
        const hires = applications.filter(a => 
          a.stage === "contratado" && 
          a.updated_at >= monthStart && a.updated_at < monthEnd
        ).length;

        monthlyData.push({
          month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
          jobsOpened,
          jobsClosed,
          applications: monthApps,
          hires,
        });
      }

      // By department breakdown
      const departmentMap = new Map<string, DepartmentHiringData>();
      jobs.forEach(job => {
        const deptName = job.departments?.name || "Sem Departamento";
        if (!departmentMap.has(deptName)) {
          departmentMap.set(deptName, {
            department: deptName,
            activeJobs: 0,
            closedJobs: 0,
            totalApplications: 0,
            hires: 0,
          });
        }
        const data = departmentMap.get(deptName)!;
        if (job.status === "active") data.activeJobs++;
        if (job.status === "closed") data.closedJobs++;
        
        const jobApps = applications.filter(a => a.job_id === job.id);
        data.totalApplications += jobApps.length;
        data.hires += jobApps.filter(a => a.stage === "contratado").length;
      });

      return {
        avgTimeToFill,
        avgTimeToHire,
        totalActiveJobs: activeJobs.length,
        totalClosedJobs: closedJobs.length,
        totalApplications,
        avgCandidatesPerJob,
        applicationToInterviewRate,
        interviewToOfferRate,
        offerAcceptanceRate,
        pipelineByStage,
        monthlyData,
        hiringByDepartment: Array.from(departmentMap.values()),
      };
    },
  });
};
