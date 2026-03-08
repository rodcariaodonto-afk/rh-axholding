import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChangeRoleInput {
  targetUserId: string;
  newRoleId: string;
  reason: string;
}

interface ChangeRoleResponse {
  success: boolean;
  message: string;
  old_role: { id: string; slug: string; name: string } | null;
  new_role: { id: string; slug: string; name: string };
}

/**
 * Hook para alterar a role de um membro da organização
 * Chama Edge Function com validações de segurança
 */
export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ChangeRoleInput): Promise<ChangeRoleResponse> => {
      const { data, error } = await supabase.functions.invoke<ChangeRoleResponse>(
        "change-user-role",
        {
          body: {
            target_user_id: input.targetUserId,
            new_role_id: input.newRoleId,
            reason: input.reason,
          },
        }
      );

      if (error) {
        // Parse error response if it's Problem Details format
        if (error.message) {
          try {
            const parsed = JSON.parse(error.message);
            throw new Error(parsed.detail || parsed.message || error.message);
          } catch {
            throw new Error(error.message);
          }
        }
        throw error;
      }

      if (!data?.success) {
        throw new Error(data?.message || "Erro ao alterar perfil");
      }

      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["organization-members"] });
      queryClient.invalidateQueries({ queryKey: ["permission-audit-log"] });
      queryClient.invalidateQueries({ queryKey: ["user-permissions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao alterar perfil");
    },
  });
}
