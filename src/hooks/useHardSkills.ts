import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HardSkill {
  id: string;
  organization_id: string;
  area_id: string | null;
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

export interface HardSkillWithArea extends HardSkill {
  skill_areas?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface CreateHardSkillInput {
  organization_id: string;
  area_id?: string | null;
  name: string;
  description?: string;
  level_junior?: number;
  level_pleno?: number;
  level_senior?: number;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateHardSkillInput {
  area_id?: string | null;
  name?: string;
  description?: string;
  level_junior?: number;
  level_pleno?: number;
  level_senior?: number;
  display_order?: number;
  is_active?: boolean;
}

export function useHardSkills(organizationId?: string) {
  return useQuery({
    queryKey: ["hard-skills", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("hard_skills")
        .select(`
          *,
          skill_areas (
            id,
            name,
            slug
          )
        `)
        .eq("organization_id", organizationId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HardSkillWithArea[];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useHardSkillsByArea(areaId?: string) {
  return useQuery({
    queryKey: ["hard-skills-by-area", areaId],
    queryFn: async () => {
      if (!areaId) return [];
      
      const { data, error } = await supabase
        .from("hard_skills")
        .select("*")
        .eq("area_id", areaId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as HardSkill[];
    },
    enabled: !!areaId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateHardSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateHardSkillInput) => {
      const { data, error } = await supabase
        .from("hard_skills")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as HardSkill;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hard-skills", data.organization_id] });
      if (data.area_id) {
        queryClient.invalidateQueries({ queryKey: ["hard-skills-by-area", data.area_id] });
      }
    },
  });
}

export function useUpdateHardSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateHardSkillInput & { id: string }) => {
      const { data, error } = await supabase
        .from("hard_skills")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as HardSkill;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hard-skills", data.organization_id] });
      if (data.area_id) {
        queryClient.invalidateQueries({ queryKey: ["hard-skills-by-area", data.area_id] });
      }
    },
  });
}

export function useDeleteHardSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId }: { id: string; organizationId: string }) => {
      const { error } = await supabase
        .from("hard_skills")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, organizationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hard-skills", data.organizationId] });
    },
  });
}

export function useReorderHardSkills() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, organizationId }: { items: { id: string; display_order: number }[]; organizationId: string }) => {
      const updates = items.map((item) =>
        supabase
          .from("hard_skills")
          .update({ display_order: item.display_order })
          .eq("id", item.id)
      );
      
      const results = await Promise.all(updates);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
      
      return { organizationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hard-skills", data.organizationId] });
    },
  });
}
