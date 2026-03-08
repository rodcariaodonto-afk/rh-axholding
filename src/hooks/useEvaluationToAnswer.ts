import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MyPendingEvaluation, ScaleLabelType } from "@/types/evaluation";
import { softSkills } from "@/constants/competencies";
import { scaleLabelsMap } from "@/types/evaluation";

export function useEvaluationToAnswer(cycleId: string | undefined, participantId: string | undefined) {
  const { data: cycle } = useQuery({
    queryKey: ["evaluation-cycle", cycleId],
    queryFn: async () => {
      if (!cycleId) return null;
      
      const { data, error } = await supabase
        .from("evaluation_cycles")
        .select("*")
        .eq("id", cycleId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!cycleId,
  });

  const { data: participant } = useQuery({
    queryKey: ["evaluation-participant", participantId],
    queryFn: async () => {
      if (!participantId) return null;
      
      const { data, error } = await supabase
        .from("evaluation_participants")
        .select("*, evaluator_data:evaluator_id(full_name, photo_url, position_level_detail), evaluated_data:evaluated_id(full_name, photo_url, position_level_detail)")
        .eq("id", participantId)
        .single();
      
      if (error) throw error;
      return data as any;
    },
    enabled: !!participantId,
  });

  const evaluation: MyPendingEvaluation | null = cycle && participant ? {
    participant_id: participant.id,
    cycle_id: cycle.id,
    cycle_name: cycle.name,
    cycle_end_date: cycle.end_date,
    evaluated_id: participant.evaluated_id,
    evaluated_name: participant.evaluated_data?.full_name || "Desconhecido",
    evaluated_photo: participant.evaluated_data?.photo_url,
    evaluated_position: participant.evaluated_data?.position_level_detail,
    relationship: participant.relationship as "manager" | "peer" | "self" | "direct_report",
    status: participant.status,
    scale_levels: (cycle.scale_levels as 4 | 5),
    scale_labels: cycle.scale_label_type === 'custom' && cycle.custom_labels && Array.isArray(cycle.custom_labels)
      ? (cycle.custom_labels as string[])
      : scaleLabelsMap[cycle.scale_label_type as ScaleLabelType][cycle.scale_levels === 4 ? 'labels4' : 'labels5'],
    require_comments: cycle.require_competency_comments ?? false,
    require_general_comments: cycle.require_general_comments ?? false,
  } : null;

  return { data: evaluation, isLoading: !cycle || !participant, organizationId: cycle?.organization_id };
}
