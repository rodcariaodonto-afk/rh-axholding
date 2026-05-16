import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "sonner";

export type OnboardingProcess = {
  id: string;
  organization_id: string;
  employee_id: string;
  template_id: string | null;
  status: "pendente" | "em_andamento" | "concluido" | "cancelado";
  started_at: string | null;
  expected_completion_at: string | null;
  completed_at: string | null;
  responsible_user_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  employee?: { full_name: string; email: string } | null;
};

export type OnboardingTask = {
  id: string;
  process_id: string;
  organization_id: string;
  employee_id: string;
  title: string;
  description: string | null;
  task_type: "documento" | "formulario" | "exame" | "treinamento" | "assinatura" | "tarefa";
  responsible_role: string;
  status: "pendente" | "em_andamento" | "concluido" | "dispensado";
  required: boolean;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
};

export function useOnboardingProcesses() {
  const { currentOrganization } = useOrganization();
  const qc = useQueryClient();
  const orgId = currentOrganization?.id;

  const list = useQuery({
    queryKey: ["onboarding_processes", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_processes" as any)
        .select("*, employee:employees(full_name, email)")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OnboardingProcess[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: { employee_id: string; template_id?: string | null; expected_completion_at?: string }) => {
      const { data, error } = await supabase
        .from("onboarding_processes" as any)
        .insert({
          organization_id: orgId!,
          employee_id: input.employee_id,
          template_id: input.template_id ?? null,
          expected_completion_at: input.expected_completion_at ?? null,
          status: "pendente",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Processo de onboarding criado");
      qc.invalidateQueries({ queryKey: ["onboarding_processes", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar processo"),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OnboardingProcess["status"] }) => {
      const patch: any = { status };
      if (status === "em_andamento") patch.started_at = new Date().toISOString();
      if (status === "concluido") patch.completed_at = new Date().toISOString();
      const { error } = await supabase.from("onboarding_processes" as any).update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["onboarding_processes", orgId] }),
  });

  return { list, create, updateStatus };
}

export function useOnboardingTasks(processId?: string) {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["onboarding_tasks", processId],
    enabled: !!processId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_tasks" as any)
        .select("*")
        .eq("process_id", processId!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as OnboardingTask[];
    },
  });

  const completeTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("onboarding_tasks" as any)
        .update({ status: "concluido", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tarefa concluída");
      qc.invalidateQueries({ queryKey: ["onboarding_tasks", processId] });
    },
  });

  return { list, completeTask };
}
