import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDeleteEmployeeChange = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (changeId: string) => {
      const { error } = await supabase
        .from("employee_changes")
        .delete()
        .eq("id", changeId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee-changes"] });
      toast({
        title: "Registro removido",
        description: "O registro de alteração foi removido com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover registro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
