import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRequireOrganization } from "./useRequireOrganization";
import type { CostSettings } from "@/lib/companyCostCalculations";

export const useCompanyCostSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useRequireOrganization();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["company_cost_settings", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data, error } = await supabase
        .from("company_cost_settings")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // Retornar defaults se não houver configuração
      return data || {
        rat_rate: 1.00,
        system_s_rate: 5.80,
        inss_employer_rate: 20.00,
        fgts_rate: 8.00,
        enable_severance_provision: false,
      };
    },
    enabled: !!organization?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (newSettings: Partial<CostSettings>) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data: existing } = await supabase
        .from("company_cost_settings")
        .select("id")
        .eq("organization_id", organization.id)
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("company_cost_settings")
          .update(newSettings)
          .eq("id", existing.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("company_cost_settings")
          .insert([{ ...newSettings, organization_id: organization.id }])
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company_cost_settings"] });
      toast({
        title: "Configurações atualizadas",
        description: "Os parâmetros de custo foram atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar configurações",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    settings,
    isLoading,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
};
