import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeletePdi = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (pdiId: string) => {
      const { error } = await supabase
        .from("pdis")
        .delete()
        .eq("id", pdiId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdis"] });
      toast({ title: "PDI excluído com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir PDI",
        description: error.message || "Verifique se não há metas concluídas antes de excluir.",
        variant: "destructive",
      });
    },
  });
};
