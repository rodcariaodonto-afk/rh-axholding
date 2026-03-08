import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useRequireOrganization } from "./useRequireOrganization";
import type { Database } from "@/integrations/supabase/types";

type CreatePositionData = Omit<Database["public"]["Tables"]["positions"]["Insert"], "organization_id">;

export const useCreatePosition = () => {
  const queryClient = useQueryClient();
  const { organization } = useRequireOrganization();

  return useMutation({
    mutationFn: async (data: CreatePositionData) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data: position, error } = await supabase
        .from("positions")
        .insert({ ...data, organization_id: organization.id })
        .select()
        .single();

      if (error) throw error;
      return position;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Sucesso",
        description: "Cargo criado com sucesso.",
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
