import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

interface UseTimeBalanceOptions {
  employeeId?: string;
  referenceMonth?: string; // YYYY-MM-DD (first day of month)
}

export function useTimeBalance(options: UseTimeBalanceOptions = {}) {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["time-balance", organizationId, options],
    queryFn: async () => {
      let query = supabase
        .from("time_balance")
        .select("*, employees(full_name, email, photo_url)")
        .order("reference_month", { ascending: false });

      if (organizationId) {
        query = query.eq("organization_id", organizationId);
      }
      if (options.employeeId) {
        query = query.eq("employee_id", options.employeeId);
      }
      if (options.referenceMonth) {
        query = query.eq("reference_month", options.referenceMonth);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
}
