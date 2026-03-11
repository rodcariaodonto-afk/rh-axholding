import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export interface TrainingCatalogItem {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  provider: string | null;
  format: string | null;
  duration_hours: number | null;
  cost: number | null;
  category: string | null;
  url: string | null;
  is_active: boolean;
  created_at: string;
}

interface CreateCatalogParams {
  name: string;
  description?: string;
  provider?: string;
  format?: string;
  duration_hours?: number;
  cost?: number;
  category?: string;
  url?: string;
}

export function useTrainingCatalog() {
  const { organizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["training-catalog", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("training_catalog")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as TrainingCatalogItem[];
    },
    enabled: !!organizationId,
  });

  const createItem = useMutation({
    mutationFn: async (params: CreateCatalogParams) => {
      if (!organizationId) throw new Error("Sem organização");
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("training_catalog").insert({
        ...params,
        organization_id: organizationId,
        created_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-catalog", organizationId] });
      toast.success("Treinamento adicionado ao catálogo!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_catalog").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["training-catalog", organizationId] });
      toast.success("Treinamento removido do catálogo!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    items,
    isLoading,
    createItem: createItem.mutate,
    deleteItem: deleteItem.mutate,
    isCreating: createItem.isPending,
  };
}
