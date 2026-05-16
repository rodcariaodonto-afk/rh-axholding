import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export function useMedicalSchedules() {
  const { organizationId } = useCurrentOrganization();
  return useQuery({
    queryKey: ["medical_exam_schedules", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_exam_schedules" as any)
        .select("*, employee:employees(full_name, email)")
        .eq("organization_id", organizationId!)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useMedicalExamAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("medical-exam-manage", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medical_exam_schedules"] });
      qc.invalidateQueries({ queryKey: ["medical_exams"] });
    },
  });
}

export function useTerminationProcesses() {
  const { organizationId } = useCurrentOrganization();
  return useQuery({
    queryKey: ["termination_processes", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("termination_processes" as any)
        .select("*, employee:employees(full_name, email)")
        .eq("organization_id", organizationId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useTerminationProcess(id: string | undefined) {
  return useQuery({
    queryKey: ["termination_process", id],
    enabled: !!id,
    queryFn: async () => {
      const [proc, checklist, events, details] = await Promise.all([
        supabase.from("termination_processes" as any).select("*, employee:employees(full_name, email, hire_date)").eq("id", id!).single(),
        supabase.from("termination_checklist_items" as any).select("*").eq("process_id", id!).order("sort_order"),
        supabase.from("termination_events" as any).select("*").eq("process_id", id!).order("created_at", { ascending: false }),
        supabase.from("termination_details" as any).select("*").eq("employee_id", "00000000-0000-0000-0000-000000000000").maybeSingle(),
      ]);
      if (proc.error) throw proc.error;
      const { data: realDetails } = await supabase.from("termination_details" as any)
        .select("*").eq("employee_id", (proc.data as any).employee_id).maybeSingle();
      return {
        process: proc.data as any,
        checklist: (checklist.data ?? []) as any[],
        events: (events.data ?? []) as any[],
        details: realDetails as any,
      };
    },
  });
}

export function useTerminationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("termination-process", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["termination_processes"] });
      const pid = (vars as { process_id?: string })?.process_id;
      if (pid) qc.invalidateQueries({ queryKey: ["termination_process", pid] });
    },
  });
}
