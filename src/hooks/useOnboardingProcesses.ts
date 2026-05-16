import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
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
  public_token: string | null;
  portal_started_at: string | null;
  portal_submitted_at: string | null;
  portal_data: Record<string, any>;
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

export type OnboardingDocument = {
  id: string;
  process_id: string;
  organization_id: string;
  employee_id: string;
  doc_type: string;
  doc_label: string;
  status: "pendente" | "enviado" | "aprovado" | "rejeitado";
  required: boolean;
  file_path: string | null;
  file_name: string | null;
  uploaded_at: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
};

async function invoke(action: string, payload: any = {}) {
  const { data, error } = await supabase.functions.invoke("onboarding-manage", { body: { action, payload } });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

export function useOnboardingProcesses() {
  const { organizationId } = useCurrentOrganization();
  const qc = useQueryClient();
  const orgId = organizationId;

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
    mutationFn: async (input: { employee_id: string; expected_completion_at?: string }) =>
      invoke("create_process", input),
    onSuccess: () => {
      toast.success("Processo de onboarding criado com sucesso");
      qc.invalidateQueries({ queryKey: ["onboarding_processes", orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao criar processo"),
  });

  const regenerateToken = useMutation({
    mutationFn: async (process_id: string) => invoke("regenerate_token", { process_id }),
    onSuccess: () => {
      toast.success("Novo link gerado");
      qc.invalidateQueries({ queryKey: ["onboarding_processes", orgId] });
    },
    onError: (e: any) => toast.error(e.message),
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

  return { list, create, updateStatus, regenerateToken };
}

export function useOnboardingProcess(processId?: string) {
  const qc = useQueryClient();

  const process = useQuery({
    queryKey: ["onboarding_process", processId],
    enabled: !!processId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_processes" as any)
        .select("*, employee:employees(full_name, email)")
        .eq("id", processId!)
        .single();
      if (error) throw error;
      return data as unknown as OnboardingProcess;
    },
  });

  const tasks = useQuery({
    queryKey: ["onboarding_tasks", processId],
    enabled: !!processId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_tasks" as any).select("*").eq("process_id", processId!).order("sort_order");
      if (error) throw error;
      return (data ?? []) as unknown as OnboardingTask[];
    },
  });

  const documents = useQuery({
    queryKey: ["onboarding_documents", processId],
    enabled: !!processId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("onboarding_documents" as any).select("*").eq("process_id", processId!).order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as OnboardingDocument[];
    },
  });

  const toggleTask = useMutation({
    mutationFn: async ({ task_id, status }: { task_id: string; status: OnboardingTask["status"] }) =>
      invoke("toggle_task", { task_id, status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding_tasks", processId] });
      toast.success("Tarefa atualizada");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reviewDocument = useMutation({
    mutationFn: async (input: { document_id: string; status: "aprovado" | "rejeitado"; notes?: string }) =>
      invoke("review_document", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["onboarding_documents", processId] });
      toast.success("Documento revisado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { process, tasks, documents, toggleTask, reviewDocument };
}
