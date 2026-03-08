import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useEmployeeById = (id: string | undefined) => {
  return useQuery({
    queryKey: ["employee", id],
    queryFn: async () => {
      if (!id) throw new Error("ID is required");

      const { data, error } = await supabase
        .from("employees")
        .select(`
          id,
          email,
          full_name,
          status,
          employment_type,
          birth_date,
          gender,
          marital_status,
          number_of_children,
          education_level,
          education_course,
          birthplace,
          nationality,
          photo_url,
          ethnicity,
          department_id,
          manager_id,
          unit_id,
          base_position_id,
          position_level_detail,
          created_at,
          updated_at,
          departments:department_id (id, name),
          positions:base_position_id (id, title, has_levels),
          units:unit_id (id, name),
          manager:manager_id (id, email, full_name)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Buscar contrato separadamente
      const { data: contract } = await supabase
        .from("employees_contracts")
        .select("hire_date")
        .eq("user_id", id)
        .maybeSingle();
      
      // Add hire_date from contract to the employee object
      const employeeData: any = {
        ...data,
        hire_date: contract?.hire_date || null
      };
      
      return employeeData;
    },
    enabled: !!id,
  });
};
