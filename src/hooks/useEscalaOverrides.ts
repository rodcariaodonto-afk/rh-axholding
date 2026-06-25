import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

// TODO: criar tabela escala_overrides no Supabase com os campos abaixo antes de usar este hook:
// id          UUID DEFAULT gen_random_uuid() PRIMARY KEY
// organization_id UUID REFERENCES organizations(id)
// employee_id UUID REFERENCES employees(id)
// data        DATE NOT NULL
// tipo_turno  TEXT NOT NULL  -- 'normal' | 'hora_extra' | 'folga' | 'feriado_trabalhado'
// entrada     TIME
// saida       TIME
// motivo      TEXT NOT NULL
// created_at  TIMESTAMPTZ DEFAULT now()

export interface EscalaOverride {
  id: string;
  organization_id: string;
  employee_id: string;
  data: string; // YYYY-MM-DD
  tipo_turno: "normal" | "hora_extra" | "folga" | "feriado_trabalhado";
  entrada: string | null; // HH:mm
  saida: string | null;   // HH:mm
  motivo: string;
  created_at: string;
  employees?: { full_name: string | null; email: string };
}

export interface EscalaOverrideInsert {
  organization_id: string;
  employee_id: string;
  data: string;
  tipo_turno: EscalaOverride["tipo_turno"];
  entrada: string | null;
  saida: string | null;
  motivo: string;
}

export function useEscalaOverrides() {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["escala-overrides", organizationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("escala_overrides")
        .select("*, employees(full_name, email)")
        .eq("organization_id", organizationId!)
        .order("data", { ascending: false });
      if (error) throw error;
      return (data ?? []) as EscalaOverride[];
    },
    enabled: !!organizationId,
    retry: false,
  });
}

export function useCreateEscalaOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (override: EscalaOverrideInsert) => {
      const { data, error } = await (supabase as any)
        .from("escala_overrides")
        .insert(override)
        .select()
        .single();
      if (error) throw error;
      return data as EscalaOverride;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escala-overrides"] });
      toast.success("Override de escala salvo com sucesso.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao salvar override.", { description: error.message });
    },
  });
}

export function useDeleteEscalaOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("escala_overrides")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escala-overrides"] });
      toast.success("Override removido.");
    },
    onError: (error: Error) => {
      toast.error("Erro ao remover override.", { description: error.message });
    },
  });
}
