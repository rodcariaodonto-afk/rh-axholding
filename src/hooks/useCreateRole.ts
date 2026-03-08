import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  permissions: string[];
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (input: CreateRoleInput) => {
      if (!organizationId) {
        throw new Error("Organização não encontrada");
      }

      // 1. Create the role
      const { data: role, error: roleError } = await supabase
        .from("roles")
        .insert({
          name: input.name,
          slug: input.slug,
          description: input.description || null,
          organization_id: organizationId,
          is_system: false,
        })
        .select()
        .single();

      if (roleError) {
        if (roleError.code === "23505") {
          throw new Error("Já existe uma role com esse identificador");
        }
        throw roleError;
      }

      // 2. Create role_permissions mappings
      if (input.permissions.length > 0) {
        const rolePermissions = input.permissions.map((permissionId) => ({
          role_id: role.id,
          permission_id: permissionId,
        }));

        const { error: permError } = await supabase
          .from("role_permissions")
          .insert(rolePermissions);

        if (permError) {
          // Rollback: delete the role if permissions fail
          await supabase.from("roles").delete().eq("id", role.id);
          throw permError;
        }
      }

      return role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-roles"] });
      toast.success("Role criada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar role");
    },
  });
}
