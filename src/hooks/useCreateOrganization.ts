import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
  industry?: string;
  employee_count?: string;
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateOrganizationInput) => {
      // Use atomic SECURITY DEFINER RPC that creates org + roles + member + employee
      const { data: orgId, error } = await supabase.rpc(
        "create_organization_with_owner",
        {
          _name: input.name,
          _slug: input.slug,
          _description: input.description || undefined,
          _industry: input.industry || undefined,
          _employee_count: input.employee_count || undefined,
        }
      );

      if (error) {
        console.error("Error creating organization:", error);

        if (error.code === "23505" || error.message?.includes("organizations_slug_key")) {
          throw new Error("Este nome de empresa já está em uso. Tente um nome diferente.");
        }

        throw new Error(error.message || "Erro ao criar organização");
      }

      return { id: orgId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organization-settings"] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({
        title: "Organização criada!",
        description: "Sua empresa foi criada com sucesso. Vamos configurá-la agora.",
      });
    },
    onError: (error) => {
      console.error("Create organization error:", error);
      toast({
        title: "Erro ao criar organização",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });
}

// Helper to generate slug from name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}
