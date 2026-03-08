import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { EvaluationCycle, EvaluationCycleStatus } from "@/types/evaluation";
import { toast } from "@/hooks/use-toast";

export function useEvaluationCycles(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["evaluation-cycles", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("evaluation_cycles")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as EvaluationCycle[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateEvaluationCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cycle: Omit<EvaluationCycle, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("evaluation_cycles")
        .insert(cycle)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-cycles"] });
      toast({
        title: "Ciclo criado",
        description: "O ciclo de avaliação foi criado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar ciclo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateEvaluationCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<EvaluationCycle> & { id: string }) => {
      const { data, error } = await supabase
        .from("evaluation_cycles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-cycles"] });
      toast({
        title: "Ciclo atualizado",
        description: "O ciclo de avaliação foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar ciclo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateCycleStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status 
    }: { id: string; status: EvaluationCycleStatus }) => {
      const { data, error } = await supabase
        .from("evaluation_cycles")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-cycles"] });
      
      const statusMessages: Record<EvaluationCycleStatus, string> = {
        draft: "O ciclo foi movido para rascunho.",
        active: "O ciclo foi ativado com sucesso.",
        completed: "O ciclo foi concluído.",
        cancelled: "O ciclo foi cancelado.",
      };
      
      toast({
        title: "Status atualizado",
        description: statusMessages[variables.status],
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteEvaluationCycle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("evaluation_cycles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["evaluation-cycles"] });
      toast({
        title: "Ciclo excluído",
        description: "O ciclo de avaliação foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir ciclo",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useEvaluationCycleById(cycleId: string | undefined) {
  return useQuery({
    queryKey: ["evaluation-cycle", cycleId],
    queryFn: async () => {
      if (!cycleId) return null;
      
      const { data, error } = await supabase
        .from("evaluation_cycles")
        .select("*")
        .eq("id", cycleId)
        .single();
      
      if (error) throw error;
      return data as EvaluationCycle;
    },
    enabled: !!cycleId,
  });
}
