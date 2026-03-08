import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TerminateParams {
  employeeId: string;
  terminationDate: string;
  terminationReason: string;
  terminationDecision?: string;
  terminationCause?: string;
  terminationCost?: number;
  terminationNotes?: string;
}

export const useTerminateEmployee = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TerminateParams) => {
      const { data, error } = await supabase.functions.invoke("terminate-employee", {
        body: {
          employee_id: params.employeeId,
          termination_date: params.terminationDate,
          termination_reason: params.terminationReason,
          termination_decision: params.terminationDecision,
          termination_cause: params.terminationCause,
          termination_cost: params.terminationCost,
          termination_notes: params.terminationNotes,
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
        title: "Colaborador desligado",
        description: `${data.employee_name} foi desligado(a) com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao desligar colaborador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
