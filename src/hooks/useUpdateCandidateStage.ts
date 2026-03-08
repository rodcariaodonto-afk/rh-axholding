import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { CandidateStage } from "./useJobApplications";

export type { CandidateStage };

interface UpdateCandidateStageParams {
  candidateIds: string[];
  stage: CandidateStage;
  jobId: string;
}

const STAGE_LABELS: Record<CandidateStage, string> = {
  selecao: "Seleção",
  fit_cultural: "Fit Cultural",
  fit_tecnico: "Fit Técnico",
  pre_admissao: "Pré-admissão",
  banco_talentos: "Banco de Talentos",
  rejeitado: "Rejeitado",
  contratado: "Contratado",
};

export const useUpdateCandidateStage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ candidateIds, stage }: UpdateCandidateStageParams) => {
      const { error } = await supabase
        .from("job_applications")
        .update({ stage: stage as never })
        .in("id", candidateIds);

      if (error) {
        console.error("Error updating candidate stage:", error);
        throw error;
      }

      return { candidateIds, stage };
    },
    onSuccess: ({ candidateIds, stage }, { jobId }) => {
      queryClient.invalidateQueries({ queryKey: ["job-applications", jobId] });
      
      toast({
        title: "Candidatos atualizados",
        description: `${candidateIds.length} candidato(s) movido(s) para ${STAGE_LABELS[stage]}.`,
      });
    },
    onError: (error) => {
      console.error("Failed to update candidate stage:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível mover os candidatos. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};

export { STAGE_LABELS };
