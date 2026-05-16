import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export function useHrDocuments(employeeId?: string) {
  const { organizationId } = useCurrentOrganization();
  return useQuery({
    queryKey: ["hr-documents", organizationId, employeeId],
    queryFn: async () => {
      let q = supabase.from("hr_documents").select("*, employees:employee_id(full_name, email)")
        .eq("organization_id", organizationId!).order("created_at", { ascending: false });
      if (employeeId) q = q.eq("employee_id", employeeId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });
}

export function useUploadHrDocument() {
  const qc = useQueryClient();
  const { organizationId } = useCurrentOrganization();
  return useMutation({
    mutationFn: async (args: { employee_id: string; kind: string; title: string; file: File; requires_signature?: boolean }) => {
      const path = `${organizationId}/documents/${args.employee_id}/${Date.now()}_${args.file.name}`;
      const { error: upErr } = await supabase.storage.from("employee-files").upload(path, args.file, { upsert: false });
      if (upErr) throw upErr;
      const { data, error } = await supabase.from("hr_documents").insert({
        organization_id: organizationId!,
        employee_id: args.employee_id,
        kind: args.kind as any,
        title: args.title,
        status: "rascunho",
        file_path: path,
        file_mime: args.file.type,
        file_size_bytes: args.file.size,
        requires_signature: args.requires_signature ?? false,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-documents"] });
      toast.success("Documento enviado");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useSendForSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { document_id: string; signers: { email: string; full_name: string }[]; subject: string; message?: string }) => {
      const { data, error } = await supabase.functions.invoke("signature-send", { body: args });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-documents"] });
      toast.success("Enviado para assinatura");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export async function downloadHrFile(path: string) {
  const { data, error } = await supabase.storage.from("employee-files").createSignedUrl(path, 300);
  if (error) throw error;
  window.open(data.signedUrl, "_blank");
}
