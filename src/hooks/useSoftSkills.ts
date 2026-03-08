import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SoftSkill {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  level_junior: number;
  level_pleno: number;
  level_senior: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSoftSkillInput {
  organization_id: string;
  name: string;
  description?: string;
  level_junior?: number;
  level_pleno?: number;
  level_senior?: number;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateSoftSkillInput {
  name?: string;
  description?: string;
  level_junior?: number;
  level_pleno?: number;
  level_senior?: number;
  display_order?: number;
  is_active?: boolean;
}

export function useSoftSkills(organizationId?: string) {
  return useQuery({
    queryKey: ["soft-skills", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("soft_skills")
        .select("*")
        .eq("organization_id", organizationId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as SoftSkill[];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSoftSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSoftSkillInput) => {
      const { data, error } = await supabase
        .from("soft_skills")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as SoftSkill;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["soft-skills", data.organization_id] });
    },
  });
}

export function useUpdateSoftSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSoftSkillInput & { id: string }) => {
      const { data, error } = await supabase
        .from("soft_skills")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as SoftSkill;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["soft-skills", data.organization_id] });
    },
  });
}

export function useDeleteSoftSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId }: { id: string; organizationId: string }) => {
      const { error } = await supabase
        .from("soft_skills")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, organizationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["soft-skills", data.organizationId] });
    },
  });
}

export function useReorderSoftSkills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, organizationId }: { items: { id: string; display_order: number }[]; organizationId: string }) => {
      const updates = items.map((item) =>
        supabase
          .from("soft_skills")
          .update({ display_order: item.display_order })
          .eq("id", item.id)
      );
      
      const results = await Promise.all(updates);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
      
      return { organizationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["soft-skills", data.organizationId] });
    },
  });
}
