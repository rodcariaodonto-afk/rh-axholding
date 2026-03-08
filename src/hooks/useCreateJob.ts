import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRequireOrganization } from "./useRequireOrganization";
import type { JobStatus } from "@/types/job";

interface CreateJobInput {
  title: string;
  description: string | null;
  requirements: string | null;
  position_id: string | null;
  department_id: string | null;
  status: JobStatus;
}

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { organization } = useRequireOrganization();

  return useMutation({
    mutationFn: async (input: CreateJobInput) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("jobs")
        .insert({
          ...input,
          organization_id: organization.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["job-stats"] });
      toast({
        title: "Vaga criada",
        description: "A vaga foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar vaga",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
