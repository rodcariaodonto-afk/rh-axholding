import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export function useMyPayslips() {
  return useQuery({
    queryKey: ["my-payslips"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("payslips")
        .select("*, payroll_competencies(reference_label, year, month)")
        .eq("employee_id", user.id)
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useOrgPayslips(competencyId?: string) {
  const { organizationId } = useCurrentOrganization();
  return useQuery({
    queryKey: ["org-payslips", organizationId, competencyId],
    queryFn: async () => {
      let q = supabase.from("payslips")
        .select("*, employees:employee_id(full_name, email), payroll_competencies(reference_label)")
        .eq("organization_id", organizationId!)
        .order("published_at", { ascending: false });
      if (competencyId) q = q.eq("competency_id", competencyId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
}

export function useUploadPayslip() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async (args: { competency_id: string; employee_id: string; file: File; net_amount?: number; gross_amount?: number }) => {
      const path = `${organizationId}/payslips/${args.competency_id}/${args.employee_id}.pdf`;
      const { error: upErr } = await supabase.storage.from("employee-files").upload(path, args.file, { upsert: true, contentType: "application/pdf" });
      if (upErr) throw upErr;
      const { data, error } = await supabase.from("payslips").upsert({
        organization_id: organizationId!,
        competency_id: args.competency_id,
        employee_id: args.employee_id,
        source: "batch_upload",
        file_path: path,
        file_size_bytes: args.file.size,
        net_amount: args.net_amount,
        gross_amount: args.gross_amount,
        published_at: new Date().toISOString(),
      }, { onConflict: "organization_id,competency_id,employee_id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-payslips"] });
      toast.success("Holerite publicado");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useAcknowledgePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payslips").update({
        ack_status: "acknowledged",
        acknowledged_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-payslips"] });
      toast.success("Ciência registrada");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export async function downloadPayslip(path: string, id: string) {
  const { data, error } = await supabase.storage.from("employee-files").createSignedUrl(path, 300);
  if (error) throw error;
  // mark viewed
  await supabase.from("payslips").update({
    ack_status: "viewed", viewed_at: new Date().toISOString(),
  }).eq("id", id).is("viewed_at", null);
  window.open(data.signedUrl, "_blank");
}
