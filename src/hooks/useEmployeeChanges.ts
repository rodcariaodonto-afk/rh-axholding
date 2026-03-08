import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EmployeeChange {
  id: string;
  employee_id: string;
  changed_by: string;
  field_name: string;
  field_label: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  changed_by_name?: string | null;
}

export const useEmployeeChanges = (employeeId: string | undefined) => {
  return useQuery({
    queryKey: ["employee-changes", employeeId],
    queryFn: async () => {
      // Buscar alterações
      const { data: changes, error } = await supabase
        .from("employee_changes")
        .select("*")
        .eq("employee_id", employeeId!)
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!changes || changes.length === 0) return [];

      // Buscar nomes dos usuários que fizeram as alterações
      const uniqueUserIds = [...new Set(changes.map((c) => c.changed_by))];
      const { data: users } = await supabase
        .from("employees")
        .select("id, full_name, email")
        .in("id", uniqueUserIds);

      const userMap = new Map(
        users?.map((u) => [u.id, u.full_name || u.email?.split("@")[0] || "—"]) || []
      );

      return changes.map((change) => ({
        ...change,
        changed_by_name: userMap.get(change.changed_by) || "—",
      })) as EmployeeChange[];
    },
    enabled: !!employeeId,
  });
};
