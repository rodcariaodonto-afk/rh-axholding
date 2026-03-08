import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { ProfileResult } from "@/lib/profiler/calculateProfile";

interface CreateJobApplicationData {
  job_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_birth_date: string;
  resume_url: string | null;
  profiler_result_code?: string;
  profiler_result_detail?: ProfileResult;
  // New demographic fields
  candidate_state?: string;
  candidate_city?: string;
  candidate_phone?: string;
  candidate_race?: string;
  candidate_gender?: string;
  candidate_sexual_orientation?: string;
  candidate_pcd?: boolean;
  candidate_pcd_type?: string | null;
  // Talent bank fields
  desired_position?: string | null;
  desired_seniority?: string | null;
  job_data?: {
    title?: string;
    description?: string | null;
    requirements?: string | null;
    position?: { title: string } | null;
    department?: { name: string } | null;
  };
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const useCreateJobApplication = () => {
  return useMutation({
    mutationFn: async (data: CreateJobApplicationData) => {
      // Use Edge Function for secure submission (hides table structure)
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/submit-application`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: data.job_id,
            candidate_name: data.candidate_name,
            candidate_email: data.candidate_email,
            candidate_birth_date: data.candidate_birth_date,
            resume_url: data.resume_url,
            profiler_result_code: data.profiler_result_code || null,
            profiler_result_detail: data.profiler_result_detail || null,
            candidate_state: data.candidate_state || null,
            candidate_city: data.candidate_city || null,
            candidate_phone: data.candidate_phone || null,
            candidate_race: data.candidate_race || null,
            candidate_gender: data.candidate_gender || null,
            candidate_sexual_orientation: data.candidate_sexual_orientation || null,
            candidate_pcd: data.candidate_pcd || false,
            candidate_pcd_type: data.candidate_pcd_type || null,
            desired_position: data.desired_position || null,
            desired_seniority: data.desired_seniority || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit application");
      }

      return { success: true, applicationId: result.applicationId };
    },
    onSuccess: () => {
      toast({
        title: "Candidatura enviada!",
        description: "Sua candidatura foi registrada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error("Error creating job application:", error);
      
      // User-friendly error messages
      let description = "Ocorreu um erro ao enviar sua candidatura. Tente novamente.";
      if (error.message.includes("already applied")) {
        description = "Você já se candidatou para esta vaga.";
      } else if (error.message.includes("not accepting")) {
        description = "Esta vaga não está mais aceitando candidaturas.";
      }
      
      toast({
        title: "Erro ao enviar candidatura",
        description,
        variant: "destructive",
      });
    },
  });
};
