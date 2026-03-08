import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import type { Database } from "@/integrations/supabase/types";

type EmployeeLegalDocs = Database["public"]["Tables"]["employees_legal_docs"]["Row"];
type EmployeeLegalDocsUpdate = Database["public"]["Tables"]["employees_legal_docs"]["Update"];

// Type for the masked view (same structure as the row type for now)
type EmployeeLegalDocsMasked = {
  user_id: string;
  cpf: string | null;
  rg: string | null;
  rg_issuer: string | null;
  bank_name: string | null;
  bank_agency: string | null;
  bank_account: string | null;
  bank_account_type: string | null;
  pix_key: string | null;
  created_at: string | null;
  updated_at: string | null;
};

interface UseEmployeeLegalDocsReturn {
  legalDocs: EmployeeLegalDocs | EmployeeLegalDocsMasked | null;
  isLoading: boolean;
  isView: boolean; // true if viewing masked data (manager viewing subordinate)
  canEdit: boolean; // true if user can edit (own data or admin/people)
  updateLegalDocs: (data: Omit<EmployeeLegalDocsUpdate, 'user_id'>) => void;
  isUpdating: boolean;
}

export const useEmployeeLegalDocs = (userId: string | undefined): UseEmployeeLegalDocsReturn => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { isAdmin, isPeople } = useUserRole();
  
  const isOwnProfile = user?.id === userId;
  const hasFullAccess = isAdmin || isPeople || isOwnProfile;

  // First, try to fetch from the real table (will work for own/admin/people)
  // If that fails with permission error, fall back to masked view (manager)
  const { data: legalDocsResult, isLoading } = useQuery({
    queryKey: ["employee_legal_docs", userId, hasFullAccess],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      // Try to fetch from real table first
      if (hasFullAccess) {
        const { data, error } = await supabase
          .from("employees_legal_docs")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;
        return { data, isView: false };
      }

      // If not own/admin/people, try masked view (for managers)
      // Use type assertion since the view might not be in generated types yet
      const { data, error } = await supabase
        .from("employees_legal_docs_masked" as unknown as "employees_legal_docs")
        .select("user_id, cpf, rg, rg_issuer, bank_name, bank_agency, bank_account, bank_account_type, pix_key, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return { data: data as unknown as EmployeeLegalDocsMasked | null, isView: true };
    },
    enabled: !!userId,
  });

  const updateLegalDocs = useMutation({
    mutationFn: async (legalDocsData: Omit<EmployeeLegalDocsUpdate, 'user_id'>) => {
      if (!userId) throw new Error("User ID is required");
      if (!hasFullAccess) throw new Error("Sem permissão para editar dados legais");

      const fullData = {
        user_id: userId,
        ...legalDocsData,
      };

      const { data, error } = await supabase
        .from("employees_legal_docs")
        .upsert([fullData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_legal_docs", userId] });
      toast({
        title: "Documentos atualizados",
        description: "Os documentos e dados bancários foram atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar documentos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    legalDocs: legalDocsResult?.data ?? null,
    isLoading,
    isView: legalDocsResult?.isView ?? false,
    canEdit: hasFullAccess,
    updateLegalDocs: updateLegalDocs.mutate,
    isUpdating: updateLegalDocs.isPending,
  };
};
