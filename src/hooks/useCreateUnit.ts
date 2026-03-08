import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRequireOrganization } from "./useRequireOrganization";

interface CreateUnitInput {
  name: string;
  city: string;
  state: string;
  country?: string;
}

export const useCreateUnit = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { organization } = useRequireOrganization();

  return useMutation({
    mutationFn: async (input: CreateUnitInput) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("units")
        .insert({
          name: input.name,
          city: input.city,
          state: input.state,
          country: input.country || "BR",
          organization_id: organization.id,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      toast({
        title: "Unidade criada",
        description: "A unidade foi criada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar unidade",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
