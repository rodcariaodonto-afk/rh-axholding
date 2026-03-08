import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

interface UseMonthlyTimeEntriesOptions {
  referenceDate?: Date;
  customStartDate?: string;
  customEndDate?: string;
  employeeId?: string;
}

export function useMonthlyTimeEntries(options: UseMonthlyTimeEntriesOptions = {}) {
  const { organizationId } = useCurrentOrganization();
  const refDate = options.referenceDate ?? new Date();

  const monthStart = options.customStartDate || format(startOfMonth(refDate), "yyyy-MM-dd");
  const monthEnd = options.customEndDate || format(endOfMonth(refDate), "yyyy-MM-dd");
  const weekStart = format(startOfWeek(refDate, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(refDate, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const monthQuery = useQuery({
    queryKey: ["time-entries-month", organizationId, monthStart, monthEnd, options.employeeId],
    queryFn: async () => {
      let query = supabase
        .from("time_entries")
        .select("*, employees(full_name, email, photo_url)")
        .eq("organization_id", organizationId!)
        .gte("date", monthStart)
        .lte("date", monthEnd)
        .not("clock_out", "is", null)
        .order("date", { ascending: true });

      if (options.employeeId) {
        query = query.eq("employee_id", options.employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });

  const weekQuery = useQuery({
    queryKey: ["time-entries-week", organizationId, weekStart, weekEnd, options.employeeId],
    queryFn: async () => {
      let query = supabase
        .from("time_entries")
        .select("*, employees(full_name, email, photo_url)")
        .eq("organization_id", organizationId!)
        .gte("date", weekStart)
        .lte("date", weekEnd)
        .not("clock_out", "is", null)
        .order("date", { ascending: true });

      if (options.employeeId) {
        query = query.eq("employee_id", options.employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });

  return {
    monthEntries: monthQuery.data ?? [],
    weekEntries: weekQuery.data ?? [],
    isLoading: monthQuery.isLoading || weekQuery.isLoading,
    monthStart,
    monthEnd,
    weekStart,
    weekEnd,
  };
}
