import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientOrganization {
  id: string;
  name: string;
  slug: string;
  status: string;
  is_internal: boolean;
  plan_id: string | null;
  responsible_name: string | null;
  responsible_email: string | null;
  responsible_phone: string | null;
  trial_ends_at: string | null;
  suspended_at: string | null;
  scheduled_deletion_at: string | null;
  last_access_at: string | null;
  internal_notes: string | null;
  created_at: string;
}

export function useClients() {
  return useQuery({
    queryKey: ["platform-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("is_internal", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as ClientOrganization[];
    },
  });
}

export function useClient(id?: string) {
  return useQuery({
    queryKey: ["platform-client", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as ClientOrganization;
    },
    enabled: !!id,
  });
}

export interface CreateClientInput {
  name: string;
  slug: string;
  cnpj?: string;
  responsible_name: string;
  responsible_email: string;
  responsible_phone?: string;
  plan_slug: string;
  status?: "trial" | "active";
  internal_notes?: string;
  modules?: string[];
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateClientInput) => {
      const { data, error } = await supabase.functions.invoke("super-admin-create-client", {
        body: input,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-clients"] });
      toast.success("Cliente criado e convite enviado");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha ao criar cliente"),
  });
}

export function useClientAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      organization_id: string;
      action: "suspend" | "reactivate" | "cancel" | "schedule_deletion" | "cancel_deletion" | "resend_invite";
      reason?: string;
      days?: number;
    }) => {
      const { data, error } = await supabase.functions.invoke("super-admin-client-action", { body: args });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-clients"] });
      qc.invalidateQueries({ queryKey: ["platform-client"] });
      toast.success("Ação executada");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });
}

export function useUpdateClientPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (args: { organization_id: string; plan_slug: string; modules?: string[] }) => {
      const { data, error } = await supabase.functions.invoke("super-admin-update-plan", { body: args });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platform-clients"] });
      qc.invalidateQueries({ queryKey: ["platform-client"] });
      qc.invalidateQueries({ queryKey: ["organization-modules"] });
      toast.success("Plano atualizado");
    },
    onError: (e: any) => toast.error(e?.message ?? "Falha"),
  });
}
