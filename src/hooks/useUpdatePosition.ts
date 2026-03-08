import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type UpdatePositionData = {
  id: string;
} & Database["public"]["Tables"]["positions"]["Update"];

export const useUpdatePosition = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdatePositionData) => {
      const { data: position, error } = await supabase
        .from("positions")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return position;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast({
        title: "Sucesso",
        description: "Cargo atualizado com sucesso.",
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
