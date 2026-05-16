import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export type MedicalExam = {
  id: string;
  organization_id: string;
  employee_id: string;
  exam_type: "admissional" | "periodico" | "retorno_ao_trabalho" | "mudanca_de_funcao" | "demissional" | "complementar";
  exam_date: string;
  valid_until: string | null;
  doctor_name: string | null;
  doctor_crm: string | null;
  clinic_name: string | null;
  result: "apto" | "apto_com_restricoes" | "inapto" | "pendente" | null;
  restrictions: string | null;
  file_path: string | null;
  notes: string | null;
  created_at: string;
  employee?: { full_name: string; email: string } | null;
};

export function useMedicalExams() {
  const { organizationId } = useCurrentOrganization();
  const qc = useQueryClient();
  const orgId = organizationId;

  const list = useQuery({
    queryKey: ["medical_exams", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_exams" as any)
        .select("*, employee:employees(full_name, email)")
        .eq("organization_id", orgId!)
        .order("exam_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as MedicalExam[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: Omit<MedicalExam, "id" | "organization_id" | "created_at" | "employee">) => {
      const { error } = await supabase.from("medical_exams" as any).insert({ ...input, organization_id: orgId! });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Exame ocupacional registrado");
      qc.invalidateQueries({ queryKey: ["medical_exams", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao registrar exame"),
  });

  return { list, create };
}
