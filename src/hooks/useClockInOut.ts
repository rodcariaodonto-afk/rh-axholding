import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPosition, isWithinAnyFence, type GeoPosition } from "@/lib/geolocation";
import { useOrganizationLocations } from "@/hooks/useOrganizationLocations";

export function useClockInOut() {
  const { user } = useAuth();
  const { organizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeLocations } = useOrganizationLocations();

  // Check geolocation_required setting
  const { data: orgSettings } = useQuery({
    queryKey: ["org-geolocation-settings", organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("geolocation_required")
        .eq("id", organizationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const geolocationRequired = orgSettings?.geolocation_required ?? false;

  // Check if there's an open entry (no clock_out)
  const { data: openEntry, isLoading: isCheckingOpen } = useQuery({
    queryKey: ["open-time-entry", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("employee_id", user.id)
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });

  const captureGeolocation = async (): Promise<{ position: GeoPosition | null; withinFence: boolean }> => {
    try {
      const position = await getCurrentPosition();
      const withinFence = isWithinAnyFence(position, activeLocations);
      return { position, withinFence };
    } catch {
      if (geolocationRequired) {
        throw new Error("Localização é obrigatória para registrar o ponto. Habilite a localização no navegador.");
      }
      return { position: null, withinFence: true };
    }
  };

  const clockIn = useMutation({
    mutationFn: async () => {
      if (!user?.id || !organizationId) throw new Error("Usuário não autenticado");
      if (openEntry) throw new Error("Já existe um ponto aberto");

      const { position, withinFence } = await captureGeolocation();

      if (geolocationRequired && activeLocations.length > 0 && !withinFence) {
        throw new Error("Você está fora da área autorizada para registrar o ponto.");
      }

      const now = new Date();
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          employee_id: user.id,
          organization_id: organizationId,
          clock_in: now.toISOString(),
          date: now.toISOString().split("T")[0],
          ...(position && {
            clock_in_latitude: position.latitude,
            clock_in_longitude: position.longitude,
            clock_in_accuracy: position.accuracy,
            clock_in_within_fence: withinFence,
          }),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Entrada registrada", description: "Ponto de entrada registrado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["open-time-entry"] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar entrada", description: error.message, variant: "destructive" });
    },
  });

  const clockOut = useMutation({
    mutationFn: async () => {
      if (!openEntry) throw new Error("Nenhum ponto aberto para registrar saída");

      const { position, withinFence } = await captureGeolocation();

      if (geolocationRequired && activeLocations.length > 0 && !withinFence) {
        throw new Error("Você está fora da área autorizada para registrar o ponto.");
      }

      const clockOutTime = new Date();
      const clockInTime = new Date(openEntry.clock_in);
      const totalMinutes = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / 60000);

      const { data, error } = await supabase
        .from("time_entries")
        .update({
          clock_out: clockOutTime.toISOString(),
          total_minutes: totalMinutes,
          ...(position && {
            clock_out_latitude: position.latitude,
            clock_out_longitude: position.longitude,
            clock_out_accuracy: position.accuracy,
            clock_out_within_fence: withinFence,
          }),
        })
        .eq("id", openEntry.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Saída registrada", description: "Ponto de saída registrado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["open-time-entry"] });
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar saída", description: error.message, variant: "destructive" });
    },
  });

  return {
    openEntry,
    isCheckingOpen,
    isClockedIn: !!openEntry,
    clockIn,
    clockOut,
    geolocationRequired,
  };
}
