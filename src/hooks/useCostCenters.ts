import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "@/hooks/use-toast";

export interface CostCenter {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  cnpj: string | null;
  responsible_id: string | null;
  address: unknown;
  active: boolean;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

export function useCostCenters(opts?: { activeOnly?: boolean }) {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ["cost-centers", orgId, opts?.activeOnly ?? false],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from("cost_centers")
        .select("*")
        .eq("organization_id", orgId)
        .order("code", { ascending: true });
      if (opts?.activeOnly) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CostCenter[];
    },
    enabled: !!orgId,
  });
}

export function useUpsertCostCenter() {
  const qc = useQueryClient();
  const { organization } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (input: Partial<CostCenter> & { code: string; name: string }) => {
      if (!organization?.id) throw new Error("Organização não encontrada");
      const payload = { ...input, organization_id: organization.id } as never;
      if (input.id) {
        const { data, error } = await supabase
          .from("cost_centers")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("cost_centers")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cost-centers"] });
      toast({ title: "Centro de custo salvo" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cost_centers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cost-centers"] });
      toast({ title: "Centro de custo removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
