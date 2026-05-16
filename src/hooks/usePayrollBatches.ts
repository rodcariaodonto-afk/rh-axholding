import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePayrollBatches() {
  return useQuery({
    queryKey: ["payroll_batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_receipt_batches")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePayrollBatch(id: string | undefined) {
  return useQuery({
    queryKey: ["payroll_batch", id],
    enabled: !!id,
    queryFn: async () => {
      const [batch, receipts] = await Promise.all([
        supabase.from("payroll_receipt_batches").select("*").eq("id", id!).single(),
        supabase.from("payroll_receipts")
          .select("*, employees:employee_id(id, full_name, email)")
          .eq("batch_id", id!)
          .order("file_name"),
      ]);
      if (batch.error) throw batch.error;
      return { batch: batch.data, receipts: receipts.data ?? [] };
    },
  });
}

export function usePayrollBatchAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase.functions.invoke("payroll-batch", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["payroll_batches"] });
      const v = vars as { batch_id?: string };
      if (v.batch_id) qc.invalidateQueries({ queryKey: ["payroll_batch", v.batch_id] });
    },
  });
}

export async function downloadReceipt(receipt_id: string, acknowledge = false) {
  const { data, error } = await supabase.functions.invoke("payroll-receipt-download", {
    body: { receipt_id, acknowledge },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  window.open(data.url, "_blank");
}

export function useMyPayrollReceipts() {
  return useQuery({
    queryKey: ["my-payroll-receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payroll_receipts")
        .select("*, payroll_receipt_batches(competency, receipt_type)")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
