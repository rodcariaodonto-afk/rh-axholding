import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export interface WorkSchedule {
  id: string;
  organization_id: string;
  name: string;
  type: string;
  hours_per_week: number;
  work_days: string[];
  hours_per_day: number;
  late_tolerance_minutes: number;
  overtime_rules: any;
  hour_bank_rules: any;
  created_at: string;
  updated_at: string;
}

export function useWorkSchedules() {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["work-schedules", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("work_schedules")
        .select("*")
        .eq("organization_id", organizationId)
        .order("name");
      if (error) throw error;
      return data as WorkSchedule[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateWorkSchedule() {
  const queryClient = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (input: { name: string; type?: string; hours_per_week?: number; work_days?: string[]; hours_per_day?: number; late_tolerance_minutes?: number }) => {
      if (!organizationId) throw new Error("Organização não encontrada");
      const { data, error } = await supabase
        .from("work_schedules")
        .insert({
          name: input.name,
          type: input.type || "standard",
          hours_per_week: input.hours_per_week ?? 44,
          work_days: input.work_days || ["mon","tue","wed","thu","fri"],
          hours_per_day: input.hours_per_day ?? 8,
          late_tolerance_minutes: input.late_tolerance_minutes ?? 10,
          organization_id: organizationId,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-schedules"] });
      toast.success("Escala criada com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateWorkSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<WorkSchedule> & { id: string }) => {
      const { data, error } = await supabase
        .from("work_schedules")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-schedules"] });
      toast.success("Escala atualizada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWorkSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-schedules"] });
      toast.success("Escala removida!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
