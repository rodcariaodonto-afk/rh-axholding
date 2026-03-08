import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { JobApplication } from "@/hooks/useJobApplications";

interface RetryAIAnalysisData {
  candidate: JobApplication;
  jobData?: {
    title?: string;
    description?: string | null;
    requirements?: string | null;
    position?: { title: string } | null;
    department?: { name: string } | null;
  };
}

export const useRetryAIAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ candidate, jobData }: RetryAIAnalysisData) => {
      // Mark as pending before invoking
      const { error: updateError } = await supabase
        .from("job_applications")
        .update({ ai_analysis_status: 'pending' as const })
        .eq("id", candidate.id);

      if (updateError) {
        console.error("Failed to set pending status:", updateError);
      }

      // Invalidate to show pending state immediately
      queryClient.invalidateQueries({ queryKey: ["job-applications", candidate.job_id] });

      // Use supabase.functions.invoke to automatically include auth headers
      const { data, error } = await supabase.functions.invoke("analyze-candidate", {
        body: {
          candidateEmail: candidate.candidate_email,
          jobId: candidate.job_id,
          jobData: jobData,
          candidateData: {
            candidate_name: candidate.candidate_name,
            candidate_email: candidate.candidate_email,
            candidate_birth_date: candidate.candidate_birth_date,
          },
          profilerResult: candidate.profiler_result_detail,
          resumeUrl: candidate.resume_url,
          desiredPosition: candidate.desired_position,
          desiredSeniority: candidate.desired_seniority,
        },
      });

      if (error) {
        console.error("AI analysis error:", error);
        // Mark as error on invoke failure
        await supabase
          .from("job_applications")
          .update({ ai_analysis_status: 'error' as const })
          .eq("id", candidate.id);
        throw new Error(error.message || "Falha na análise de IA");
      }

      return data;
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Análise de IA concluída",
        description: data.nota_aderencia 
          ? `Nota de aderência: ${data.nota_aderencia}/100`
          : "Relatório gerado com sucesso.",
      });
      
      // Invalidate job applications query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["job-applications", variables.candidate.job_id] });
    },
    onError: (error: Error) => {
      console.error("Error retrying AI analysis:", error);
      toast({
        title: "Erro na análise de IA",
        description: "Não foi possível realizar a análise. Verifique suas permissões.",
        variant: "destructive",
      });
    },
  });
};
