import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export type ExportJobType =
  | "payroll_csv"
  | "payroll_pdf"
  | "time_entries_csv"
  | "absenteeism_csv"
  | "inconsistencies_csv"
  | "employees_csv"
  | "audit_csv"
  | "custom";

export function useExportJobs() {
  const { organizationId } = useCurrentOrganization();
  return useQuery({
    queryKey: ["export-jobs", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("export_jobs")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
    refetchInterval: 5000,
  });
}

export function useCreateExportJob() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async ({ job_type, params }: { job_type: ExportJobType; params?: any }) => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("Não autenticado");
      const { data: job, error } = await supabase
        .from("export_jobs")
        .insert({
          organization_id: organizationId!,
          job_type,
          params: params ?? {},
          requested_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Trigger async processing
      supabase.functions.invoke("exports-run", { body: { job_id: job.id } }).catch(() => {});
      return job;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["export-jobs"] });
      toast.success("Exportação enfileirada");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export async function downloadExportFile(path: string) {
  const { data, error } = await supabase.storage.from("payroll-exports").createSignedUrl(path, 300);
  if (error) throw error;
  window.open(data.signedUrl, "_blank");
}
