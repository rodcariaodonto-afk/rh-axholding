import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateDescriptionParams {
  title: string;
  expected_profile_code?: string;
  activities?: string;
  parent_position_title?: string;
}

interface GenerateDescriptionResponse {
  description: string;
}

export const useGeneratePositionDescription = () => {
  return useMutation({
    mutationFn: async (params: GenerateDescriptionParams): Promise<GenerateDescriptionResponse> => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session?.access_token) {
        throw new Error("Não autenticado");
      }

      const response = await supabase.functions.invoke("generate-position-description", {
        body: params,
      });

      // Extract friendly message from Problem Details response
      if (response.error) {
        const detail = response.data?.detail;
        throw new Error(detail || "Erro ao gerar descrição. Verifique se a integração com IA está configurada.");
      }

      if (response.data?.type === "about:blank" && response.data?.status) {
        throw new Error(response.data.detail || "Erro ao gerar descrição");
      }

      return response.data as GenerateDescriptionResponse;
    },
    onError: (error: Error) => {
      toast.error("Erro ao gerar descrição", {
        description: error.message,
      });
    },
  });
};
