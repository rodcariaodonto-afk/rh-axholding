import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { useToast } from "@/hooks/use-toast";
import { getCurrentPosition, isWithinAnyFence, type GeoPosition } from "@/lib/geolocation";
import { useOrganizationLocations } from "@/hooks/useOrganizationLocations";

export type ClockStep = "clock_in" | "lunch_out" | "lunch_return" | "clock_out";

export function getNextStep(entry: {
  clock_in: string;
  lunch_out?: string | null;
  lunch_return?: string | null;
  clock_out?: string | null;
} | null): ClockStep {
  if (!entry) return "clock_in";
  if (!entry.lunch_out) return "lunch_out";
  if (!entry.lunch_return) return "lunch_return";
  if (!entry.clock_out) return "clock_out";
  return "clock_in";
}

export const STEP_LABELS: Record<ClockStep, string> = {
  clock_in: "Registrar Entrada",
  lunch_out: "Saída para Almoço",
  lunch_return: "Retorno do Almoço",
  clock_out: "Registrar Saída",
};

export function useClockInOut() {
  const { user } = useAuth();
  const { organizationId } = useCurrentOrganization();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { activeLocations } = useOrganizationLocations();

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

  const nextStep = getNextStep(openEntry ?? null);
  const isClockedIn = !!openEntry;

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

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["open-time-entry"] });
    queryClient.invalidateQueries({ queryKey: ["time-entries"] });
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
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar entrada", description: error.message, variant: "destructive" });
    },
  });

  const lunchOut = useMutation({
    mutationFn: async () => {
      if (!openEntry) throw new Error("Nenhum ponto aberto");

      const { position, withinFence } = await captureGeolocation();
      if (geolocationRequired && activeLocations.length > 0 && !withinFence) {
        throw new Error("Você está fora da área autorizada para registrar o ponto.");
      }

      const now = new Date();
      const { data, error } = await supabase
        .from("time_entries")
        .update({
          lunch_out: now.toISOString(),
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
      toast({ title: "Saída para almoço", description: "Intervalo de almoço iniciado." });
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar saída para almoço", description: error.message, variant: "destructive" });
    },
  });

  const lunchReturn = useMutation({
    mutationFn: async () => {
      if (!openEntry) throw new Error("Nenhum ponto aberto");

      const { position, withinFence } = await captureGeolocation();
      if (geolocationRequired && activeLocations.length > 0 && !withinFence) {
        throw new Error("Você está fora da área autorizada para registrar o ponto.");
      }

      const now = new Date();
      const { data, error } = await supabase
        .from("time_entries")
        .update({
          lunch_return: now.toISOString(),
          ...(position && {
            clock_in_latitude: position.latitude,
            clock_in_longitude: position.longitude,
            clock_in_accuracy: position.accuracy,
            clock_in_within_fence: withinFence,
          }),
        })
        .eq("id", openEntry.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Retorno do almoço", description: "Intervalo de almoço encerrado." });
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar retorno do almoço", description: error.message, variant: "destructive" });
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

      let lunchMinutes = 0;
      if (openEntry.lunch_out && openEntry.lunch_return) {
        const lo = new Date(openEntry.lunch_out);
        const lr = new Date(openEntry.lunch_return);
        lunchMinutes = Math.round((lr.getTime() - lo.getTime()) / 60000);
      }

      const totalMinutes = Math.round((clockOutTime.getTime() - clockInTime.getTime()) / 60000) - lunchMinutes;

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
      invalidateQueries();
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao registrar saída", description: error.message, variant: "destructive" });
    },
  });

  const currentMutation = nextStep === "clock_in" ? clockIn
    : nextStep === "lunch_out" ? lunchOut
    : nextStep === "lunch_return" ? lunchReturn
    : clockOut;

  return {
    openEntry,
    isCheckingOpen,
    isClockedIn,
    nextStep,
    clockIn,
    clockOut,
    lunchOut,
    lunchReturn,
    currentMutation,
    geolocationRequired,
  };
}
