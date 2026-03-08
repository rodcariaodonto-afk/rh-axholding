import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface ProfilerHistoryEntry {
  id: string;
  employee_id: string;
  profiler_result_code: string;
  profiler_result_detail: Json;
  completed_at: string;
  created_at: string;
}

export const useProfilerHistory = (employeeId: string | undefined) => {
  return useQuery({
    queryKey: ["profiler-history", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      
      const { data, error } = await supabase
        .from("profiler_history")
        .select("*")
        .eq("employee_id", employeeId)
        .order("completed_at", { ascending: false });

      if (error) throw error;
      return data as ProfilerHistoryEntry[];
    },
    enabled: !!employeeId,
  });
};
