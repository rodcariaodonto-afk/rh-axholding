// TODO: executar DDL antes de usar este módulo:
//
// CREATE TABLE documentos_central (
//   id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
//   employee_id     UUID REFERENCES employees(id) ON DELETE SET NULL,
//   document_name   TEXT NOT NULL,
//   file_url        TEXT NOT NULL,   -- caminho no bucket "documentos" (sem URL base)
//   file_type       TEXT,
//   file_size       BIGINT,
//   category        TEXT NOT NULL,   -- 'admissao' | 'demissao' | 'contrato' | 'aso_saude' | 'treinamento' | 'fiscal' | 'outros'
//   expires_at      DATE,
//   uploaded_by     UUID REFERENCES employees(id) ON DELETE SET NULL,
//   created_at      TIMESTAMPTZ DEFAULT now(),
//   updated_at      TIMESTAMPTZ DEFAULT now()
// );
// CREATE INDEX ON documentos_central (organization_id);
// CREATE INDEX ON documentos_central (employee_id);
// CREATE INDEX ON documentos_central (category);
// CREATE INDEX ON documentos_central (expires_at);
// -- Habilitar RLS e criar políticas de acesso por organization_id.
// -- Bucket Storage "documentos" deve ser privado; acesso via signed URL.

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export interface DocumentoCentral {
  id: string;
  organization_id: string;
  employee_id: string | null;
  employee_name: string | null;
  document_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: string;
  expires_at: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface UploadDocumentoParams {
  employee_id: string;
  document_name: string;
  category: string;
  expires_at?: string | null;
  file: File;
}

const BUCKET = "documentos";

export function useDocumentosCentral() {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["documentos-central", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await (supabase as any)
        .from("documentos_central")
        .select(`
          id,
          organization_id,
          employee_id,
          document_name,
          file_url,
          file_type,
          file_size,
          category,
          expires_at,
          uploaded_by,
          created_at,
          employee:employee_id(full_name)
        `)
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return ((data ?? []) as any[]).map((d) => ({
        id: d.id,
        organization_id: d.organization_id,
        employee_id: d.employee_id,
        employee_name: d.employee?.full_name ?? null,
        document_name: d.document_name,
        file_url: d.file_url,
        file_type: d.file_type,
        file_size: d.file_size,
        category: d.category,
        expires_at: d.expires_at,
        uploaded_by: d.uploaded_by,
        created_at: d.created_at,
      })) as DocumentoCentral[];
    },
    enabled: !!organizationId,
    retry: false,
  });
}

export function useUploadDocumento() {
  const queryClient = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (params: UploadDocumentoParams) => {
      if (!organizationId) throw new Error("Organização não encontrada");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const ext = params.file.name.split(".").pop();
      const filePath = `${organizationId}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, params.file);

      if (uploadError) throw new Error("Erro ao fazer upload: " + uploadError.message);

      const { error: dbError } = await (supabase as any)
        .from("documentos_central")
        .insert({
          organization_id: organizationId,
          employee_id: params.employee_id,
          document_name: params.document_name,
          file_url: filePath,
          file_type: params.file.type,
          file_size: params.file.size,
          category: params.category,
          expires_at: params.expires_at || null,
          uploaded_by: user.id,
        });

      if (dbError) {
        await supabase.storage.from(BUCKET).remove([filePath]);
        throw new Error("Erro ao salvar documento: " + dbError.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos-central"] });
      toast.success("Documento enviado com sucesso.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: { id: string; file_url: string }) => {
      await supabase.storage.from(BUCKET).remove([doc.file_url]);

      const { error } = await (supabase as any)
        .from("documentos_central")
        .delete()
        .eq("id", doc.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos-central"] });
      toast.success("Documento excluído.");
    },
    onError: (e: Error) => toast.error("Erro ao excluir documento.", { description: e.message }),
  });
}

export async function getDocumentoSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(filePath, 300);

  if (error || !data?.signedUrl) throw new Error("Não foi possível gerar URL de acesso");
  return data.signedUrl;
}
