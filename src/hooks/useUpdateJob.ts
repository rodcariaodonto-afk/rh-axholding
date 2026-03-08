import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { JobStatus } from "@/types/job";

interface UpdateJobInput {
  id: string;
  title?: string;
  description?: string | null;
  requirements?: string | null;
  position_id?: string | null;
  department_id?: string | null;
  status?: JobStatus;
  closed_at?: string | null;
}

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateJobInput) => {
      // Auto-preencher closed_at quando status muda para "closed"
      const updateData = {
        ...input,
        ...(input.status === 'closed' && !input.closed_at ? { closed_at: new Date().toISOString() } : {}),
        ...(input.status && input.status !== 'closed' ? { closed_at: null } : {}),
      };

      const { data, error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-stats"] });
      queryClient.invalidateQueries({ queryKey: ["job", data.id] });
      toast({
        title: "Vaga atualizada",
        description: "A vaga foi atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar vaga",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
