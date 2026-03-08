import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmployeeContract {
  id?: string;
  user_id: string;
  contract_type: "clt" | "pj" | "internship" | "temporary" | "other";
  hire_date: string;
  probation_days?: number;
  contract_start_date?: string;
  contract_duration_days?: number;
  contract_end_date?: string;
  base_salary: number;
  health_insurance?: number;
  dental_insurance?: number;
  transportation_voucher?: number;
  meal_voucher?: number;
  other_benefits?: number;
  weekly_hours?: number;
  is_active: boolean;
}

export const useEmployeeContract = (userId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["employee_contracts", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await supabase
        .from("employees_contracts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const createContract = useMutation({
    mutationFn: async (contractData: Omit<EmployeeContract, "id">) => {
      const { data, error } = await supabase
        .from("employees_contracts")
        .insert([contractData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_contracts", userId] });
      toast({
        title: "Contrato adicionado",
        description: "O contrato foi adicionado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar contrato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateContract = useMutation({
    mutationFn: async (contractData: EmployeeContract) => {
      const { id, ...updateData } = contractData;
      const { data, error } = await supabase
        .from("employees_contracts")
        .update(updateData)
        .eq("id", id!)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_contracts", userId] });
      toast({
        title: "Contrato atualizado",
        description: "O contrato foi atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar contrato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    contracts,
    isLoading,
    createContract: createContract.mutate,
    updateContract: updateContract.mutate,
    isCreating: createContract.isPending,
    isUpdating: updateContract.isPending,
  };
};
