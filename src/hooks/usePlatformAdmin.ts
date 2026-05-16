import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Verifica se o usuário atual é Super Admin AXIS (membro da org interna AXHolding).
 * Validação server-side via RPC is_platform_admin.
 */
export function usePlatformAdmin() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["is-platform-admin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      const { data, error } = await supabase.rpc("is_platform_admin" as any, {
        _user_id: user.id,
      });
      if (error) {
        console.error("[usePlatformAdmin] error:", error);
        return false;
      }
      return Boolean(data);
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });

  return {
    isPlatformAdmin: data ?? false,
    isLoading,
  };
}
