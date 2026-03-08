import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getMockCandidates } from "@/mocks/candidatesData";

export type CandidateStage = "selecao" | "fit_cultural" | "fit_tecnico" | "pre_admissao" | "banco_talentos" | "rejeitado" | "contratado";

export type AIAnalysisStatus = 
  | 'not_requested' 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'error';

export interface JobApplication {
  id: string;
  job_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_birth_date: string | null;
  resume_url: string | null;
  status: string;
  stage: CandidateStage;
  notes: string | null;
  profiler_result_code: string | null;
  profiler_result_detail: Record<string, unknown> | null;
  profiler_completed_at: string | null;
  ai_score: number | null;
  ai_report: string | null;
  ai_analysis_status: AIAnalysisStatus | null;
  applied_at: string;
  updated_at: string;
  // Demographic fields
  candidate_state: string | null;
  candidate_city: string | null;
  candidate_phone: string | null;
  candidate_race: string | null;
  candidate_gender: string | null;
  candidate_sexual_orientation: string | null;
  candidate_pcd: boolean | null;
  candidate_pcd_type: string | null;
  // Talent bank fields
  desired_position: string | null;
  desired_seniority: string | null;
}

interface UseJobApplicationsOptions {
  isDemoMode?: boolean;
}

export const useJobApplications = (jobId: string, options: UseJobApplicationsOptions = {}) => {
  const { isDemoMode = false } = options;

  return useQuery({
    queryKey: ["job-applications", jobId, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return getMockCandidates(jobId);
      }

      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("job_id", jobId)
        .order("applied_at", { ascending: false });

      if (error) throw error;
      return data as JobApplication[];
    },
    enabled: !!jobId,
  });
};
