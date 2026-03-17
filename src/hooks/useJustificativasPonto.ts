import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface JustificativaPonto {
  id: string;
  organization_id: string;
  employee_id: string;
  tipo_registro: string;
  data_evento: string;
  descricao_evento: string | null;
  horario_evento: string | null;
  duracao_minutos: number | null;
  motivo: string | null;
  descricao_justificativa: string | null;
  arquivo_url: string | null;
  tipo_documento: string | null;
  status: string;
  data_envio: string | null;
  data_aprovacao: string | null;
  data_rejeicao: string | null;
  motivo_rejeicao: string | null;
  aprovado_por: string | null;
  created_at: string;
  updated_at: string;
}

export function useJustificativasPonto(employeeId?: string) {
  const { organizationId } = useCurrentOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["justificativas_ponto", organizationId, employeeId];

  const { data: justificativas = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) return [];
      let query = (supabase as any)
        .from("justificativas_ponto")
        .select("*")
        .eq("organization_id", organizationId)
        .order("data_evento", { ascending: false });

      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as JustificativaPonto[];
    },
    enabled: !!organizationId,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<JustificativaPonto>) => {
      const { error } = await (supabase as any)
        .from("justificativas_ponto")
        .insert({
          ...payload,
          organization_id: organizationId,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["justificativas_ponto"] });
      toast.success("Justificativa enviada com sucesso");
    },
    onError: () => toast.error("Erro ao enviar justificativa"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...payload }: Partial<JustificativaPonto> & { id: string }) => {
      const { error } = await (supabase as any)
        .from("justificativas_ponto")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["justificativas_ponto"] });
      toast.success("Justificativa atualizada");
    },
    onError: () => toast.error("Erro ao atualizar justificativa"),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("justificativas_ponto")
        .update({
          status: "aprovada",
          data_aprovacao: new Date().toISOString(),
          aprovado_por: user?.id,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["justificativas_ponto"] });
      toast.success("Justificativa aprovada");
    },
    onError: () => toast.error("Erro ao aprovar"),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, motivo_rejeicao }: { id: string; motivo_rejeicao: string }) => {
      const { error } = await (supabase as any)
        .from("justificativas_ponto")
        .update({
          status: "rejeitada",
          data_rejeicao: new Date().toISOString(),
          aprovado_por: user?.id,
          motivo_rejeicao,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["justificativas_ponto"] });
      toast.success("Justificativa rejeitada");
    },
    onError: () => toast.error("Erro ao rejeitar"),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("justificativas_ponto")
        .update({ status: "pendente_justificativa", descricao_justificativa: null, motivo: null, arquivo_url: null, data_envio: null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["justificativas_ponto"] });
      toast.success("Justificativa cancelada");
    },
    onError: () => toast.error("Erro ao cancelar"),
  });

  const uploadFile = async (file: File, justificativaId: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${organizationId}/${justificativaId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("justificativa-anexos").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar arquivo");
      return null;
    }
    const { data: urlData } = supabase.storage.from("justificativa-anexos").getPublicUrl(path);
    return urlData.publicUrl;
  };

  return {
    justificativas,
    isLoading,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    approve: approveMutation.mutate,
    reject: rejectMutation.mutate,
    cancel: cancelMutation.mutate,
    uploadFile,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isApproving: approveMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
