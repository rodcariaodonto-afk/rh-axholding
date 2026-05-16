import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "@/hooks/use-toast";

export type InconsistencyStatus = "open" | "in_review" | "resolved" | "justified" | "ignored";
export type InconsistencySeverity = "info" | "warning" | "critical";
export type InconsistencyType =
  | "falta" | "atraso" | "saida_antecipada" | "marcacao_faltante" | "marcacao_excedente"
  | "jornada_nao_cumprida" | "fora_da_cerca" | "intervalo_insuficiente" | "duplicado"
  | "horas_extras_nao_autorizadas";

export interface TimeInconsistency {
  id: string;
  organization_id: string;
  employee_id: string;
  manager_id: string | null;
  day: string;
  type: InconsistencyType;
  severity: InconsistencySeverity;
  status: InconsistencyStatus;
  expected_value: unknown;
  actual_value: unknown;
  description: string | null;
  raw_event_id: string | null;
  time_entry_id: string | null;
  justification_id: string | null;
  resolution_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useTimeInconsistencies(filters?: { status?: InconsistencyStatus; employeeId?: string; from?: string; to?: string }) {
  const { organization } = useCurrentOrganization();
  return useQuery({
    queryKey: ["time-inconsistencies", organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return [];
      let q = supabase
        .from("time_inconsistencies")
        .select("*")
        .eq("organization_id", organization.id)
        .order("day", { ascending: false })
        .limit(500);
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.employeeId) q = q.eq("employee_id", filters.employeeId);
      if (filters?.from) q = q.gte("day", filters.from);
      if (filters?.to) q = q.lte("day", filters.to);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as TimeInconsistency[];
    },
    enabled: !!organization?.id,
  });
}

export function useResolveInconsistency() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; status: InconsistencyStatus; notes?: string }) => {
      const { error } = await supabase
        .from("time_inconsistencies")
        .update({
          status: input.status,
          resolution_notes: input.notes ?? null,
          resolved_at: new Date().toISOString(),
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-inconsistencies"] });
      toast({ title: "Inconsistência tratada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
