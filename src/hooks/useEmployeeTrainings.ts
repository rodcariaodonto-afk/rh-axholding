import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TrainingType = "treinamento" | "certificacao";
export type TrainingSponsor = "empresa" | "colaborador";

export interface EmployeeTraining {
  id: string;
  employee_id: string;
  name: string;
  training_type: TrainingType;
  description: string | null;
  hours: number;
  completion_date: string;
  cost: number | null;
  sponsor: TrainingSponsor;
  from_pdi: boolean;
  pdi_id: string | null;
  pdi_goal_id: string | null;
  generates_points: boolean;
  career_points: number | null;
  certificate_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CareerPoints {
  id: string;
  employee_id: string;
  total_points: number;
  total_training_hours: number;
  total_certifications: number;
  last_calculated_at: string;
}

export interface TrainingFormData {
  name: string;
  training_type: TrainingType;
  description?: string;
  hours: number;
  completion_date: string;
  cost?: number;
  sponsor?: TrainingSponsor;
  generates_points?: boolean;
  career_points?: number;
  certificate_url?: string;
}

interface UseEmployeeTrainingsOptions {
  employeeId?: string;
  type?: TrainingType;
  fromPdi?: boolean;
  startDate?: string;
  endDate?: string;
}

export function useEmployeeTrainings(options: UseEmployeeTrainingsOptions = {}) {
  const { employeeId, type, fromPdi, startDate, endDate } = options;

  return useQuery({
    queryKey: ["employee-trainings", employeeId, type, fromPdi, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("employee_trainings" as any)
        .select("*")
        .order("completion_date", { ascending: false });

      if (employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      if (type) {
        query = query.eq("training_type", type);
      }

      if (fromPdi !== undefined) {
        query = query.eq("from_pdi", fromPdi);
      }

      if (startDate) {
        query = query.gte("completion_date", startDate);
      }

      if (endDate) {
        query = query.lte("completion_date", endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as EmployeeTraining[];
    },
    enabled: !!employeeId,
  });
}

export function useCareerPoints(employeeId?: string) {
  return useQuery({
    queryKey: ["career-points", employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_career_points" as any)
        .select("*")
        .eq("employee_id", employeeId!)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as CareerPoints | null;
    },
    enabled: !!employeeId,
  });
}

export function useCreateTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      employeeId,
      data,
      createdBy,
    }: {
      employeeId: string;
      data: TrainingFormData;
      createdBy: string;
    }) => {
      const { error } = await supabase.from("employee_trainings" as any).insert({
        employee_id: employeeId,
        name: data.name,
        training_type: data.training_type,
        description: data.description || null,
        hours: data.hours,
        completion_date: data.completion_date,
        cost: data.cost || null,
        sponsor: data.sponsor || "empresa",
        generates_points: data.generates_points || false,
        career_points: data.generates_points ? data.career_points || 0 : null,
        certificate_url: data.certificate_url || null,
        created_by: createdBy,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["employee-trainings", variables.employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["career-points", variables.employeeId],
      });
      toast.success("Treinamento cadastrado com sucesso!");
    },
    onError: (error) => {
      console.error("Error creating training:", error);
      toast.error("Erro ao cadastrar treinamento");
    },
  });
}

export function useUpdateTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      trainingId,
      employeeId,
      data,
    }: {
      trainingId: string;
      employeeId: string;
      data: Partial<TrainingFormData>;
    }) => {
      const updateData: Record<string, unknown> = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.training_type !== undefined) updateData.training_type = data.training_type;
      if (data.description !== undefined) updateData.description = data.description || null;
      if (data.hours !== undefined) updateData.hours = data.hours;
      if (data.completion_date !== undefined) updateData.completion_date = data.completion_date;
      if (data.cost !== undefined) updateData.cost = data.cost || null;
      if (data.sponsor !== undefined) updateData.sponsor = data.sponsor;
      if (data.generates_points !== undefined) {
        updateData.generates_points = data.generates_points;
        updateData.career_points = data.generates_points ? data.career_points || 0 : null;
      }
      if (data.certificate_url !== undefined) updateData.certificate_url = data.certificate_url || null;

      const { error } = await supabase
        .from("employee_trainings" as any)
        .update(updateData)
        .eq("id", trainingId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["employee-trainings", variables.employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["career-points", variables.employeeId],
      });
      toast.success("Treinamento atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Error updating training:", error);
      toast.error("Erro ao atualizar treinamento");
    },
  });
}

export function useDeleteTraining() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      trainingId,
      employeeId,
    }: {
      trainingId: string;
      employeeId: string;
    }) => {
      const { error } = await supabase
        .from("employee_trainings" as any)
        .delete()
        .eq("id", trainingId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["employee-trainings", variables.employeeId],
      });
      queryClient.invalidateQueries({
        queryKey: ["career-points", variables.employeeId],
      });
      toast.success("Treinamento excluído com sucesso!");
    },
    onError: (error) => {
      console.error("Error deleting training:", error);
      toast.error("Erro ao excluir treinamento");
    },
  });
}
