import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SkillArea {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSkillAreaInput {
  organization_id: string;
  name: string;
  slug: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export interface UpdateSkillAreaInput {
  name?: string;
  slug?: string;
  description?: string;
  display_order?: number;
  is_active?: boolean;
}

export function useSkillAreas(organizationId?: string) {
  return useQuery({
    queryKey: ["skill-areas", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      
      const { data, error } = await supabase
        .from("skill_areas")
        .select("*")
        .eq("organization_id", organizationId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as SkillArea[];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateSkillArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSkillAreaInput) => {
      const { data, error } = await supabase
        .from("skill_areas")
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as SkillArea;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["skill-areas", data.organization_id] });
    },
  });
}

export function useUpdateSkillArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSkillAreaInput & { id: string }) => {
      const { data, error } = await supabase
        .from("skill_areas")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as SkillArea;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["skill-areas", data.organization_id] });
    },
  });
}

export function useDeleteSkillArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, organizationId }: { id: string; organizationId: string }) => {
      const { error } = await supabase
        .from("skill_areas")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, organizationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["skill-areas", data.organizationId] });
    },
  });
}

export function useReorderSkillAreas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ items, organizationId }: { items: { id: string; display_order: number }[]; organizationId: string }) => {
      const updates = items.map((item) =>
        supabase
          .from("skill_areas")
          .update({ display_order: item.display_order })
          .eq("id", item.id)
      );
      
      const results = await Promise.all(updates);
      const error = results.find(r => r.error)?.error;
      if (error) throw error;
      
      return { organizationId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["skill-areas", data.organizationId] });
    },
  });
}
