import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeletePdiGoal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ goalId, pdiId }: { goalId: string; pdiId: string }) => {
      const { error } = await supabase
        .from("pdi_goals")
        .delete()
        .eq("id", goalId);

      if (error) throw error;
      return pdiId;
    },
    onSuccess: (pdiId) => {
      queryClient.invalidateQueries({ queryKey: ["pdi", pdiId] });
      queryClient.invalidateQueries({ queryKey: ["pdis"] });
      toast({ title: "Meta excluída com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir meta",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
