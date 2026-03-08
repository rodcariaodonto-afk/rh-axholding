import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type EmployeeDemographics = Database["public"]["Tables"]["employees_demographics"]["Row"];
type EmployeeDemographicsUpdate = Database["public"]["Tables"]["employees_demographics"]["Update"];

export const useEmployeeDemographics = (userId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: demographics, isLoading } = useQuery({
    queryKey: ["employee_demographics", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await supabase
        .from("employees_demographics")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const updateDemographics = useMutation({
    mutationFn: async (demographicsData: Omit<EmployeeDemographicsUpdate, 'user_id'>) => {
      if (!userId) throw new Error("User ID is required");

      const fullData = {
        user_id: userId,
        ...demographicsData,
      };

      const { data, error } = await supabase
        .from("employees_demographics")
        .upsert([fullData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_demographics", userId] });
      queryClient.invalidateQueries({ queryKey: ["employee", userId] });
      toast({
        title: "Dados demográficos atualizados",
        description: "Os dados demográficos foram atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar dados demográficos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    demographics,
    isLoading,
    updateDemographics: updateDemographics.mutate,
    isUpdating: updateDemographics.isPending,
  };
};
