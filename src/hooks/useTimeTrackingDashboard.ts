import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export function useTimeTrackingDashboard() {
  const { organizationId } = useCurrentOrganization();
  const today = new Date().toISOString().split("T")[0];

  // Active entries (clocked in, no clock out)
  const { data: activeEntries = [], isLoading: loadingActive } = useQuery({
    queryKey: ["time-tracking-active", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*, employees(full_name, email, photo_url)")
        .eq("organization_id", organizationId!)
        .is("clock_out", null)
        .order("clock_in", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
    refetchInterval: 60_000,
  });

  // Today's completed entries
  const { data: todayEntries = [], isLoading: loadingToday } = useQuery({
    queryKey: ["time-tracking-today", organizationId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*, employees(full_name, email, photo_url)")
        .eq("organization_id", organizationId!)
        .eq("date", today)
        .not("clock_out", "is", null)
        .order("clock_in", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });

  const totalActiveNow = activeEntries.length;
  const totalTodayCompleted = todayEntries.length;
  const avgMinutesToday = todayEntries.length > 0
    ? Math.round(todayEntries.reduce((sum, e) => sum + (e.total_minutes || 0), 0) / todayEntries.length)
    : 0;

  return {
    activeEntries,
    todayEntries,
    totalActiveNow,
    totalTodayCompleted,
    avgMinutesToday,
    isLoading: loadingActive || loadingToday,
  };
}
