import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteParams {
  employeeId: string;
  confirmationName: string;
  reason: "lgpd_request" | "cadastro_erro" | "other";
  reasonDetails?: string;
}

export const useDeleteEmployee = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeleteParams) => {
      const { data, error } = await supabase.functions.invoke("delete-employee", {
        body: {
          employee_id: params.employeeId,
          confirmation_name: params.confirmationName,
          reason: params.reason,
          reason_details: params.reasonDetails,
        },
      });

      if (error) throw error;
      
      // Check for error in response body
      if (data?.error) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee"] });
      toast({
        title: "Colaborador excluído",
        description: `${data.employee_name} foi excluído(a) permanentemente.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir colaborador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
