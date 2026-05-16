import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export type EpiItem = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  ca_number: string | null;
  ca_expires_at: string | null;
  manufacturer: string | null;
  category: string | null;
  unit: string;
  stock_qty: number;
  min_stock_qty: number;
  durability_days: number | null;
  is_active: boolean;
  created_at: string;
};

export type EpiDelivery = {
  id: string;
  organization_id: string;
  employee_id: string;
  epi_id: string;
  quantity: number;
  delivered_at: string;
  expected_return_at: string | null;
  ca_at_delivery: string | null;
  notes: string | null;
  status: "entregue" | "aguardando_assinatura" | "assinado" | "devolvido" | "cancelado";
  signed_at: string | null;
  returned_at: string | null;
  returned_qty: number | null;
  return_condition: string | null;
  created_at: string;
  epi?: { name: string; code: string; ca_number: string | null } | null;
  employee?: { full_name: string; email: string } | null;
};

export function useEpiCatalog() {
  const { organizationId } = useCurrentOrganization();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["epi-catalog", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase.from("epi_catalog" as any)
        .select("*").eq("organization_id", organizationId!)
        .order("name");
      if (error) throw error;
      return (data ?? []) as unknown as EpiItem[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: Partial<EpiItem> & { code: string; name: string }) => {
      const payload: any = { ...input, organization_id: organizationId! };
      const { error } = input.id
        ? await supabase.from("epi_catalog" as any).update(payload).eq("id", input.id)
        : await supabase.from("epi_catalog" as any).insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("EPI salvo");
      qc.invalidateQueries({ queryKey: ["epi-catalog"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("epi_catalog" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("EPI removido");
      qc.invalidateQueries({ queryKey: ["epi-catalog"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { list, upsert, remove };
}

export function useEpiDeliveries(employeeId?: string) {
  const { organizationId } = useCurrentOrganization();
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ["epi-deliveries", organizationId, employeeId],
    enabled: !!organizationId,
    queryFn: async () => {
      let q = supabase.from("epi_deliveries" as any)
        .select("*, epi:epi_catalog(name, code, ca_number), employee:employees(full_name, email)")
        .eq("organization_id", organizationId!)
        .order("delivered_at", { ascending: false });
      if (employeeId) q = q.eq("employee_id", employeeId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as EpiDelivery[];
    },
  });

  const invoke = async (body: any) => {
    const { data, error } = await supabase.functions.invoke("epi-manage", { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const deliver = useMutation({
    mutationFn: (i: { epi_id: string; employee_id: string; quantity: number; expected_return_at?: string | null; notes?: string }) =>
      invoke({ action: "deliver", ...i }),
    onSuccess: () => {
      toast.success("EPI entregue");
      qc.invalidateQueries({ queryKey: ["epi-deliveries"] });
      qc.invalidateQueries({ queryKey: ["epi-catalog"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const sign = useMutation({
    mutationFn: (delivery_id: string) => invoke({ action: "sign_delivery", delivery_id }),
    onSuccess: () => {
      toast.success("Recebimento assinado");
      qc.invalidateQueries({ queryKey: ["epi-deliveries"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const returnEpi = useMutation({
    mutationFn: (i: { delivery_id: string; returned_qty?: number; return_condition: string }) =>
      invoke({ action: "return", ...i }),
    onSuccess: () => {
      toast.success("Devolução registrada");
      qc.invalidateQueries({ queryKey: ["epi-deliveries"] });
      qc.invalidateQueries({ queryKey: ["epi-catalog"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const stockIn = useMutation({
    mutationFn: (i: { epi_id: string; quantity: number; unit_cost?: number; reason?: string }) =>
      invoke({ action: "stock_in", ...i }),
    onSuccess: () => {
      toast.success("Entrada registrada");
      qc.invalidateQueries({ queryKey: ["epi-catalog"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const stockAdjust = useMutation({
    mutationFn: (i: { epi_id: string; new_quantity: number; reason?: string }) =>
      invoke({ action: "stock_adjust", ...i }),
    onSuccess: () => {
      toast.success("Estoque ajustado");
      qc.invalidateQueries({ queryKey: ["epi-catalog"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { list, deliver, sign, returnEpi, stockIn, stockAdjust };
}
