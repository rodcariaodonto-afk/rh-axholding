import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mockOrganization, mockCareersJobs } from "@/mocks/jobsData";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  employee_count: string | null;
  industry: string | null;
  website: string | null;
  headquarters_city?: string | null;
  work_policy?: string | null;
  work_environment?: string | null;
  interview_format?: string | null;
  hiring_time?: string | null;
  hiring_process_description?: string | null;
  benefits?: unknown;
  linkedin_url?: string | null;
  instagram_handle?: string | null;
  twitter_handle?: string | null;
  is_active?: boolean;
}

export interface JobPublic {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  work_model: string | null;
  contract_type: string | null;
  seniority: string | null;
  openings_count: number | null;
  required_skills: string[] | null;
  desired_skills: string[] | null;
  experience_years: number | null;
  education_level: string | null;
  languages: unknown | null;
  benefits: string[] | null;
  application_deadline: string | null;
  expected_start_date: string | null;
  require_cover_letter: boolean | null;
  tags: string[] | null;
  created_at: string;
  organization_id: string | null;
  salary_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  unit_name: string | null;
  unit_city: string | null;
  unit_state: string | null;
}

// Tipo usado para exibição na página de carreiras (compatível com mock e API)
export interface CareersJob {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  // Campos opcionais para compatibilidade
  seniority?: string | null;
  work_model?: string | null;
  unit_name?: string | null;
  unit_city?: string | null;
}

/**
 * Hook para buscar organização pública (para páginas de carreiras)
 * Usa a view `organizations_public` que expõe apenas campos de marketing
 */
export const useOrganization = (slug: string, isDemoMode = false) => {
  return useQuery({
    queryKey: ["organization-public", slug, isDemoMode],
    queryFn: async (): Promise<Organization | null> => {
      if (isDemoMode) {
        return mockOrganization;
      }

      // Usa a função RPC que já filtra campos sensíveis
      const { data, error } = await supabase.rpc("get_organization_public", {
        org_slug: slug,
      });

      if (error) throw error;
      return (data?.[0] as Organization) || null;
    },
    enabled: !!slug || isDemoMode,
  });
};

/**
 * Hook para buscar vagas ativas para página de carreiras
 * Filtra apenas campos públicos apropriados para candidatos
 */
export const useActiveJobsForCareers = (organizationId: string | undefined, isDemoMode = false) => {
  return useQuery({
    queryKey: ["careers-jobs", organizationId, isDemoMode],
    queryFn: async (): Promise<CareersJob[]> => {
      if (isDemoMode) {
        return mockCareersJobs;
      }

      if (!organizationId) {
        return [];
      }

      // Busca vagas ativas com apenas campos públicos
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          description,
          seniority,
          work_model,
          created_at,
          units:unit_id (name, city)
        `)
        .eq("status", "active")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Mapeia para o formato público
      return (data || []).map(job => ({
        id: job.id,
        title: job.title,
        description: job.description,
        seniority: job.seniority,
        work_model: job.work_model,
        created_at: job.created_at,
        unit_name: (job.units as any)?.name || null,
        unit_city: (job.units as any)?.city || null,
      }));
    },
    enabled: !!organizationId || isDemoMode,
  });
};
