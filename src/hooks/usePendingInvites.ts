import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PendingEmployee {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  department_id: string | null;
  manager_id: string | null;
  base_position_id: string | null;
  position_level_detail: string | null;
  unit_id: string | null;
  employment_type: string;
  contract_type: string | null;
  hire_date: string | null;
  base_salary: number | null;
  invited_by: string;
  invite_sent_at: string | null;
  status: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  department?: { name: string } | null;
  position?: { title: string } | null;
}

export const usePendingInvites = () => {
  return useQuery({
    queryKey: ["pending-invites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_employees")
        .select(`
          *,
          department:departments(name),
          position:positions(title)
        `)
        .in("status", ["draft", "invited", "expired"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PendingEmployee[];
    },
  });
};

export const useCancelInvite = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("pending_employees")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      toast({
        title: "Convite cancelado",
        description: "O convite foi cancelado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useResendInvite = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pending: PendingEmployee) => {
      // Reenviar usando a edge function
      const response = await supabase.functions.invoke("invite-employee", {
        body: {
          email: pending.email,
          full_name: pending.full_name,
          department_id: pending.department_id,
          manager_id: pending.manager_id,
          base_position_id: pending.base_position_id,
          position_level_detail: pending.position_level_detail,
          unit_id: pending.unit_id,
          employment_type: pending.employment_type,
          contract_type: pending.contract_type,
          hire_date: pending.hire_date,
          base_salary: pending.base_salary,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.status >= 400) {
        throw new Error(response.data.detail || "Erro ao reenviar convite");
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-invites"] });
      toast({
        title: "Convite reenviado",
        description: "O convite foi reenviado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reenviar convite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
