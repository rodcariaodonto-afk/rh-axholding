import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

interface AuditoriaFilters {
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export function useAuditoriaPonto(filters: AuditoriaFilters = {}) {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["auditoria-ponto", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];

      let query = supabase
        .from("auditoria_ponto")
        .select("*, employees:user_id(full_name, email)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate + "T23:59:59");
      }
      if (filters.userId) {
        query = query.eq("user_id", filters.userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
}
