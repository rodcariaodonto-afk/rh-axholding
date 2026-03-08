import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CompetencyResult } from "@/types/evaluation";
import { softSkills, hardSkillsByArea } from "@/constants/competencies";

interface EvaluationResults {
  competencies: CompetencyResult[];
  generalComments: Array<{
    evaluator_name: string;
    evaluator_relationship: 'manager' | 'peer' | 'direct_report' | 'self';
    comment: string;
  }>;
}

export function useEvaluationResults(cycleId: string | undefined) {
  return useQuery({
    queryKey: ["evaluation-results", cycleId],
    queryFn: async () => {
      if (!cycleId) return null;

      // Fetch all responses for this cycle for the current user (as evaluated)
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not authenticated");

      const { data: participants, error: pError } = await supabase
        .from("evaluation_participants")
        .select("id, evaluator_id, relationship, evaluator_data:evaluator_id(full_name)")
        .eq("cycle_id", cycleId)
        .eq("evaluated_id", auth.user.id);

      if (pError) throw pError;

      // Fetch responses and comments
      const { data: responses, error: rError } = await supabase
        .from("evaluation_responses")
        .select("*")
        .in("participant_id", participants?.map(p => p.id) || []);

      if (rError) throw rError;

      const { data: comments, error: cError } = await supabase
        .from("evaluation_general_comments")
        .select("*, participant_data:participant_id(evaluator_id, relationship, evaluator_info:evaluator_id(full_name))")
        .in("participant_id", participants?.map(p => p.id) || []);

      if (cError) throw cError;

      // Helper to lookup competency name from constants
      const allHardSkills = hardSkillsByArea.flatMap(area => area.skills);
      const getCompetencyName = (id: string, type: string): string => {
        if (type === 'soft_skill') {
          return softSkills.find(s => s.id === id)?.name || id;
        }
        return allHardSkills.find(s => s.id === id)?.name || id;
      };

      // Group responses by competency
      const competencyMap = new Map<string, CompetencyResult>();

      responses?.forEach(response => {
        const key = `${response.competency_type}-${response.competency_id}`;
        if (!competencyMap.has(key)) {
          competencyMap.set(key, {
            competency_id: response.competency_id,
            competency_name: getCompetencyName(response.competency_id, response.competency_type),
            competency_type: response.competency_type as 'hard_skill' | 'soft_skill',
            average: 0,
            responses: [],
          });
        }

        const competency = competencyMap.get(key)!;
        const participant = participants?.find(p => p.id === response.participant_id);

        if (participant) {
          competency.responses.push({
            evaluator_name: (participant as any).evaluator_data?.full_name || "Desconhecido",
            evaluator_relationship: participant.relationship as any,
            score: response.score,
            comment: response.comment,
          });

          competency.average = competency.responses.reduce((sum, r) => sum + r.score, 0) / competency.responses.length;
        }
      });

      // Format comments
      const generalComments = (comments as any[])?.map(comment => ({
        evaluator_name: comment.participant_data?.evaluator_info?.full_name || "Desconhecido",
        evaluator_relationship: comment.participant_data?.relationship,
        comment: comment.comment,
      })) || [];

      return {
        competencies: Array.from(competencyMap.values()),
        generalComments,
      } as EvaluationResults;
    },
    enabled: !!cycleId,
  });
}
