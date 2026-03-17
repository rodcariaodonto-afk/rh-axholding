import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useToast } from "@/hooks/use-toast";

export interface JourneyConfig {
  id: string;
  organization_id: string;
  employee_id: string;
  tipo_jornada: string;
  horas_semana: number;
  horas_dia: number;
  dias_trabalho: string[];
  tolerancia_atraso: number;
  tolerancia_saida_antecipada: number;
  intervalo_padrao: number;
  fator_hora_extra_normal: number;
  fator_hora_extra_noturna: number;
  fator_sabado: number;
  fator_domingo: number;
  fator_feriado: number;
  limite_saldo_negativo: number;
  validade_horas_dias: number;
  compensacao_automatica: boolean;
  observacoes: string | null;
  data_vigencia: string;
  data_termino: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  employees?: { full_name: string | null; email: string };
}

export type JourneyConfigInsert = Omit<JourneyConfig, "id" | "created_at" | "updated_at" | "employees">;

export function useJourneyConfigs() {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["journey-configs", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_journey_config")
        .select("*, employees(full_name, email)")
        .eq("organization_id", organizationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as JourneyConfig[];
    },
    enabled: !!organizationId,
  });
}

export function useJourneyConfigByEmployee(employeeId?: string) {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["journey-config", organizationId, employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_journey_config")
        .select("*")
        .eq("organization_id", organizationId!)
        .eq("employee_id", employeeId!)
        .eq("is_active", true)
        .order("data_vigencia", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as JourneyConfig | null;
    },
    enabled: !!organizationId && !!employeeId,
  });
}

export function useCreateJourneyConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: JourneyConfigInsert) => {
      const { data, error } = await supabase
        .from("employee_journey_config")
        .insert(config as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journey-configs"] });
      queryClient.invalidateQueries({ queryKey: ["journey-config"] });
      toast({ title: "Configuração de jornada criada com sucesso" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao criar configuração", description: err.message, variant: "destructive" });
    },
  });
}

export function useUpdateJourneyConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JourneyConfig> & { id: string }) => {
      const { data, error } = await supabase
        .from("employee_journey_config")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journey-configs"] });
      queryClient.invalidateQueries({ queryKey: ["journey-config"] });
      toast({ title: "Configuração atualizada com sucesso" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao atualizar", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeleteJourneyConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("employee_journey_config")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journey-configs"] });
      toast({ title: "Configuração removida" });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao remover", description: err.message, variant: "destructive" });
    },
  });
}
