import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpdatePdiData {
  id: string;
  title?: string;
  start_date?: string;
  due_date?: string;
  current_state?: string;
  desired_state?: string;
  objective?: string;
  manager_id?: string;
}

export const useUpdatePdi = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdatePdiData) => {
      const { data: pdi, error } = await supabase
        .from("pdis")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return pdi;
    },
    onSuccess: (pdi) => {
      queryClient.invalidateQueries({ queryKey: ["pdis"] });
      queryClient.invalidateQueries({ queryKey: ["pdi", pdi.id] });
      toast({ title: "PDI atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar PDI",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
