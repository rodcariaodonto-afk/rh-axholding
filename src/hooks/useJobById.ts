import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Job, JobLanguage } from "@/types/job";
import { mockJobs, mockOrganization } from "@/mocks/jobsData";

export interface JobWithOrganization extends Job {
  organizations?: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    website: string | null;
    industry: string | null;
    employee_count: string | null;
  } | null;
}

export const useJobById = (jobId: string | undefined, isDemoMode: boolean = false) => {
  return useQuery({
    queryKey: ["job", jobId, isDemoMode],
    queryFn: async () => {
      if (!jobId) return null;
      
      // Demo mode: return mock job with organization
      if (isDemoMode) {
        const mockJob = mockJobs.find(job => job.id === jobId);
        if (mockJob) {
          return {
            ...mockJob,
            organizations: mockOrganization,
          } as JobWithOrganization;
        }
        return null;
      }
      
      const { data, error } = await supabase
        .from("jobs")
        .select(`
          *,
          positions:position_id (id, title),
          departments:department_id (id, name),
          organizations:organization_id (id, name, slug, logo_url, website, industry, employee_count)
        `)
        .eq("id", jobId)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) return null;
      
      // Cast languages from Json to JobLanguage[]
      return {
        ...data,
        languages: (data.languages as unknown as JobLanguage[] | null) || [],
      } as JobWithOrganization;
    },
    enabled: !!jobId,
  });
};
