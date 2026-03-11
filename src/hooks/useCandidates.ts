import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { toast } from "sonner";

export interface Candidate {
  id: string;
  organization_id: string;
  job_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  resume_url: string | null;
  source: string | null;
  status: string;
  applied_at: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  job_title?: string;
}

export function useCandidates(jobId?: string) {
  const { organizationId } = useCurrentOrganization();

  return useQuery({
    queryKey: ["candidates", organizationId, jobId],
    queryFn: async () => {
      if (!organizationId) return [];
      let query = supabase
        .from("candidates")
        .select("*, jobs(title)")
        .eq("organization_id", organizationId)
        .order("applied_at", { ascending: false });

      if (jobId) {
        query = query.eq("job_id", jobId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map((c: any) => ({
        ...c,
        job_title: c.jobs?.title || null,
      })) as Candidate[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  const { organizationId } = useCurrentOrganization();

  return useMutation({
    mutationFn: async (input: Partial<Candidate>) => {
      if (!organizationId) throw new Error("Organização não encontrada");
      const { data, error } = await supabase
        .from("candidates")
        .insert({ ...input, organization_id: organizationId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidato adicionado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Candidate> & { id: string }) => {
      const { data, error } = await supabase
        .from("candidates")
        .update(input)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidato atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("candidates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Candidato removido!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
