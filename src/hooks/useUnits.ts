import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireOrganization } from "./useRequireOrganization";

export const useUnits = () => {
  const { organization } = useRequireOrganization();

  return useQuery({
    queryKey: ["units", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("units")
        .select("*")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });
};
