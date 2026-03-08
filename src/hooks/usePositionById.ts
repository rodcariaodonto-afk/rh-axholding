import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePositionById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["position", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("positions")
        .select(`
          *,
          parent_position:parent_position_id(id, title)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};
