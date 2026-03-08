import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmployeeContact {
  user_id: string;
  personal_email?: string;
  mobile_phone?: string;
  home_phone?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  country: string;
  zip_code: string;
  state: string;
  city: string;
  neighborhood?: string;
  street: string;
  number: string;
  complement?: string;
  // Documentos
  cpf?: string;
  rg?: string;
  rg_issuer?: string;
  // Dados Bancários
  bank_name?: string;
  bank_agency?: string;
  bank_account?: string;
  bank_account_type?: string;
  pix_key?: string;
}

export const useEmployeeContact = (userId: string | undefined) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contact, isLoading } = useQuery({
    queryKey: ["employee_contact", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await supabase
        .from("employees_contact")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const updateContact = useMutation({
    mutationFn: async (contactData: Partial<Omit<EmployeeContact, 'user_id'>>) => {
      if (!userId) throw new Error("User ID is required");

      const fullData = {
        user_id: userId,
        country: contactData.country || 'BR',
        zip_code: contactData.zip_code || '00000-000',
        state: contactData.state || 'SP',
        city: contactData.city || 'São Paulo',
        street: contactData.street || 'A preencher',
        number: contactData.number || '0',
        ...contactData,
      };

      const { data, error } = await supabase
        .from("employees_contact")
        .upsert([fullData])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employee_contact", userId] });
      toast({
        title: "Contato atualizado",
        description: "Os dados de contato foram atualizados com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar contato",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    contact,
    isLoading,
    updateContact: updateContact.mutate,
    isUpdating: updateContact.isPending,
  };
};
