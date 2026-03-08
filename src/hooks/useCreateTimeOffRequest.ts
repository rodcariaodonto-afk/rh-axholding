import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CreateTimeOffRequestParams {
  employee_id: string;
  policy_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  notes?: string;
  status?: "pending_people" | "approved";
}

export const useCreateTimeOffRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateTimeOffRequestParams) => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .insert({
          employee_id: params.employee_id,
          policy_id: params.policy_id,
          start_date: params.start_date,
          end_date: params.end_date,
          total_days: params.total_days,
          notes: params.notes || null,
          status: params.status || "pending_people",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-off-requests"] });
      queryClient.invalidateQueries({ queryKey: ["time-off-balances"] });
      toast({
        title: "Solicitação criada",
        description: "A solicitação de férias foi registrada com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error creating time off request:", error);
      toast({
        title: "Erro ao criar solicitação",
        description: "Não foi possível registrar a solicitação. Tente novamente.",
        variant: "destructive",
      });
    },
  });
};
