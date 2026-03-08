import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireOrganization } from "./useRequireOrganization";
import type { Job, JobStatus } from "@/types/job";
import { mockJobs, mockJobStats } from "@/mocks/jobsData";

interface UseJobsOptions {
  status?: JobStatus | 'all';
  positionId?: string | 'all';
  isDemoMode?: boolean;
}

export const useJobs = (options: UseJobsOptions = {}) => {
  const { status = 'all', positionId = 'all', isDemoMode = false } = options;
  const { organization } = useRequireOrganization();

  return useQuery({
    queryKey: ["jobs", organization?.id, status, positionId, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        let filteredJobs = [...mockJobs];
        
        if (status !== 'all') {
          filteredJobs = filteredJobs.filter(job => job.status === status);
        }
        
        if (positionId !== 'all') {
          filteredJobs = filteredJobs.filter(job => job.position_id === positionId);
        }
        
        return filteredJobs;
      }

      if (!organization?.id) return [];

      let query = supabase
        .from("jobs")
        .select(`
          id,
          title,
          description,
          requirements,
          position_id,
          department_id,
          status,
          created_by,
          created_at,
          updated_at,
          closed_at,
          positions (id, title),
          departments (id, name)
        `)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (status !== 'all') {
        query = query.eq("status", status);
      }

      if (positionId !== 'all') {
        query = query.eq("position_id", positionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as Job[];
    },
    enabled: isDemoMode || !!organization?.id,
  });
};

export const useJobStats = (isDemoMode: boolean = false) => {
  const { organization } = useRequireOrganization();

  return useQuery({
    queryKey: ["job-stats", organization?.id, isDemoMode],
    queryFn: async () => {
      if (isDemoMode) {
        return mockJobStats;
      }

      if (!organization?.id) {
        return { activeJobs: 0, totalApplications: 0, processedApplications: 0 };
      }

      // Get active jobs count
      const { count: activeJobsCount, error: activeError } = await supabase
        .from("jobs")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .eq("status", "active");

      if (activeError) throw activeError;

      // Get job IDs for this organization to filter applications
      const { data: orgJobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("organization_id", organization.id);

      const jobIds = orgJobs?.map(j => j.id) || [];

      // Get total applications count for org's jobs
      const { count: totalApplicationsCount, error: appError } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .in("job_id", jobIds);

      if (appError) throw appError;

      // Get processed applications count (not pending)
      const { count: processedApplicationsCount, error: processedError } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .in("job_id", jobIds)
        .neq("status", "pending");

      if (processedError) throw processedError;

      return {
        activeJobs: activeJobsCount ?? 0,
        totalApplications: totalApplicationsCount ?? 0,
        processedApplications: processedApplicationsCount ?? 0,
      };
    },
    enabled: isDemoMode || !!organization?.id,
  });
};
