import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";

export interface OrganizationSettingsJson {
  setup_skipped?: boolean;
}

export interface OrganizationSettings {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  employee_count: string | null;
  industry: string | null;
  website: string | null;
  headquarters_city: string | null;
  work_policy: string | null;
  team_structure: string | null;
  benefits: string[];
  work_environment: string | null;
  tech_stack: string | null;
  interview_format: string | null;
  hiring_time: string | null;
  hiring_process_description: string | null;
  linkedin_url: string | null;
  instagram_handle: string | null;
  twitter_handle: string | null;
  settings: OrganizationSettingsJson | null;
}

export const useOrganizationSettings = () => {
  const { organization } = useRequireOrganization();

  return useQuery({
    queryKey: ["organization-settings", organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organization.id)
        .single();

      if (error) throw error;
      return {
        ...data,
        benefits: (data.benefits as string[]) || [],
        settings: (data.settings as OrganizationSettingsJson) || null,
      } as OrganizationSettings;
    },
    enabled: !!organization?.id,
  });
};

export const useUpdateOrganizationSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { organization } = useRequireOrganization();

  return useMutation({
    mutationFn: async (data: Partial<OrganizationSettings>) => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const { error } = await supabase
        .from("organizations")
        .update({
          name: data.name,
          description: data.description,
          logo_url: data.logo_url,
          employee_count: data.employee_count,
          industry: data.industry,
          website: data.website,
          headquarters_city: data.headquarters_city,
          work_policy: data.work_policy,
          team_structure: data.team_structure,
          benefits: data.benefits,
          work_environment: data.work_environment,
          tech_stack: data.tech_stack,
          interview_format: data.interview_format,
          hiring_time: data.hiring_time,
          hiring_process_description: data.hiring_process_description,
          linkedin_url: data.linkedin_url,
          instagram_handle: data.instagram_handle,
          twitter_handle: data.twitter_handle,
        })
        .eq("id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast({
        title: "Sucesso",
        description: "Configurações da empresa atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar configurações da empresa.",
        variant: "destructive",
      });
      console.error(error);
    },
  });
};

export const useSkipSetup = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { organization } = useRequireOrganization();

  return useMutation({
    mutationFn: async () => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      // Fetch current settings to merge
      const { data: currentOrg } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", organization.id)
        .single();

      const currentSettings = (currentOrg?.settings as OrganizationSettingsJson) || {};

      const { error } = await supabase
        .from("organizations")
        .update({
          settings: {
            ...currentSettings,
            setup_skipped: true,
          },
        })
        .eq("id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      toast({
        title: "Setup pulado",
        description: "Você pode completar a configuração em Configurações.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Não foi possível pular o setup.",
        variant: "destructive",
      });
      console.error(error);
    },
  });
};

export const WORK_POLICIES = [
  { value: "remoto", label: "100% Remoto" },
  { value: "hibrido", label: "Híbrido" },
  { value: "presencial", label: "Presencial" },
];

export const INTERVIEW_FORMATS = [
  { value: "online", label: "Online" },
  { value: "presencial", label: "Presencial" },
  { value: "hibrido", label: "Híbrido (online + presencial)" },
];

export const HIRING_TIMES = [
  { value: "1-2_semanas", label: "1-2 semanas" },
  { value: "2-4_semanas", label: "2-4 semanas" },
  { value: "1-2_meses", label: "1-2 meses" },
  { value: "2-3_meses", label: "2-3 meses" },
  { value: "mais_3_meses", label: "Mais de 3 meses" },
];

export const EMPLOYEE_COUNTS = [
  { value: "1-10", label: "1-10 colaboradores" },
  { value: "11-50", label: "11-50 colaboradores" },
  { value: "51-200", label: "51-200 colaboradores" },
  { value: "201-500", label: "201-500 colaboradores" },
  { value: "501-1000", label: "501-1000 colaboradores" },
  { value: "1000+", label: "1000+ colaboradores" },
];

export const AVAILABLE_BENEFITS = [
  "Plano de Saúde",
  "Plano Dental",
  "Vale Alimentação",
  "Vale Refeição",
  "Vale Transporte",
  "Gympass",
  "Auxílio Home Office",
  "Auxílio Educação",
  "Auxílio Creche",
  "Horário Flexível",
  "Day Off Aniversário",
  "Stock Options",
  "PLR/Bônus",
  "Licença Parental Estendida",
  "Apoio Psicológico",
  "Aulas de Inglês",
];
