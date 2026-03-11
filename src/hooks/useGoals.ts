import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export interface Goal {
  id: string;
  organization_id: string;
  employee_id: string;
  title: string;
  description: string | null;
  target_value: number;
  current_value: number;
  period: string;
  status: string;
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  employee_name?: string | null;
}

interface CreateGoalParams {
  employee_id: string;
  title: string;
  description?: string;
  target_value?: number;
  period: string;
  due_date?: string;
}

interface UpdateGoalParams {
  id: string;
  current_value?: number;
  status?: string;
  title?: string;
  description?: string;
}

export function useGoals() {
  const { organizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ["goals", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("goals")
        .select(`*, employee:employee_id(full_name)`)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((g: any) => ({
        ...g,
        employee_name: g.employee?.full_name || "—",
      })) as Goal[];
    },
    enabled: !!organizationId,
  });

  const createGoal = useMutation({
    mutationFn: async (params: CreateGoalParams) => {
      if (!organizationId) throw new Error("Sem organização");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("goals").insert({
        ...params,
        organization_id: organizationId,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", organizationId] });
      toast.success("Meta criada com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...params }: UpdateGoalParams) => {
      const { error } = await supabase.from("goals").update(params).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", organizationId] });
      toast.success("Meta atualizada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", organizationId] });
      toast.success("Meta excluída!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    goals,
    isLoading,
    createGoal: createGoal.mutate,
    updateGoal: updateGoal.mutate,
    deleteGoal: deleteGoal.mutate,
    isCreating: createGoal.isPending,
  };
}
