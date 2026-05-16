import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  features: Record<string, any>;
  default_modules: string[];
  is_active: boolean;
  display_order: number;
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans" as any)
        .select("*")
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as unknown as Plan[];
    },
  });
}

export function useOrgModules(organizationId?: string) {
  return useQuery({
    queryKey: ["organization-modules", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("organization_modules" as any)
        .select("*")
        .eq("organization_id", organizationId);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!organizationId,
  });
}
