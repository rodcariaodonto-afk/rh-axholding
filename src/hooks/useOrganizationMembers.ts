import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export interface OrganizationMember {
  id: string;
  user_id: string;
  role_id: string | null;
  is_owner: boolean;
  role: {
    id: string;
    slug: string;
    name: string;
    is_system: boolean;
  } | null;
  employee: {
    id: string;
    full_name: string | null;
    email: string;
    photo_url: string | null;
  } | null;
}

export function useOrganizationMembers() {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          id,
          user_id,
          role_id,
          is_owner,
          roles:role_id (
            id,
            slug,
            name,
            is_system
          )
        `)
        .eq("organization_id", organizationId)
        .order("is_owner", { ascending: false });

      if (error) throw error;

      // Buscar employees separadamente
      const userIds = (data || []).map(d => d.user_id);
      const { data: employeesData } = await supabase
        .from("employees")
        .select("id, full_name, email, photo_url")
        .in("id", userIds);

      const employeesMap = new Map(employeesData?.map(e => [e.id, e]) || []);

      return (data || []).map((item) => ({
        id: item.id,
        user_id: item.user_id,
        role_id: item.role_id,
        is_owner: item.is_owner || false,
        role: item.roles as OrganizationMember["role"],
        employee: employeesMap.get(item.user_id) || null,
      })) as OrganizationMember[];
    },
    enabled: !!organizationId,
  });
}
