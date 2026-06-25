import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

// TODO: criar tabela feriados no Supabase com os campos abaixo:
// id              UUID DEFAULT gen_random_uuid() PRIMARY KEY
// organization_id UUID REFERENCES organizations(id)
// nome            TEXT NOT NULL
// data            DATE NOT NULL
// tipo            TEXT NOT NULL  -- 'nacional' | 'estadual' | 'municipal' | 'facultativo'
// recorrente      BOOLEAN DEFAULT false  -- se true, ignora o ano na comparação
// created_at      TIMESTAMPTZ DEFAULT now()

export type FeriadoTipo = "nacional" | "estadual" | "municipal" | "facultativo";

export interface Feriado {
  id: string;
  organization_id: string;
  nome: string;
  data: string; // YYYY-MM-DD
  tipo: FeriadoTipo;
  recorrente: boolean;
  created_at: string;
}

export interface FeriadoInsert {
  organization_id: string;
  nome: string;
  data: string;
  tipo: FeriadoTipo;
  recorrente: boolean;
}

export function useFeriados() {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["feriados", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await (supabase as any)
        .from("feriados")
        .select("*")
        .eq("organization_id", organizationId)
        .order("data", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Feriado[];
    },
    enabled: !!organizationId,
    retry: false,
  });
}

export function useCreateFeriado() {
  const queryClient = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (input: Omit<FeriadoInsert, "organization_id">) => {
      if (!organizationId) throw new Error("Organização não encontrada");
      const { data, error } = await (supabase as any)
        .from("feriados")
        .insert({ ...input, organization_id: organizationId })
        .select()
        .single();
      if (error) throw error;
      return data as Feriado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feriados"] });
      toast.success("Feriado cadastrado com sucesso.");
    },
    onError: (e: Error) => toast.error("Erro ao cadastrar feriado.", { description: e.message }),
  });
}

export function useDeleteFeriado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("feriados").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feriados"] });
      toast.success("Feriado removido.");
    },
    onError: (e: Error) => toast.error("Erro ao remover feriado.", { description: e.message }),
  });
}
