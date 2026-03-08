import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSystemStatus = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["system-status"],
    queryFn: async () => {
      // Usa função SECURITY DEFINER para verificar existência de orgs
      // sem depender de RLS (funciona mesmo sem autenticação)
      const { data, error } = await supabase.rpc("has_any_organization");

      if (error) throw error;

      return { hasUsers: data === true };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: 1,
  });

  return {
    hasUsers: data?.hasUsers ?? false,
    isLoading,
    error,
  };
};
