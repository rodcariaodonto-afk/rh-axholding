import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePlatformAudit(limit = 200) {
  return useQuery({
    queryKey: ["platform-audit", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_audit_log" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}
