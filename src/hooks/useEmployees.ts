import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRequireOrganization } from "./useRequireOrganization";
import type { Json } from "@/integrations/supabase/types";

export interface Employee {
  id: string;
  email: string;
  full_name?: string;
  status?: string;
  employment_type?: string;
  contract_type?: string | null;
  hire_date?: string;
  birth_date?: string | null;
  department_id?: string | null;
  department_name?: string | null;
  base_position_id?: string | null;
  position_title?: string | null;
  photo_url?: string | null;
  profiler_result_code?: string | null;
  profiler_result_detail?: Json | null;
  profiler_completed_at?: string | null;
  termination_date?: string | null;
  termination_reason?: string | null;
  termination_decision?: string | null;
  termination_cause?: string | null;
  termination_cost?: number | null;
  manager_id?: string | null;
}

export const useEmployees = () => {
  const { organization } = useRequireOrganization();

  return useQuery({
    queryKey: ["employees", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("employees")
        .select(`
          id, 
          email, 
          full_name, 
          status, 
          employment_type,
          birth_date,
          department_id,
          departments!employees_department_id_fkey (name),
          base_position_id,
          positions (title),
          photo_url,
          profiler_result_code,
          profiler_result_detail,
          profiler_completed_at,
          termination_date,
          termination_reason,
          termination_decision,
          termination_cause,
          termination_cost,
          manager_id
        `)
        .eq("organization_id", organization.id)
        .order("email");

      if (error) throw error;
      
      // Buscar contratos separadamente para evitar problema de JOIN
      const employeeIds = data.map(emp => emp.id);
      const { data: contracts } = await supabase
        .from("employees_contracts")
        .select("user_id, hire_date, contract_type")
        .in("user_id", employeeIds)
        .eq("is_active", true);
      
      // Mapear dados dos contratos
      const contractsMap = new Map(
        contracts?.map(c => [c.user_id, { hire_date: c.hire_date, contract_type: c.contract_type }]) || []
      );
      
      const employees = data.map((emp: any) => {
        const contract = contractsMap.get(emp.id);
        return {
          id: emp.id,
          email: emp.email,
          full_name: emp.full_name,
          status: emp.status,
          employment_type: emp.employment_type,
          contract_type: contract?.contract_type || null,
          hire_date: contract?.hire_date || null,
          birth_date: emp.birth_date,
          department_id: emp.department_id,
          department_name: emp.departments?.name || null,
          base_position_id: emp.base_position_id,
          position_title: emp.positions?.title || null,
          photo_url: emp.photo_url,
          profiler_result_code: emp.profiler_result_code,
          profiler_result_detail: emp.profiler_result_detail,
          profiler_completed_at: emp.profiler_completed_at,
          termination_date: emp.termination_date,
          termination_reason: emp.termination_reason,
          termination_decision: emp.termination_decision,
          termination_cause: emp.termination_cause,
          termination_cost: emp.termination_cost,
          manager_id: emp.manager_id,
        };
      });
      
      return employees as Employee[];
    },
    enabled: !!organization?.id,
  });
};
