import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface OrganizationIntegration {
  id: string;
  organization_id: string;
  provider: string;
  environment: string;
  display_name: string | null;
  last_four: string | null;
  status: string;
  is_active: boolean;
  last_used_at: string | null;
  last_tested_at: string | null;
  last_test_success: boolean | null;
  last_error: string | null;
  sensitivity: 'standard' | 'high' | 'critical';
  last_rotated_at: string | null;
  created_at: string;
  updated_at: string;
}

export type IntegrationSensitivity = 'standard' | 'high' | 'critical';

export function useOrganizationIntegrations(organizationId: string | null) {
  return useQuery({
    queryKey: ["organization-integrations", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Não autenticado");
      }

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-secrets?organization_id=${organizationId}`;
      
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao buscar integrações");
      }

      return (await res.json()) as OrganizationIntegration[];
    },
    enabled: !!organizationId,
  });
}

interface SaveIntegrationParams {
  organization_id: string;
  provider: string;
  api_key: string;
  display_name?: string;
  test_connection?: boolean;
}

export function useSaveIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveIntegrationParams) => {
      const response = await supabase.functions.invoke("manage-secrets", {
        body: params,
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao salvar integração");
      }

      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["organization-integrations", variables.organization_id] 
      });
      toast.success(data.message || "Integração salva com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao salvar integração");
    },
  });
}

interface DeleteIntegrationParams {
  organization_id: string;
  id: string;
}

export function useDeleteIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: DeleteIntegrationParams) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("Não autenticado");
      }

       // Use fetch for DELETE since invoke doesn't support it well.
       // Also pass identifiers via query params because some platforms drop DELETE bodies.
       const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-secrets?organization_id=${encodeURIComponent(
         params.organization_id
       )}&id=${encodeURIComponent(params.id)}`;
      
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao remover integração");
      }

      return await res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["organization-integrations", variables.organization_id] 
      });
      toast.success(data.message || "Integração removida com sucesso");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover integração");
    },
  });
}

interface TestIntegrationParams {
  organization_id: string;
  id: string;
}

export function useTestIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TestIntegrationParams) => {
      const response = await supabase.functions.invoke("manage-secrets", {
        body: {
          ...params,
          action: "test",
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao testar integração");
      }

      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ["organization-integrations", variables.organization_id] 
      });
      if (data.success) {
        toast.success(data.message || "Conexão testada com sucesso");
      } else {
        toast.error(data.message || "Falha no teste de conexão");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao testar integração");
    },
  });
}
