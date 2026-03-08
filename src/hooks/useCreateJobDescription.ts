import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRequireOrganization } from "./useRequireOrganization";

type CreateJobDescriptionData = {
  position_type: string;
  seniority: string;
  description?: string;
  requirements?: string;
};

export const useCreateJobDescription = () => {
  const queryClient = useQueryClient();
  const { organization } = useRequireOrganization();

  return useMutation({
    mutationFn: async (data: CreateJobDescriptionData) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data: jobDescription, error } = await supabase
        .from("job_descriptions")
        .insert({ ...data, organization_id: organization.id })
        .select()
        .single();

      if (error) throw error;
      return jobDescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_descriptions"] });
      toast({
        title: "Sucesso",
        description: "Descritivo criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
