import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreatePdiData {
  employee_id: string;
  title: string;
  start_date: string;
  due_date: string;
  current_state?: string;
  desired_state?: string;
  objective?: string;
  manager_id?: string;
}

export const useCreatePdi = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreatePdiData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: pdi, error } = await supabase
        .from("pdis")
        .insert({
          ...data,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from("pdi_logs").insert({
        pdi_id: pdi.id,
        event_type: "created",
        description: `PDI "${pdi.title}" criado`,
        logged_by: user.id,
      });

      return pdi;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pdis"] });
      toast({ 
        title: "PDI criado com sucesso!",
        description: "Agora você pode adicionar metas ao PDI.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar PDI",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
