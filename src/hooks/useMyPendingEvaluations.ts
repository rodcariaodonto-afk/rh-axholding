import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MyPendingEvaluation, EvaluationParticipantStatus } from "@/types/evaluation";
import { useAuth } from "@/hooks/useAuth";
import { getScaleLabels } from "@/types/evaluation";

interface GroupedPendingEvaluations {
  cycle_id: string;
  cycle_name: string;
  cycle_end_date: string;
  evaluations: MyPendingEvaluation[];
  completed_count: number;
  total_count: number;
}

export function useMyPendingEvaluations() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-pending-evaluations", user?.id],
    queryFn: async (): Promise<GroupedPendingEvaluations[]> => {
      if (!user?.id) return [];

      // Get all participants where current user is the evaluator
      const { data: participants, error: participantsError } = await supabase
        .from("evaluation_participants")
        .select(`
          id,
          cycle_id,
          evaluated_id,
          relationship,
          status,
          completed_at
        `)
        .eq("evaluator_id", user.id)
        .in("status", ["pending", "in_progress", "completed"]);

      if (participantsError) throw participantsError;
      if (!participants?.length) return [];

      // Get unique cycle IDs
      const cycleIds = [...new Set(participants.map(p => p.cycle_id))];

      // Fetch cycles
      const { data: cycles, error: cyclesError } = await supabase
        .from("evaluation_cycles")
        .select("*")
        .in("id", cycleIds)
        .eq("status", "active");

      if (cyclesError) throw cyclesError;
      if (!cycles?.length) return [];

      // Fetch evaluated employees
      const evaluatedIds = [...new Set(participants.map(p => p.evaluated_id))];
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select("id, full_name, email, photo_url, base_position_id, positions:base_position_id(title)")
        .in("id", evaluatedIds);

      if (employeesError) throw employeesError;

      // Build the grouped result
      const cycleMap = new Map(cycles.map(c => [c.id, c]));
      const employeeMap = new Map(employees?.map(e => [e.id, e]) || []);

      const grouped: GroupedPendingEvaluations[] = [];

      for (const cycle of cycles) {
        const cycleParticipants = participants.filter(p => p.cycle_id === cycle.id);
        const scaleLabels = getScaleLabels(
          cycle.scale_label_type as any, 
          cycle.scale_levels as 4 | 5,
          cycle.custom_labels as string[] | undefined
        );

        const evaluations: MyPendingEvaluation[] = cycleParticipants.map(p => {
          const employee = employeeMap.get(p.evaluated_id);
          const isSelf = p.evaluated_id === user.id;
          
          return {
            participant_id: p.id,
            cycle_id: p.cycle_id,
            cycle_name: cycle.name,
            cycle_end_date: cycle.end_date,
            evaluated_id: p.evaluated_id,
            evaluated_name: isSelf ? "Você (Autoavaliação)" : (employee?.full_name || employee?.email || "Colaborador"),
            evaluated_photo: employee?.photo_url || null,
            evaluated_position: (employee?.positions as any)?.title || null,
            relationship: p.relationship as any,
            status: p.status as EvaluationParticipantStatus,
            scale_levels: cycle.scale_levels as 4 | 5,
            scale_labels: scaleLabels,
            require_comments: cycle.require_competency_comments ?? false,
            require_general_comments: cycle.require_general_comments ?? false,
          };
        });

        const completedCount = evaluations.filter(e => e.status === 'completed').length;

        grouped.push({
          cycle_id: cycle.id,
          cycle_name: cycle.name,
          cycle_end_date: cycle.end_date,
          evaluations,
          completed_count: completedCount,
          total_count: evaluations.length,
        });
      }

      return grouped;
    },
    enabled: !!user?.id,
  });
}
