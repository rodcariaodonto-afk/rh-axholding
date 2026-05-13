import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

const PERMS = [
  "governance.access",
  "governance.export",
  "governance.audit_view",
  "governance.policies_manage",
  "governance.dsr_manage",
  "governance.consent_manage",
  "governance.retention_manage",
] as const;

export type GovernancePermission = typeof PERMS[number];

export function useGovernancePermissions() {
  const { user } = useAuth();
  const { organizationId } = useCurrentOrganization();

  const { data, isLoading } = useQuery({
    queryKey: ["governance-perms", user?.id, organizationId],
    queryFn: async () => {
      if (!user?.id || !organizationId) return {} as Record<GovernancePermission, boolean>;
      const { data: rows, error } = await supabase
        .from("organization_members")
        .select("role_id, roles!inner(role_permissions(permission_id))")
        .eq("user_id", user.id)
        .eq("organization_id", organizationId)
        .maybeSingle();
      if (error) throw error;
      const perms = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rps = (rows as any)?.roles?.role_permissions ?? [];
      for (const rp of rps) perms.add(rp.permission_id);
      return Object.fromEntries(PERMS.map((p) => [p, perms.has(p)])) as Record<GovernancePermission, boolean>;
    },
    enabled: !!user?.id && !!organizationId,
  });

  return {
    isLoading,
    perms: data ?? ({} as Record<GovernancePermission, boolean>),
    canAccess: !!data?.["governance.access"],
  };
}
