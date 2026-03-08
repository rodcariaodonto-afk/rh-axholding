import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateEmployeeCost, calculateConsolidatedCosts } from "@/lib/companyCostCalculations";
import type { EmployeeCostBreakdown, ConsolidatedCosts } from "@/lib/companyCostCalculations";
import { useCompanyCostSettings } from "./useCompanyCostSettings";
import { useRequireOrganization } from "./useRequireOrganization";

export interface EmployeeWithCost {
  employee_id: string;
  full_name: string | null;
  email: string;
  department: string | null;
  position: string | null;
  hire_date: string | null;
  termination_date: string | null;
  cost: EmployeeCostBreakdown;
}

export const useCompanyCosts = () => {
  const { settings, isLoading: isLoadingSettings } = useCompanyCostSettings();
  const { organization } = useRequireOrganization();

  const { data, isLoading: isLoadingContracts } = useQuery({
    queryKey: ["company_costs", organization?.id, settings],
    queryFn: async () => {
      if (!organization?.id) return { employees: [], consolidated: null };

      // Buscar colaboradores ativos da organização
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select(`
          id,
          email,
          full_name,
          department_id,
          base_position_id,
          termination_date,
          status,
          departments:department_id (name),
          positions:base_position_id (title)
        `)
        .eq("organization_id", organization.id)
        .eq("status", "active");

      if (employeesError) throw employeesError;
      if (!employees || employees.length === 0) return { employees: [], consolidated: null };
      if (!settings) return { employees: [], consolidated: null };

      // Buscar contratos ativos para os colaboradores da organização
      const userIds = employees.map(e => e.id);
      const { data: contracts, error: contractsError } = await supabase
        .from("employees_contracts")
        .select("user_id, contract_type, hire_date, base_salary, health_insurance, dental_insurance, transportation_voucher, meal_voucher, other_benefits")
        .in("user_id", userIds)
        .eq("is_active", true);

      if (contractsError) throw contractsError;
      if (!contracts || contracts.length === 0) return { employees: [], consolidated: null };

      // Criar mapas para lookup rápido
      const employeesMap = new Map(
        employees.map(emp => [emp.id, emp])
      );
      const contractsMap = new Map(
        contracts.map(c => [c.user_id, c])
      );

      // Calcular custos para cada colaborador ativo com contrato
      const employeesWithCosts: EmployeeWithCost[] = [];
      
      for (const employee of employees) {
        const contract = contractsMap.get(employee.id);
        if (!contract) continue;
        
        const cost = calculateEmployeeCost(
          {
            contract_type: contract.contract_type,
            base_salary: contract.base_salary,
            health_insurance: contract.health_insurance || 0,
            dental_insurance: contract.dental_insurance || 0,
            transportation_voucher: contract.transportation_voucher || 0,
            meal_voucher: contract.meal_voucher || 0,
            other_benefits: contract.other_benefits || 0,
          },
          settings
        );

        employeesWithCosts.push({
          employee_id: employee.id,
          full_name: employee.full_name || null,
          email: employee.email || "",
          department: (employee.departments as any)?.name || null,
          position: (employee.positions as any)?.title || null,
          hire_date: contract.hire_date || null,
          termination_date: employee.termination_date || null,
          cost,
        });
      }

      // Calcular totais consolidados
      const consolidated: ConsolidatedCosts = calculateConsolidatedCosts(
        employeesWithCosts.map((e) => e.cost)
      );

      return {
        employees: employeesWithCosts,
        consolidated,
      };
    },
    enabled: !!settings && !!organization?.id,
  });

  return {
    employees: data?.employees || [],
    consolidated: data?.consolidated || null,
    isLoading: isLoadingSettings || isLoadingContracts,
  };
};
