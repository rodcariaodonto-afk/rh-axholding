import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export type PendingTaskStatus = "open" | "in_progress" | "done" | "dismissed";
export type PendingTaskPriority = "low" | "medium" | "high" | "urgent";

export interface PendingTask {
  id: string;
  organization_id: string;
  assigned_to: string;
  created_by: string | null;
  module: string;
  task_type: string;
  title: string;
  description: string | null;
  priority: PendingTaskPriority;
  status: PendingTaskStatus;
  due_at: string | null;
  related_resource_type: string | null;
  related_resource_id: string | null;
  action_url: string | null;
  metadata: unknown;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useMyPendingTasks(status: PendingTaskStatus[] = ["open", "in_progress"]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-pending-tasks", user?.id, status],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("pending_tasks")
        .select("*")
        .eq("assigned_to", user.id)
        .in("status", status)
        .order("priority", { ascending: false })
        .order("due_at", { ascending: true, nullsFirst: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as PendingTask[];
    },
    enabled: !!user?.id,
  });
}

export function useOrgPendingTasks(filters?: { status?: PendingTaskStatus; module?: string }) {
  const { organization } = useCurrentOrganization();
  return useQuery({
    queryKey: ["org-pending-tasks", organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return [];
      let q = supabase
        .from("pending_tasks")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(200);
      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.module) q = q.eq("module", filters.module);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PendingTask[];
    },
    enabled: !!organization?.id,
  });
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PendingTaskStatus }) => {
      const payload: { status: PendingTaskStatus; completed_at?: string | null } = { status };
      if (status === "done") payload.completed_at = new Date().toISOString();
      const { error } = await supabase.from("pending_tasks").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-pending-tasks"] });
      qc.invalidateQueries({ queryKey: ["org-pending-tasks"] });
      toast({ title: "Tarefa atualizada" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}
