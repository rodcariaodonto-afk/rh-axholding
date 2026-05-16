import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "@/hooks/use-toast";

export type TimeClockDeviceType =
  | "rep_p" | "rep_a" | "rep_c"
  | "tablet_kiosk" | "mobile_app" | "web" | "qr_gps"
  | "biometric" | "manual_upload";

export type TimeClockIntegrationMode =
  | "api" | "webhook" | "afd_file" | "csv_file" | "manual_upload" | "native";

export type TimeClockDeviceStatus = "active" | "inactive" | "offline" | "error" | "pending";

export interface TimeClockDevice {
  id: string;
  organization_id: string;
  cost_center_id: string | null;
  legal_entity_id: string | null;
  work_location_id: string | null;
  name: string;
  provider: string | null;
  model: string | null;
  serial_number: string | null;
  device_type: TimeClockDeviceType;
  integration_mode: TimeClockIntegrationMode;
  status: TimeClockDeviceStatus;
  firmware_version: string | null;
  last_sync_at: string | null;
  last_event_at: string | null;
  metadata: unknown;
  created_at: string;
  updated_at: string;
}

export function useTimeClockDevices() {
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id;

  return useQuery({
    queryKey: ["time-clock-devices", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("time_clock_devices")
        .select("*")
        .eq("organization_id", orgId)
        .order("name");
      if (error) throw error;
      return (data ?? []) as TimeClockDevice[];
    },
    enabled: !!orgId,
  });
}

export function useUpsertDevice() {
  const qc = useQueryClient();
  const { organization } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (input: Partial<TimeClockDevice> & { name: string; device_type: TimeClockDeviceType }) => {
      if (!organization?.id) throw new Error("Organização não encontrada");
      const payload = { ...input, organization_id: organization.id } as never;
      if (input.id) {
        const { data, error } = await supabase
          .from("time_clock_devices")
          .update(payload)
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("time_clock_devices")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-clock-devices"] });
      toast({ title: "Dispositivo salvo" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_clock_devices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["time-clock-devices"] });
      toast({ title: "Dispositivo removido" });
    },
    onError: (e: Error) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useDeviceSyncLogs(deviceId?: string) {
  const { organization } = useCurrentOrganization();
  return useQuery({
    queryKey: ["device-sync-logs", organization?.id, deviceId],
    queryFn: async () => {
      if (!organization?.id) return [];
      let q = supabase
        .from("time_clock_sync_logs")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (deviceId) q = q.eq("device_id", deviceId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organization?.id,
  });
}

export function useRawEvents(filters?: { deviceId?: string; employeeId?: string; status?: string; limit?: number }) {
  const { organization } = useCurrentOrganization();
  return useQuery({
    queryKey: ["raw-events", organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return [];
      let q = supabase
        .from("time_clock_raw_events")
        .select("*")
        .eq("organization_id", organization.id)
        .order("event_time", { ascending: false })
        .limit(filters?.limit ?? 200);
      if (filters?.deviceId) q = q.eq("device_id", filters.deviceId);
      if (filters?.employeeId) q = q.eq("employee_id", filters.employeeId);
      if (filters?.status) q = q.eq("processing_status", filters.status as never);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organization?.id,
  });
}
