import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireOrganization } from "./useRequireOrganization";

export interface Department {
  id: string;
  name: string;
  description: string | null;
  manager_id: string | null;
  monthly_budget: number | null;
  location: string | null;
  phone: string | null;
  fax: string | null;
  extension: string | null;
  email: string | null;
  manager?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
}

export const useDepartments = () => {
  const { organization } = useRequireOrganization();

  return useQuery({
    queryKey: ["departments", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("departments")
        .select(`
          id,
          name,
          description,
          manager_id,
          monthly_budget,
          location,
          phone,
          fax,
          extension,
          email,
          manager:employees!departments_manager_id_fkey(id, full_name, email)
        `)
        .eq("organization_id", organization.id)
        .order("name");

      if (error) throw error;
      return data as Department[];
    },
    enabled: !!organization?.id,
  });
};
