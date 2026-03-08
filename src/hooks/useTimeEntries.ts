import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

interface UseTimeEntriesOptions {
  employeeId?: string;
  date?: string; // YYYY-MM-DD
  startDate?: string;
  endDate?: string;
}

export function useTimeEntries(options: UseTimeEntriesOptions = {}) {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["time-entries", organizationId, options],
    queryFn: async () => {
      let query = supabase
        .from("time_entries")
        .select("*, employees(full_name, email, photo_url)")
        .order("clock_in", { ascending: false });

      if (options.employeeId) {
        query = query.eq("employee_id", options.employeeId);
      }
      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }
      if (options.date) {
        query = query.eq("date", options.date);
      }
      if (options.startDate) {
        query = query.gte("date", options.startDate);
      }
      if (options.endDate) {
        query = query.lte("date", options.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
}
