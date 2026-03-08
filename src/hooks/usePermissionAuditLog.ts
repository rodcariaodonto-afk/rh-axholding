import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export interface RoleValue {
  role_id: string;
  slug: string;
  name: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  target_user_id: string | null;
  target_role_id: string | null;
  permission_id: string | null;
  old_value: RoleValue | null;
  new_value: RoleValue | null;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
  // Enriched data
  changed_by_name?: string;
  target_user_name?: string;
}

export function usePermissionAuditLog() {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["permission-audit-log", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("permission_audit_log")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Collect unique user IDs to fetch names
      const userIds = new Set<string>();
      data.forEach((log) => {
        if (log.changed_by) userIds.add(log.changed_by);
        if (log.target_user_id) userIds.add(log.target_user_id);
      });

      // Fetch employee names
      const { data: employees } = await supabase
        .from("employees")
        .select("id, full_name, email")
        .in("id", Array.from(userIds));

      const userMap = new Map<string, string>();
      employees?.forEach((emp) => {
        userMap.set(emp.id, emp.full_name || emp.email?.split("@")[0] || "Usuário");
      });

      // Enrich logs with names
      return data.map((log) => ({
        ...log,
        old_value: log.old_value as unknown as RoleValue | null,
        new_value: log.new_value as unknown as RoleValue | null,
        changed_by_name: log.changed_by ? userMap.get(log.changed_by) || "Usuário" : null,
        target_user_name: log.target_user_id ? userMap.get(log.target_user_id) || "Usuário" : null,
      })) as AuditLogEntry[];
    },
    enabled: !!organizationId,
  });
}
