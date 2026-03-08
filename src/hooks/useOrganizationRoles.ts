import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export interface Role {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_system: boolean;
  organization_id: string | null;
  permissions: string[];
}

export function useOrganizationRoles() {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["organization-roles", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      // Buscar APENAS roles da organização (pure multi-tenant)
      // Roles de sistema (is_system = true) não são mais usadas para autorização
      const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name");

      if (rolesError) throw rolesError;

      // Buscar permissões de cada role
      const roleIds = rolesData.map((r) => r.id);
      const { data: permissionsData, error: permError } = await supabase
        .from("role_permissions")
        .select("role_id, permission_id")
        .in("role_id", roleIds);

      if (permError) throw permError;

      // Mapear permissões por role
      const permissionsByRole = new Map<string, string[]>();
      permissionsData.forEach((rp) => {
        const current = permissionsByRole.get(rp.role_id) || [];
        current.push(rp.permission_id);
        permissionsByRole.set(rp.role_id, current);
      });

      return rolesData.map((role) => ({
        ...role,
        permissions: permissionsByRole.get(role.id) || [],
      })) as Role[];
    },
    enabled: !!organizationId,
  });
}
