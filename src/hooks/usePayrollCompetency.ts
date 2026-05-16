import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export function usePayrollCompetency(id: string | undefined) {
  return useQuery({
    queryKey: ["payroll_competency", id],
    enabled: !!id,
    queryFn: async () => {
      const [comp, events] = await Promise.all([
        supabase.from("payroll_competencies").select("*").eq("id", id!).single(),
        supabase.from("payroll_events").select("*").eq("competency_id", id!).order("kind").order("code"),
      ]);
      if (comp.error) throw comp.error;
      return {
        competency: comp.data as any,
        events: (events.data ?? []) as any[],
      };
    },
  });
}

export function usePayrollRubrics() {
  const { organizationId } = useCurrentOrganization();
  return useQuery({
    queryKey: ["payroll_rubrics", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_rubrics" as any).select("*")
        .eq("organization_id", organizationId!).order("sort_order");
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function usePayrollCompetencyAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("payroll-competency", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["payroll-competencies"] });
      const cid = (vars as { competency_id?: string })?.competency_id;
      if (cid) qc.invalidateQueries({ queryKey: ["payroll_competency", cid] });
    },
  });
}
