export interface RecruitmentMetrics {
  // Time metrics (in days)
  avgTimeToFill: number;
  avgTimeToHire: number;
  
  // Volume metrics
  totalActiveJobs: number;
  totalClosedJobs: number;
  totalApplications: number;
  avgCandidatesPerJob: number;
  
  // Funnel conversion rates (percentages)
  applicationToInterviewRate: number;
  interviewToOfferRate: number;
  offerAcceptanceRate: number;
  
  // Current pipeline by stage
  pipelineByStage: PipelineByStage;
  
  // Monthly historical data
  monthlyData: MonthlyRecruitmentData[];
  
  // By department breakdown
  hiringByDepartment: DepartmentHiringData[];
}

export interface PipelineByStage {
  selecao: number;
  fit_cultural: number;
  fit_tecnico: number;
  pre_admissao: number;
  contratado: number;
  rejeitado: number;
  banco_talentos: number;
}

export interface MonthlyRecruitmentData {
  month: string;
  jobsOpened: number;
  jobsClosed: number;
  applications: number;
  hires: number;
}

export interface DepartmentHiringData {
  department: string;
  activeJobs: number;
  closedJobs: number;
  totalApplications: number;
  hires: number;
}

export const STAGE_LABELS: Record<keyof PipelineByStage, string> = {
  selecao: "Seleção",
  fit_cultural: "Fit Cultural",
  fit_tecnico: "Fit Técnico",
  pre_admissao: "Pré-Admissão",
  contratado: "Contratado",
  rejeitado: "Rejeitado",
  banco_talentos: "Banco de Talentos",
};

export const STAGE_COLORS: Record<keyof PipelineByStage, string> = {
  selecao: "hsl(var(--chart-1))",
  fit_cultural: "hsl(var(--chart-2))",
  fit_tecnico: "hsl(var(--chart-3))",
  pre_admissao: "hsl(var(--chart-4))",
  contratado: "hsl(var(--chart-5))",
  rejeitado: "hsl(var(--muted-foreground))",
  banco_talentos: "hsl(var(--accent))",
};
