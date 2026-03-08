import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type GoalType = "tecnico" | "comportamental" | "lideranca" | "carreira";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  [key: string]: string | boolean;
}

interface UpdatePdiGoalData {
  id: string;
  pdi_id: string;
  title?: string;
  due_date?: string;
  description?: string;
  action_plan?: string;
  goal_type?: GoalType;
  weight?: number;
  checklist_items?: ChecklistItem[];
}

export const useUpdatePdiGoal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, pdi_id, ...data }: UpdatePdiGoalData) => {
      const { data: goal, error } = await supabase
        .from("pdi_goals")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { goal, pdi_id };
    },
    onSuccess: ({ pdi_id }) => {
      queryClient.invalidateQueries({ queryKey: ["pdi", pdi_id] });
      queryClient.invalidateQueries({ queryKey: ["pdis"] });
      toast({ title: "Meta atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar meta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
