import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePdis = (employeeId?: string) => {
  return useQuery({
    queryKey: ["pdis", employeeId],
    queryFn: async () => {
      let query = supabase
        .from("pdis")
        .select(`
          *,
          employee:employee_id (id, full_name, email),
          manager:manager_id (id, full_name),
          created_by_employee:created_by (id, full_name),
          goals:pdi_goals (
            id,
            title,
            status,
            completion_ratio,
            goal_type,
            due_date,
            weight
          )
        `)
        .order("created_at", { ascending: false });

      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: employeeId !== undefined,
  });
};
