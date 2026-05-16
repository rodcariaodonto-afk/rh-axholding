import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export function usePayrollCompetencies() {
  const { organizationId } = useCurrentOrganization();
  return useQuery({
    queryKey: ["payroll-competencies", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_competencies")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
}

export function useCreatePayrollCompetency() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const { data, error } = await supabase
        .from("payroll_competencies")
        .insert({ organization_id: organizationId!, year, month })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-competencies"] });
      toast.success("Competência aberta");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateCompetencyStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const patch: any = { status };
      if (status === "fechada") {
        patch.closed_at = new Date().toISOString();
        patch.closed_by = (await supabase.auth.getUser()).data.user?.id;
      }
      if (status === "paga") patch.paid_at = new Date().toISOString();
      const { error } = await supabase.from("payroll_competencies").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payroll-competencies"] });
      toast.success("Status atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
