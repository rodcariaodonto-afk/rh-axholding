import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InviteEmployeeData {
  // Obrigatórios
  email: string;
  full_name: string;
  
  // Organizacionais (opcionais)
  department_id?: string | null;
  manager_id?: string | null;
  base_position_id?: string | null;
  position_level_detail?: string | null;
  unit_id?: string | null;
  employment_type?: string;
  
  // Contratuais (opcionais)
  contract_type?: string | null;
  hire_date?: string | null;
  base_salary?: number | null;
}

export const useCreateEmployee = (onSuccessCallback?: () => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteEmployeeData) => {
      const response = await supabase.functions.invoke("invite-employee", {
        body: {
          email: data.email,
          full_name: data.full_name,
          department_id: data.department_id || null,
          manager_id: data.manager_id || null,
          base_position_id: data.base_position_id || null,
          position_level_detail: data.position_level_detail || null,
          unit_id: data.unit_id || null,
          employment_type: data.employment_type || 'full_time',
          contract_type: data.contract_type || null,
          hire_date: data.hire_date || null,
          base_salary: data.base_salary || null,
        },
      });

      // Edge function retorna body com RFC 7807 mesmo em erros
      // O response.data contém o body parseado independente do status
      const body = response.data;

      if (response.error) {
        // Tentar extrair mensagem amigável do body
        const detail = body?.detail || response.error.message || "Erro ao convidar colaborador";
        throw new Error(detail);
      }

      if (body?.type === "about:blank" || body?.status >= 400) {
        throw new Error(body.detail || "Erro ao convidar colaborador");
      }

      return body;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      toast({
        title: "Convite enviado",
        description: data.message || "O convite foi enviado para o email do colaborador.",
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao convidar colaborador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
