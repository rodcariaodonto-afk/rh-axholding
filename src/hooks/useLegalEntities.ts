import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "@/hooks/use-toast";

export interface LegalEntity {
  id: string;
  organization_id: string;
  legal_name: string;
  trade_name: string | null;
  cnpj: string;
  state_registration: string | null;
  municipal_registration: string | null;
  cnae_code: string | null;
  address: unknown;
  active: boolean;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

export function useLegalEntities(opts?: { activeOnly?: boolean }) {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ["legal-entities", orgId, opts?.activeOnly ?? false],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from("legal_entities")
        .select("*")
        .eq("organization_id", orgId)
        .order("legal_name", { ascending: true });
      if (opts?.activeOnly) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LegalEntity[];
    },
    enabled: !!orgId,
  });
}

export function useUpsertLegalEntity() {
  const qc = useQueryClient();
  const { organization } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (input: Partial<LegalEntity> & { legal_name: string; cnpj: string }) => {
      if (!organization?.id) throw new Error("Organização não encontrada");
      const payload = { ...input, organization_id: organization.id } as never;
      if (input.id) {
        const { data, error } = await supabase
          .from("legal_entities")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("legal_entities")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["legal-entities"] });
      toast({ title: "CNPJ salvo" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteLegalEntity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("legal_entities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["legal-entities"] });
      toast({ title: "CNPJ removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
