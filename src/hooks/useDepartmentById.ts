import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireOrganization } from "@/hooks/useRequireOrganization";

export const useDepartmentById = (id: string | undefined) => {
  const { organization } = useRequireOrganization();

  return useQuery({
    queryKey: ["department", id],
    queryFn: async () => {
      if (!id || !organization?.id) {
        throw new Error("ID e organização são obrigatórios");
      }

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
        .eq("id", id)
        .eq("organization_id", organization.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!organization?.id,
  });
};
