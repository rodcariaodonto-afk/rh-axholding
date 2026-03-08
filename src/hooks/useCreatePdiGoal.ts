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

interface CreatePdiGoalData {
  pdi_id: string;
  title: string;
  due_date: string;
  description?: string;
  action_plan?: string;
  goal_type?: GoalType;
  weight?: number;
  checklist_items?: ChecklistItem[];
}

export const useCreatePdiGoal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePdiGoalData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: goal, error } = await supabase
        .from("pdi_goals")
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("pdi_logs").insert({
        pdi_id: data.pdi_id,
        goal_id: goal.id,
        event_type: "goal_added",
        description: `Meta "${goal.title}" adicionada`,
        logged_by: user.id,
      });

      return goal;
    },
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: ["pdi", goal.pdi_id] });
      queryClient.invalidateQueries({ queryKey: ["pdis"] });
      toast({ title: "Meta criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar meta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
