import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export const useUpdateGoalChecklist = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      goalId, 
      pdiId, 
      checklist_items 
    }: { 
      goalId: string; 
      pdiId: string; 
      checklist_items: ChecklistItem[] 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: goal, error } = await supabase
        .from("pdi_goals")
        .update({ checklist_items: checklist_items as any })
        .eq("id", goalId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("pdi_logs").insert({
        pdi_id: pdiId,
        goal_id: goalId,
        event_type: "checklist_updated",
        description: `Checklist atualizado`,
        logged_by: user.id,
      });

      return { goal, pdiId };
    },
    onSuccess: ({ pdiId }) => {
      queryClient.invalidateQueries({ queryKey: ["pdi", pdiId] });
      queryClient.invalidateQueries({ queryKey: ["pdis"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar checklist",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
