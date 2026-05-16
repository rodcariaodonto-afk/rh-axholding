import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export type Receipt = {
  id: string;
  organization_id: string;
  employee_id: string;
  receipt_type: "vale" | "adiantamento" | "epi" | "uniforme" | "ferramenta" | "treinamento" | "outro";
  reference_competency: string | null;
  description: string;
  amount: number | null;
  quantity: number | null;
  item_description: string | null;
  delivered_at: string | null;
  file_path: string | null;
  status: "pendente" | "aguardando_assinatura" | "assinado" | "cancelado";
  acknowledged_at: string | null;
  created_at: string;
  employee?: { full_name: string; email: string } | null;
};

export function useReceipts() {
  const { currentOrganization } = useOrganization();
  const qc = useQueryClient();
  const orgId = currentOrganization?.id;

  const list = useQuery({
    queryKey: ["receipts", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts" as any)
        .select("*, employee:employees(full_name, email)")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Receipt[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: Partial<Receipt> & { employee_id: string; receipt_type: Receipt["receipt_type"]; description: string }) => {
      const { error } = await supabase.from("receipts" as any).insert({
        organization_id: orgId!,
        employee_id: input.employee_id,
        receipt_type: input.receipt_type,
        description: input.description,
        amount: input.amount ?? null,
        quantity: input.quantity ?? null,
        item_description: input.item_description ?? null,
        delivered_at: input.delivered_at ?? null,
        reference_competency: input.reference_competency ?? null,
        status: "pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recibo registrado");
      qc.invalidateQueries({ queryKey: ["receipts", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao registrar recibo"),
  });

  const acknowledge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("receipts" as any)
        .update({ status: "assinado", acknowledged_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recibo confirmado");
      qc.invalidateQueries({ queryKey: ["receipts", orgId] });
    },
  });

  return { list, create, acknowledge };
}
