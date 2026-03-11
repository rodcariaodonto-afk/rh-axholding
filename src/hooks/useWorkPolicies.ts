import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export interface WorkPolicy {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  description: string | null;
  in_office_days_per_week: number | null;
  in_office_days_per_month: number | null;
  created_at: string;
  updated_at: string;
}

export function useWorkPolicies() {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["work-policies", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("work_policies")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name");
      if (error) throw error;
      return data as WorkPolicy[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateWorkPolicy() {
  const queryClient = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (input: { name: string; type?: string; description?: string; in_office_days_per_week?: number; in_office_days_per_month?: number }) => {
      if (!organizationId) throw new Error("Organização não encontrada");
      const { data, error } = await supabase
        .from("work_policies")
        .insert({
          name: input.name,
          type: input.type || "presencial",
          description: input.description || null,
          in_office_days_per_week: input.in_office_days_per_week ?? null,
          in_office_days_per_month: input.in_office_days_per_month ?? null,
          organization_id: organizationId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-policies"] });
      toast.success("Política criada com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateWorkPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<WorkPolicy> & { id: string }) => {
      const { data, error } = await supabase
        .from("work_policies")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-policies"] });
      toast.success("Política atualizada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWorkPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_policies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-policies"] });
      toast.success("Política removida!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
