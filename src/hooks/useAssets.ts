import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export type Asset = {
  id: string;
  organization_id: string;
  tag: string;
  category: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  description: string | null;
  acquired_at: string | null;
  acquired_value: number | null;
  invoice_number: string | null;
  warranty_until: string | null;
  status: "disponivel" | "em_uso" | "manutencao" | "devolvido" | "baixado" | "perdido";
  current_assignee_id: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  current_assignee?: { full_name: string; email: string } | null;
};

export type AssetAssignment = {
  id: string;
  asset_id: string;
  employee_id: string;
  assigned_at: string;
  expected_return_at: string | null;
  returned_at: string | null;
  return_condition: string | null;
  status: "ativa" | "aguardando_assinatura" | "devolvida" | "cancelada";
  signed_at: string | null;
  notes: string | null;
  asset?: Asset | null;
  employee?: { full_name: string; email: string } | null;
};

export function useAssets() {
  const { organizationId } = useCurrentOrganization();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["assets", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase.from("assets" as any)
        .select("*, current_assignee:employees!assets_current_assignee_id_fkey(full_name, email)")
        .eq("organization_id", organizationId!)
        .order("tag");
      if (error) {
        // fallback if FK alias missing
        const { data: d2, error: e2 } = await supabase.from("assets" as any)
          .select("*").eq("organization_id", organizationId!).order("tag");
        if (e2) throw e2;
        return (d2 ?? []) as unknown as Asset[];
      }
      return (data ?? []) as unknown as Asset[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<Asset> & { tag: string; category: string }) => {
      const payload: any = { ...input, organization_id: organizationId! };
      const { error } = input.id
        ? await supabase.from("assets" as any).update(payload).eq("id", input.id)
        : await supabase.from("assets" as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Patrimônio salvo");
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assets" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Patrimônio removido");
      qc.invalidateQueries({ queryKey: ["assets"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const assign = useMutation({
    mutationFn: async (input: { asset_id: string; employee_id: string; expected_return_at?: string | null; notes?: string }) => {
      const { error } = await supabase.from("asset_assignments" as any).insert({
        organization_id: organizationId!,
        asset_id: input.asset_id,
        employee_id: input.employee_id,
        expected_return_at: input.expected_return_at ?? null,
        notes: input.notes ?? null,
        status: "ativa",
      });
      if (error) throw error;
      const { error: e2 } = await supabase.from("assets" as any).update({
        status: "em_uso", current_assignee_id: input.employee_id,
      }).eq("id", input.asset_id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Patrimônio atribuído");
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["asset-assignments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const returnAsset = useMutation({
    mutationFn: async (input: { assignment_id: string; asset_id: string; return_condition: string }) => {
      const { error } = await supabase.from("asset_assignments" as any).update({
        status: "devolvida",
        returned_at: new Date().toISOString().slice(0, 10),
        return_condition: input.return_condition,
      }).eq("id", input.assignment_id);
      if (error) throw error;
      const newStatus = input.return_condition === "bom" ? "disponivel" : "manutencao";
      const { error: e2 } = await supabase.from("assets" as any).update({
        status: newStatus, current_assignee_id: null,
      }).eq("id", input.asset_id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Devolução registrada");
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["asset-assignments"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { list, upsert, remove, assign, returnAsset };
}

export function useAssetAssignments(employeeId?: string) {
  const { organizationId } = useCurrentOrganization();
  return useQuery({
    queryKey: ["asset-assignments", organizationId, employeeId],
    enabled: !!organizationId,
    queryFn: async () => {
      let q = supabase.from("asset_assignments" as any)
        .select("*, asset:assets(*), employee:employees(full_name, email)")
        .eq("organization_id", organizationId!)
        .order("assigned_at", { ascending: false });
      if (employeeId) q = q.eq("employee_id", employeeId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as AssetAssignment[];
    },
  });
}
