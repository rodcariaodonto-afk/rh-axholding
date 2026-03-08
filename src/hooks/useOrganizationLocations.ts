import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface OrganizationLocation {
  id: string;
  organization_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useOrganizationLocations() {
  const { organizationId } = useCurrentOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ["organization-locations", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from("organization_locations")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as OrganizationLocation[];
    },
    enabled: !!organizationId,
  });

  const activeLocations = locations.filter((l) => l.is_active);

  const createLocation = useMutation({
    mutationFn: async (input: { name: string; latitude: number; longitude: number; radius_meters: number }) => {
      if (!organizationId || !user?.id) throw new Error("Sem organização");
      const { data, error } = await supabase
        .from("organization_locations")
        .insert({
          organization_id: organizationId,
          name: input.name,
          latitude: input.latitude,
          longitude: input.longitude,
          radius_meters: input.radius_meters,
          created_by: user.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Local adicionado" });
      queryClient.invalidateQueries({ queryKey: ["organization-locations"] });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao adicionar local", description: e.message, variant: "destructive" });
    },
  });

  const updateLocation = useMutation({
    mutationFn: async (input: { id: string; name?: string; latitude?: number; longitude?: number; radius_meters?: number; is_active?: boolean }) => {
      const { id, ...rest } = input;
      const { data, error } = await supabase
        .from("organization_locations")
        .update(rest)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Local atualizado" });
      queryClient.invalidateQueries({ queryKey: ["organization-locations"] });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" });
    },
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("organization_locations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Local removido" });
      queryClient.invalidateQueries({ queryKey: ["organization-locations"] });
    },
    onError: (e: Error) => {
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" });
    },
  });

  return {
    locations,
    activeLocations,
    isLoading,
    createLocation,
    updateLocation,
    deleteLocation,
  };
}
