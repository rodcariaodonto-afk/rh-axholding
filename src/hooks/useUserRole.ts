import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useViewAs } from "@/contexts/ViewAsContext";

type AppRole = "admin" | "people" | "user";

/**
 * Hook para obter a role do usuário na organização ativa.
 * 
 * Consulta organization_members + roles (multi-tenant).
 * A tabela user_roles foi deprecada em 2026-02-08.
 * 
 * @param userId - ID do usuário (opcional, usa auth.user por padrão)
 * @returns roles, isAdmin, isPeople, canEdit, etc.
 */
export const useUserRole = (userId?: string) => {
  const { user } = useAuth();
  const { organizationId } = useCurrentOrganization();
  const { isViewingAsCollaborator } = useViewAs();
  const effectiveUserId = userId ?? user?.id;

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-roles", effectiveUserId, organizationId],
    queryFn: async () => {
      // Sem organização ativa = sem roles (seguro por design)
      if (!effectiveUserId || !organizationId) return [];

      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          role_id,
          roles:role_id (slug)
        `)
        .eq("user_id", effectiveUserId)
        .eq("organization_id", organizationId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return [];

      // Mapear slug para AppRole
      const slug = (data.roles as { slug: string } | null)?.slug;
      if (slug === "admin") return ["admin" as AppRole];
      if (slug === "people") return ["people" as AppRole];
      return ["user" as AppRole];
    },
    enabled: !!effectiveUserId && !!organizationId,
  });

  // When viewing as collaborator, suppress admin/people privileges
  const realIsAdmin = roles.includes("admin");
  const realIsPeople = roles.includes("people");
  const isAdmin = isViewingAsCollaborator ? false : realIsAdmin;
  const isPeople = isViewingAsCollaborator ? false : realIsPeople;
  const canEdit = isAdmin || isPeople;
  const canDelete = isAdmin || isPeople;
  const canDeleteCertificates = isAdmin || isPeople;
  const canDeleteTrainings = isAdmin || isPeople;

  return {
    roles,
    isLoading,
    isAdmin,
    isPeople,
    realIsAdmin,
    realIsPeople,
    canEdit,
    canDelete,
    canDeleteCertificates,
    canDeleteTrainings,
  };
};
