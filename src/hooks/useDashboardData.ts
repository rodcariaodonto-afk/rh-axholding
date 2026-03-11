import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/useCurrentOrganization";
import { addDays, differenceInDays, format, isSameMonth, isSameDay, parseISO } from "date-fns";

export function useDashboardData() {
  const { organizationId } = useCurrentOrganization();
  const today = new Date();

  // Active employees
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ["dashboard-employees", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("id, full_name, email, birth_date, status, department_id, created_at, photo_url")
        .eq("organization_id", organizationId!)
        .eq("status", "active");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });

  // Contracts (for hire dates, salary, expiry)
  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["dashboard-contracts", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees_contracts")
        .select("user_id, hire_date, base_salary, contract_type, contract_end_date, is_active, probation_days")
        .eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });

  // Departments
  const { data: departments = [] } = useQuery({
    queryKey: ["dashboard-departments", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .eq("organization_id", organizationId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });

  // Time off requests pending
  const { data: pendingTimeOff = [] } = useQuery({
    queryKey: ["dashboard-timeoff", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off_requests")
        .select("id")
        .eq("organization_id", organizationId!)
        .eq("status", "pending_people");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!organizationId,
  });

  // Computed data
  const headcount = employees.length;

  // Birthdays this month
  const birthdaysThisMonth = useMemo(() => {
    return employees.filter((e) => {
      if (!e.birth_date) return false;
      const bd = parseISO(e.birth_date);
      return bd.getMonth() === today.getMonth();
    }).sort((a, b) => {
      const dayA = parseISO(a.birth_date!).getDate();
      const dayB = parseISO(b.birth_date!).getDate();
      return dayA - dayB;
    });
  }, [employees, today]);

  // Work anniversaries this month
  const anniversariesThisMonth = useMemo(() => {
    return contracts.filter((c) => {
      if (!c.hire_date) return false;
      const hd = parseISO(c.hire_date);
      return hd.getMonth() === today.getMonth() && hd.getFullYear() !== today.getFullYear();
    }).map((c) => {
      const emp = employees.find((e) => e.id === c.user_id);
      const years = today.getFullYear() - parseISO(c.hire_date).getFullYear();
      return { ...c, employee: emp, years };
    }).filter((c) => c.employee);
  }, [contracts, employees, today]);

  // Contracts expiring in 30 days
  const expiringContracts = useMemo(() => {
    return contracts.filter((c) => {
      if (!c.contract_end_date) return false;
      const end = parseISO(c.contract_end_date);
      const diff = differenceInDays(end, today);
      return diff >= 0 && diff <= 30;
    }).map((c) => {
      const emp = employees.find((e) => e.id === c.user_id);
      const daysLeft = differenceInDays(parseISO(c.contract_end_date!), today);
      return { ...c, employee: emp, daysLeft };
    }).filter((c) => c.employee);
  }, [contracts, employees, today]);

  // Probation ending in 15 days
  const probationEnding = useMemo(() => {
    return contracts.filter((c) => {
      if (!c.hire_date || !c.probation_days) return false;
      const probEnd = addDays(parseISO(c.hire_date), c.probation_days);
      const diff = differenceInDays(probEnd, today);
      return diff >= 0 && diff <= 15;
    }).map((c) => {
      const emp = employees.find((e) => e.id === c.user_id);
      const probEnd = addDays(parseISO(c.hire_date), c.probation_days!);
      const daysLeft = differenceInDays(probEnd, today);
      return { ...c, employee: emp, daysLeft, probEnd };
    }).filter((c) => c.employee);
  }, [contracts, employees, today]);

  // Average salary
  const avgSalary = useMemo(() => {
    const salaries = contracts.filter((c) => c.base_salary > 0).map((c) => c.base_salary);
    if (salaries.length === 0) return 0;
    return salaries.reduce((a, b) => a + b, 0) / salaries.length;
  }, [contracts]);

  // New hires this month
  const newHiresThisMonth = useMemo(() => {
    return employees.filter((e) => {
      const created = parseISO(e.created_at);
      return isSameMonth(created, today);
    }).length;
  }, [employees, today]);

  // Department breakdown
  const deptBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of employees) {
      const deptId = e.department_id || "sem_dept";
      map.set(deptId, (map.get(deptId) || 0) + 1);
    }
    return departments
      .map((d) => ({ name: d.name, count: map.get(d.id) || 0 }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [employees, departments]);

  return {
    headcount,
    birthdaysThisMonth,
    anniversariesThisMonth,
    expiringContracts,
    probationEnding,
    avgSalary,
    newHiresThisMonth,
    pendingTimeOffCount: pendingTimeOff.length,
    deptBreakdown,
    isLoading: loadingEmployees || loadingContracts,
  };
}
