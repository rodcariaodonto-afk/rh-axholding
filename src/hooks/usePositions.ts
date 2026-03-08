import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireOrganization } from "./useRequireOrganization";

export const usePositions = () => {
  const { organization } = useRequireOrganization();

  return useQuery({
    queryKey: ["positions", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("positions")
        .select("*")
        .eq("organization_id", organization.id)
        .order("title");

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });
};
