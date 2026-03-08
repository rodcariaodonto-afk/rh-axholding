import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type UpdateDepartmentData = {
  id: string;
  name: string;
  description?: string;
  manager_id?: string | null;
  monthly_budget?: number | null;
  location?: string | null;
  phone?: string | null;
  fax?: string | null;
  extension?: string | null;
  email?: string | null;
};

export const useUpdateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateDepartmentData) => {
      const { data: department, error } = await supabase
        .from("departments")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({
        title: "Sucesso",
        description: "Departamento atualizado com sucesso.",
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
