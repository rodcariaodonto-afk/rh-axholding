import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useFinalizePdi = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ pdiId, status }: { pdiId: string; status: "concluido" | "cancelado" }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: pdi, error } = await supabase
        .from("pdis")
        .update({
          status,
          finalized_at: new Date().toISOString(),
          finalized_by: user.id,
        })
        .eq("id", pdiId)
        .select()
        .single();

      if (error) throw error;

      await supabase.from("pdi_logs").insert({
        pdi_id: pdiId,
        event_type: "finalized",
        description: `PDI finalizado como ${status}`,
        metadata: { status },
        logged_by: user.id,
      });

      return pdi;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdis"] });
      toast({ title: "PDI finalizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao finalizar PDI",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
