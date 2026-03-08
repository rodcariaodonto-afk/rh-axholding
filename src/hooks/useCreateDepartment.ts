import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRequireOrganization } from "./useRequireOrganization";

type CreateDepartmentData = {
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

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();
  const { organization } = useRequireOrganization();

  return useMutation({
    mutationFn: async (data: CreateDepartmentData) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data: department, error } = await supabase
        .from("departments")
        .insert({ ...data, organization_id: organization.id })
        .select()
        .single();

      if (error) throw error;
      return department;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast({
        title: "Sucesso",
        description: "Departamento criado com sucesso.",
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
