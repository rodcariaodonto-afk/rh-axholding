import type { RecruitmentMetrics } from "@/types/recruitment";

export const mockRecruitmentMetrics: RecruitmentMetrics = {
  // Time metrics - realistic values based on SHRM benchmarks
  avgTimeToFill: 32, // 32 days (benchmark: 42 days)
  avgTimeToHire: 18, // 18 days from application to hire
  
  // Volume metrics
  totalActiveJobs: 4,
  totalClosedJobs: 12,
  totalApplications: 156,
  avgCandidatesPerJob: 13,
  
  // Funnel conversion rates
  applicationToInterviewRate: 42, // 42% pass to interview
  interviewToOfferRate: 28,       // 28% receive offer
  offerAcceptanceRate: 85,        // 85% accept

  // Current pipeline by stage
  pipelineByStage: {
    selecao: 45,
    fit_cultural: 28,
    fit_tecnico: 18,
    pre_admissao: 8,
    contratado: 12,
    rejeitado: 35,
    banco_talentos: 10,
  },

  // Monthly historical data (last 6 months)
  monthlyData: [
    { month: "Ago/25", jobsOpened: 3, jobsClosed: 2, applications: 28, hires: 2 },
    { month: "Set/25", jobsOpened: 2, jobsClosed: 1, applications: 22, hires: 1 },
    { month: "Out/25", jobsOpened: 4, jobsClosed: 3, applications: 35, hires: 3 },
    { month: "Nov/25", jobsOpened: 2, jobsClosed: 2, applications: 24, hires: 2 },
    { month: "Dez/25", jobsOpened: 1, jobsClosed: 2, applications: 18, hires: 2 },
    { month: "Jan/26", jobsOpened: 3, jobsClosed: 2, applications: 29, hires: 2 },
  ],

  // By department breakdown
  hiringByDepartment: [
    { department: "Tecnologia", activeJobs: 2, closedJobs: 6, totalApplications: 78, hires: 6 },
    { department: "Produto", activeJobs: 1, closedJobs: 3, totalApplications: 42, hires: 3 },
    { department: "Design", activeJobs: 1, closedJobs: 2, totalApplications: 24, hires: 2 },
    { department: "RH", activeJobs: 0, closedJobs: 1, totalApplications: 12, hires: 1 },
  ],
};
