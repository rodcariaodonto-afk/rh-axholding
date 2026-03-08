import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireOrganization } from "./useRequireOrganization";
import { Device } from "@/types/device";
import { useToast } from "@/hooks/use-toast";

export const useDevices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { organization } = useRequireOrganization();

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ["devices", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("devices")
        .select(`
          *,
          employees:user_id (
            email,
            full_name
          )
        `)
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Device[];
    },
    enabled: !!organization?.id,
  });

  const createDevice = useMutation({
    mutationFn: async (device: Omit<Device, "id" | "created_at" | "updated_at">) => {
      if (!organization?.id) throw new Error("Organização não encontrada");

      const { data, error } = await supabase
        .from("devices")
        .insert([{ ...device, organization_id: organization.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast({
        title: "Dispositivo adicionado",
        description: "O dispositivo foi adicionado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao adicionar dispositivo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateDevice = useMutation({
    mutationFn: async (device: Device) => {
      const { id, created_at, updated_at, ...updateData } = device;
      const { data, error } = await supabase
        .from("devices")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast({
        title: "Dispositivo atualizado",
        description: "O dispositivo foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar dispositivo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("devices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
      toast({
        title: "Dispositivo excluído",
        description: "O dispositivo foi excluído com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir dispositivo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    devices,
    isLoading,
    createDevice: createDevice.mutate,
    updateDevice: updateDevice.mutate,
    deleteDevice: deleteDevice.mutate,
  };
};
