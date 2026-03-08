import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { detectChanges, recordEmployeeChanges, FIELD_LABELS } from "@/lib/employeeChangeTracking";

interface EmployeeUpdate {
  id: string;
  full_name?: string;
  photo_url?: string;
  birth_date?: string;
  gender?: "male" | "female" | "non_binary" | "prefer_not_to_say";
  nationality?: string;
  birthplace?: string;
  ethnicity?: "white" | "black" | "brown" | "asian" | "indigenous" | "not_declared";
  marital_status?: "single" | "married" | "divorced" | "widowed" | "domestic_partnership" | "prefer_not_to_say";
  number_of_children?: number | null;
  education_level?: "elementary" | "high_school" | "technical" | "undergraduate" | "postgraduate" | "masters" | "doctorate" | "postdoc";
  education_course?: string;
  department_id?: string;
  base_position_id?: string;
  position_level_detail?: "junior_i" | "junior_ii" | "junior_iii" | "pleno_i" | "pleno_ii" | "pleno_iii" | "senior_i" | "senior_ii" | "senior_iii";
  unit_id?: string;
  manager_id?: string;
  status?: "active" | "on_leave" | "terminated";
  employment_type?: "full_time" | "part_time" | "contractor" | "intern";
  termination_date?: string;
  termination_reason?: "pedido_demissao" | "sem_justa_causa" | "justa_causa" | "antecipada_termo_empregador" | "fim_contrato" | "acordo_mutuo" | "outros" | "rescisao_indireta" | "antecipada_termo_empregado" | "aposentadoria_idade" | "aposentadoria_invalidez" | "aposentadoria_compulsoria" | "falecimento" | "forca_maior";
  termination_decision?: "pediu_pra_sair" | "foi_demitido";
  termination_cause?: "recebimento_proposta" | "baixo_desempenho" | "corte_custos" | "relocacao" | "insatisfacao" | "problemas_pessoais" | "reestruturacao" | "outros";
  termination_cost?: number;
  termination_notes?: string;
}

export const useUpdateEmployee = (onSuccessCallback?: () => void) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (employee: EmployeeUpdate) => {
      const { id, ...updateData } = employee;

      // Buscar dados atuais do colaborador para detectar mudanças
      const { data: currentEmployee, error: fetchError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Realizar o update (usando type assertion para novos valores de enum)
      const { data, error } = await supabase
        .from("employees")
        .update(updateData as any)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Detectar e registrar alterações
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user?.id && currentEmployee) {
        const changes = detectChanges(currentEmployee, updateData);
        if (changes.length > 0) {
          await recordEmployeeChanges(id, authData.user.id, changes);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employee"] });
      queryClient.invalidateQueries({ queryKey: ["employee-changes"] });
      toast({
        title: "Colaborador atualizado",
        description: "Os dados foram atualizados com sucesso.",
      });
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar colaborador",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
