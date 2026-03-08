import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePdiById = (pdiId?: string) => {
  return useQuery({
    queryKey: ["pdi", pdiId],
    queryFn: async () => {
      if (!pdiId) throw new Error("PDI ID required");

      const { data, error } = await supabase
        .from("pdis")
        .select(`
          *,
          employee:employee_id (
            id, 
            full_name, 
            email,
            department:department_id (name),
            position:base_position_id (title)
          ),
          manager:manager_id (id, full_name),
          created_by_employee:created_by (id, full_name),
          finalized_by_employee:finalized_by (id, full_name),
            goals:pdi_goals (
            *,
            checklist_items
          ),
          logs:pdi_logs (
            *,
            logged_by_employee:logged_by (id, full_name),
            goal:goal_id (title)
          ),
          attachments:pdi_attachments (
            *,
            uploaded_by_employee:uploaded_by (id, full_name)
          ),
          comments:pdi_comments (
            id,
            content,
            created_at,
            updated_at,
            edit_history,
            user:user_id (id, full_name, email)
          )
        `)
        .eq("id", pdiId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!pdiId,
  });
};
