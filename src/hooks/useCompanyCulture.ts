import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRequireOrganization } from "./useRequireOrganization";

export interface CultureValue {
  name: string;
  bullets: string;
}

export interface CompanyCulture {
  id: string;
  mission: string | null;
  vision: string | null;
  values: CultureValue[];
  swot_strengths: string | null;
  swot_weaknesses: string | null;
  swot_opportunities: string | null;
  swot_threats: string | null;
  modified_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useCompanyCulture = () => {
  const { organization } = useRequireOrganization();

  return useQuery({
    queryKey: ["company-culture", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data, error } = await supabase
        .from("company_culture")
        .select("*")
        .eq("organization_id", organization.id)
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        values: (data.values as unknown as CultureValue[]) || [],
      } as CompanyCulture;
    },
    enabled: !!organization?.id,
  });
};

export const useUpdateCompanyCulture = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { organization } = useRequireOrganization();

  return useMutation({
    mutationFn: async (data: Partial<CompanyCulture>) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data: current, error: fetchError } = await supabase
        .from("company_culture")
        .select("id")
        .eq("organization_id", organization.id)
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      const updateData = {
        mission: data.mission,
        vision: data.vision,
        values: JSON.parse(JSON.stringify(data.values || [])),
        swot_strengths: data.swot_strengths,
        swot_weaknesses: data.swot_weaknesses,
        swot_opportunities: data.swot_opportunities,
        swot_threats: data.swot_threats,
      };

      if (current) {
        const { error } = await supabase
          .from("company_culture")
          .update(updateData)
          .eq("id", current.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("company_culture")
          .insert([{ ...updateData, organization_id: organization.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-culture"] });
      toast({
        title: "Sucesso",
        description: "Cultura organizacional atualizada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar cultura organizacional.",
        variant: "destructive",
      });
      console.error(error);
    },
  });
};
