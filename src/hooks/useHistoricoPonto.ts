import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

interface HistoricoFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  locationId?: string;
}

export function useHistoricoPonto(filters: HistoricoFilters = {}) {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["historico-ponto", organizationId, filters],
    queryFn: async () => {
      if (!organizationId) return [];

      let query = supabase
        .from("ponto_registros")
        .select("*, employees!inner(full_name, email), organization_locations!inner(name)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte("created_at", filters.endDate + "T23:59:59");
      }
      if (filters.employeeId) {
        query = query.eq("employee_id", filters.employeeId);
      }
      if (filters.locationId) {
        query = query.eq("location_id", filters.locationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
}
