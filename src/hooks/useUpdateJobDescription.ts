import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type UpdateJobDescriptionData = {
  id: string;
  position_type?: string;
  seniority?: string;
  description?: string;
  requirements?: string;
};

export const useUpdateJobDescription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateJobDescriptionData) => {
      const { data: jobDescription, error } = await supabase
        .from("job_descriptions")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return jobDescription;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_descriptions"] });
      toast({
        title: "Sucesso",
        description: "Descritivo atualizado com sucesso.",
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
