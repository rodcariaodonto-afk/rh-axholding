import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";

export interface CentralDocument {
  id: string;
  employee_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  category: string | null;
  description: string | null;
  expires_at: string | null;
  created_at: string;
  employee_name: string | null;
}

export function useDocumentsCentral() {
  const { organizationId } = useCurrentOrganization();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents-central", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("employee_documents")
        .select(`
          id,
          employee_id,
          file_name,
          file_url,
          file_type,
          file_size,
          category,
          description,
          expires_at,
          created_at,
          employee:employee_id(full_name, organization_id)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Filter by org and map
      return (data || [])
        .filter((d: any) => d.employee?.organization_id === organizationId)
        .map((d: any) => ({
          id: d.id,
          employee_id: d.employee_id,
          file_name: d.file_name,
          file_url: d.file_url,
          file_type: d.file_type,
          file_size: d.file_size,
          category: d.category,
          description: d.description,
          expires_at: d.expires_at,
          created_at: d.created_at,
          employee_name: d.employee?.full_name || "—",
        })) as CentralDocument[];
    },
    enabled: !!organizationId,
  });

  return { documents, isLoading };
}
