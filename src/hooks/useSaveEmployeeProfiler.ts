import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface SaveProfilerData {
  profiler_result_code: string;
  profiler_result_detail: Json;
}

export const useSaveEmployeeProfiler = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SaveProfilerData) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      const completedAt = new Date().toISOString();

      // Atualizar perfil atual do funcionário
      const { error: updateError } = await supabase
        .from("employees")
        .update({
          profiler_result_code: data.profiler_result_code,
          profiler_result_detail: data.profiler_result_detail,
          profiler_completed_at: completedAt,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Inserir no histórico
      const { error: historyError } = await supabase
        .from("profiler_history")
        .insert({
          employee_id: user.id,
          profiler_result_code: data.profiler_result_code,
          profiler_result_detail: data.profiler_result_detail,
          completed_at: completedAt,
        });

      if (historyError) {
        console.error("Error saving profiler history:", historyError);
        // Não lançar erro aqui - o perfil já foi salvo
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee"] });
      queryClient.invalidateQueries({ queryKey: ["profiler-history"] });
      toast({
        title: "Perfil salvo",
        description: "Seu resultado do Profiler foi salvo com sucesso.",
      });
    },
    onError: (error) => {
      console.error("Error saving profiler result:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar seu resultado do Profiler.",
        variant: "destructive",
      });
    },
  });
};
