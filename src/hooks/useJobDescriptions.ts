import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireOrganization } from "./useRequireOrganization";

export const useJobDescriptions = () => {
  const { organization } = useRequireOrganization();

  return useQuery({
    queryKey: ["job_descriptions", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("job_descriptions")
        .select("*")
        .eq("organization_id", organization.id)
        .order("position_type")
        .order("seniority");

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });
};
