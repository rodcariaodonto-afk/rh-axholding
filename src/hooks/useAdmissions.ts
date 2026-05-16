import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAdmissions() {
  return useQuery({
    queryKey: ["admission_processes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admission_processes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdmission(id: string | undefined) {
  return useQuery({
    queryKey: ["admission_process", id],
    enabled: !!id,
    queryFn: async () => {
      const [proc, checklist, docs, form, events] = await Promise.all([
        supabase.from("admission_processes").select("*").eq("id", id!).single(),
        supabase.from("admission_checklist_items").select("*").eq("process_id", id!).order("display_order"),
        supabase.from("admission_documents").select("*").eq("process_id", id!).order("doc_type"),
        supabase.from("admission_form_data").select("*").eq("process_id", id!).maybeSingle(),
        supabase.from("admission_events").select("*").eq("process_id", id!).order("created_at", { ascending: false }),
      ]);
      if (proc.error) throw proc.error;
      return {
        process: proc.data,
        checklist: checklist.data ?? [],
        documents: docs.data ?? [],
        form: form.data,
        events: events.data ?? [],
      };
    },
  });
}

export function useCreateAdmission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("admission-create", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.process;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admission_processes"] }),
  });
}

export function useAdmissionAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("admission-action", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admission_processes"] });
      if ((vars as { process_id?: string })?.process_id) {
        qc.invalidateQueries({ queryKey: ["admission_process", (vars as { process_id: string }).process_id] });
      }
    },
  });
}
