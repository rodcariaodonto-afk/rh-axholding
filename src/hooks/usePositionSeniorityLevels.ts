import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export type SeniorityLevel = "estagiario" | "junior" | "pleno" | "senior" | "especialista" | "lider";

export interface PositionSeniorityLevel {
  id: string;
  position_id: string;
  seniority: SeniorityLevel;
  description: string | null;
  salary_min: number | null;
  salary_max: number | null;
  required_skills: Array<{ name: string; level: string }>;
  required_soft_skills: Array<{ name: string; level: string }>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const seniorityLevelLabels: Record<SeniorityLevel, string> = {
  estagiario: "Estagiário",
  junior: "Júnior",
  pleno: "Pleno",
  senior: "Sênior",
  especialista: "Especialista",
  lider: "Líder",
};

export const seniorityLevelOrder: SeniorityLevel[] = [
  "estagiario",
  "junior",
  "pleno",
  "senior",
  "especialista",
  "lider",
];

export const usePositionSeniorityLevels = (positionId: string | undefined) => {
  return useQuery({
    queryKey: ["position-seniority-levels", positionId],
    queryFn: async () => {
      if (!positionId) return [];

      const { data, error } = await supabase
        .from("position_seniority_levels")
        .select("*")
        .eq("position_id", positionId)
        .order("seniority");

      if (error) throw error;
      
      // Cast JSON fields to proper types
      return (data || []).map((item) => ({
        ...item,
        required_skills: (item.required_skills as Array<{ name: string; level: string }>) || [],
        required_soft_skills: (item.required_soft_skills as Array<{ name: string; level: string }>) || [],
      })) as PositionSeniorityLevel[];
    },
    enabled: !!positionId,
  });
};

type CreateSeniorityLevelData = Omit<PositionSeniorityLevel, "id" | "created_at" | "updated_at">;

export const useCreateSeniorityLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSeniorityLevelData) => {
      const { data: result, error } = await supabase
        .from("position_seniority_levels")
        .insert({
          position_id: data.position_id,
          seniority: data.seniority,
          description: data.description,
          salary_min: data.salary_min,
          salary_max: data.salary_max,
          required_skills: JSON.parse(JSON.stringify(data.required_skills || [])),
          required_soft_skills: JSON.parse(JSON.stringify(data.required_soft_skills || [])),
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["position-seniority-levels", variables.position_id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

type UpdateSeniorityLevelData = {
  id: string;
  position_id: string;
} & Partial<Omit<PositionSeniorityLevel, "id" | "position_id" | "created_at" | "updated_at">>;

export const useUpdateSeniorityLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, position_id, ...data }: UpdateSeniorityLevelData) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.seniority !== undefined) updateData.seniority = data.seniority;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.salary_min !== undefined) updateData.salary_min = data.salary_min;
      if (data.salary_max !== undefined) updateData.salary_max = data.salary_max;
      if (data.required_skills !== undefined) updateData.required_skills = data.required_skills;
      if (data.required_soft_skills !== undefined) updateData.required_soft_skills = data.required_soft_skills;
      if (data.notes !== undefined) updateData.notes = data.notes;

      const { data: result, error } = await supabase
        .from("position_seniority_levels")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["position-seniority-levels", variables.position_id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteSeniorityLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, position_id }: { id: string; position_id: string }) => {
      const { error } = await supabase
        .from("position_seniority_levels")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { id, position_id };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["position-seniority-levels", variables.position_id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpsertSeniorityLevels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      positionId, 
      levels 
    }: { 
      positionId: string; 
      levels: Array<Partial<PositionSeniorityLevel> & { seniority: SeniorityLevel }> 
    }) => {
      // Delete existing levels
      await supabase
        .from("position_seniority_levels")
        .delete()
        .eq("position_id", positionId);

      // Insert new levels
      if (levels.length > 0) {
        const { error } = await supabase
          .from("position_seniority_levels")
          .insert(
            levels.map((level) => ({
              position_id: positionId,
              seniority: level.seniority,
              description: level.description || null,
              salary_min: level.salary_min || null,
              salary_max: level.salary_max || null,
              required_skills: JSON.parse(JSON.stringify(level.required_skills || [])),
              required_soft_skills: JSON.parse(JSON.stringify(level.required_soft_skills || [])),
              notes: level.notes || null,
            }))
          );

        if (error) throw error;
      }

      return { positionId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["position-seniority-levels", variables.positionId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
