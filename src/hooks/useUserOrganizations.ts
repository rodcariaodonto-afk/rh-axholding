import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserOrganization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  role: string;
  is_owner: boolean;
}

export const useUserOrganizations = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-organizations", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          is_owner,
          role_id,
          roles:role_id ( slug ),
          organizations:organization_id (
            id,
            name,
            slug,
            logo_url
          )
        `)
        .eq("user_id", userId);

      if (error) throw error;

      // Transform the data to flatten organization info
      return (data || [])
        .filter((item) => item.organizations)
        .map((item) => ({
          id: (item.organizations as any).id,
          name: (item.organizations as any).name,
          slug: (item.organizations as any).slug,
          logo_url: (item.organizations as any).logo_url,
          role: (item.roles as any)?.slug ?? "user",
          is_owner: item.is_owner || false,
        })) as UserOrganization[];
    },
    enabled: !!userId,
  });
};
