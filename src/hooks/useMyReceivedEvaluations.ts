import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MyReceivedEvaluation, EvaluationRelationship } from "@/types/evaluation";
import { useAuth } from "@/hooks/useAuth";

export function useMyReceivedEvaluations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-received-evaluations", user?.id],
    queryFn: async (): Promise<MyReceivedEvaluation[]> => {
      if (!user?.id) return [];

      // Get all participants where current user is the evaluated
      const { data: participants, error: participantsError } = await supabase
        .from("evaluation_participants")
        .select(`
          id,
          cycle_id,
          evaluator_id,
          relationship,
          status
        `)
        .eq("evaluated_id", user.id)
        .eq("status", "completed");

      if (participantsError) throw participantsError;
      if (!participants?.length) return [];

      // Get unique cycle IDs
      const cycleIds = [...new Set(participants.map(p => p.cycle_id))];

      // Fetch completed cycles
      const { data: cycles, error: cyclesError } = await supabase
        .from("evaluation_cycles")
        .select("*")
        .in("id", cycleIds)
        .eq("status", "completed");

      if (cyclesError) throw cyclesError;
      if (!cycles?.length) return [];

      // Fetch responses for these participants
      const participantIds = participants.map(p => p.id);
      const { data: responses, error: responsesError } = await supabase
        .from("evaluation_responses")
        .select("participant_id, score")
        .in("participant_id", participantIds);

      if (responsesError) throw responsesError;

      // Build results
      const results: MyReceivedEvaluation[] = [];

      for (const cycle of cycles) {
        const cycleParticipants = participants.filter(p => p.cycle_id === cycle.id);
        
        const byRelationship: MyReceivedEvaluation["by_relationship"] = {
          manager: { average: 0, count: 0 },
          peer: { average: 0, count: 0 },
          direct_report: { average: 0, count: 0 },
          self: { average: null, count: 0 },
        };

        let totalScore = 0;
        let totalResponses = 0;

        for (const participant of cycleParticipants) {
          const participantResponses = responses?.filter(r => r.participant_id === participant.id) || [];
          if (participantResponses.length === 0) continue;

          const avgScore = participantResponses.reduce((sum, r) => sum + r.score, 0) / participantResponses.length;
          const relationship = participant.relationship as EvaluationRelationship;

          if (relationship === 'self') {
            byRelationship.self.average = avgScore;
            byRelationship.self.count = 1;
            // Only include self in average if cycle setting allows
            if (cycle.include_self_in_average) {
              totalScore += avgScore;
              totalResponses++;
            }
          } else {
            const rel = byRelationship[relationship];
            rel.average = ((rel.average * rel.count) + avgScore) / (rel.count + 1);
            rel.count++;
            totalScore += avgScore;
            totalResponses++;
          }
        }

        const overallAverage = totalResponses > 0 ? totalScore / totalResponses : 0;

        results.push({
          cycle_id: cycle.id,
          cycle_name: cycle.name,
          cycle_start_date: cycle.start_date,
          cycle_end_date: cycle.end_date,
          overall_average: overallAverage,
          total_evaluators: cycleParticipants.length,
          by_relationship: byRelationship,
        });
      }

      return results;
    },
    enabled: !!user?.id,
  });
}
