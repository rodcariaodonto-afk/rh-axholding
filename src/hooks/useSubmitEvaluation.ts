import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EvaluationCompetencyResponse } from "@/types/evaluation";
import { toast } from "@/hooks/use-toast";

interface UseSubmitEvaluationProps {
  participantId: string;
  onSuccess?: () => void;
}

export function useSubmitEvaluation({ participantId, onSuccess }: UseSubmitEvaluationProps) {
  const queryClient = useQueryClient();

  const saveDraft = useMutation({
    mutationFn: async ({
      responses,
      generalComment,
    }: {
      responses: EvaluationCompetencyResponse[];
      generalComment: string;
    }) => {
      // Save responses (upsert)
      for (const response of responses) {
        if (response.score === null) continue;

        const { error } = await supabase
          .from("evaluation_responses")
          .upsert({
            participant_id: participantId,
            competency_type: response.competency_type,
            competency_id: response.competency_id,
            score: response.score,
            comment: response.comment || null,
          }, { onConflict: 'participant_id,competency_type,competency_id' });

        if (error) throw error;
      }

      return responses;
    },
    onSuccess: () => {
      toast({
        title: "Rascunho salvo",
        description: "Sua avaliação foi salva. Você pode continuar depois.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitEvaluation = useMutation({
    mutationFn: async ({
      responses,
      generalComment,
    }: {
      responses: EvaluationCompetencyResponse[];
      generalComment: string;
    }) => {
      // Save responses first
      for (const response of responses) {
        if (response.score === null) continue;

        const { error } = await supabase
          .from("evaluation_responses")
          .upsert({
            participant_id: participantId,
            competency_type: response.competency_type,
            competency_id: response.competency_id,
            score: response.score,
            comment: response.comment || null,
          }, { onConflict: 'participant_id,competency_type,competency_id' });

        if (error) throw error;
      }

      // Save general comment
      if (generalComment.trim()) {
        const { error } = await supabase
          .from("evaluation_general_comments")
          .upsert({
            participant_id: participantId,
            comment: generalComment,
          }, { onConflict: 'participant_id' });

        if (error) throw error;
      }

      // Update participant status to completed
      const { error: statusError } = await supabase
        .from("evaluation_participants")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", participantId);

      if (statusError) throw statusError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-participant"] });
      queryClient.invalidateQueries({ queryKey: ["evaluation-pending"] });
      queryClient.invalidateQueries({ queryKey: ["my-pending-evaluations"] });

      toast({
        title: "Avaliação enviada!",
        description: "Sua avaliação foi enviada com sucesso.",
      });

      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    saveDraft: saveDraft.mutateAsync,
    submitEvaluation: submitEvaluation.mutateAsync,
    isSubmitting: submitEvaluation.isPending,
    isSaving: saveDraft.isPending,
  };
}
