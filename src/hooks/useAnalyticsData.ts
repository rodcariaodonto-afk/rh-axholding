import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { differenceInYears, differenceInMonths, parseISO, startOfYear, format, subMonths } from "date-fns";
import { mockAnalyticsData } from "@/mocks/analyticsData";

interface EmployeeAnalytics {
  id: string;
  status: string;
  gender: string | null;
  ethnicity: string | null;
  birth_date: string | null;
  department_id: string | null;
  department_name: string | null;
  education_level: string | null;
  employment_type: string;
  hire_date: string | null;
  termination_date: string | null;
  termination_reason: string | null;
  termination_decision: string | null;
  termination_cause: string | null;
}

interface DepartmentData {
  id: string;
  name: string;
}

interface JobData {
  id: string;
  status: string;
}

interface MonthlyData {
  month: string;
  headcount: number;
  hires: number;
  terminations: number;
  turnoverRate: number;
}

export interface AnalyticsData {
  // Raw data
  employees: EmployeeAnalytics[];
  departments: DepartmentData[];
  jobs: JobData[];
  
  // KPIs
  activeEmployees: number;
  turnoverRate: number;
  openJobs: number;
  avgTenureYears: number;
  
  // Hiring metrics
  hiresLast12Months: number;
  terminationsLast12Months: number;
  
  // Monthly evolution
  monthlyData: MonthlyData[];
  
  // Department distribution
  departmentDistribution: { name: string; count: number }[];
  
  // Contract type distribution
  contractTypeDistribution: { name: string; count: number }[];
  
  // Tenure distribution
  tenureDistribution: { range: string; count: number }[];
  
  // Termination reasons
  terminationReasons: { reason: string; count: number }[];
  terminationCauses: { cause: string; count: number }[];
  terminationDecisions: { decision: string; count: number }[];
  
  // Diversity metrics
  genderDistribution: { gender: string; count: number }[];
  ethnicityDistribution: { ethnicity: string; count: number }[];
  ageDistribution: { range: string; male: number; female: number; other: number }[];
  educationDistribution: { level: string; count: number }[];
  genderByDepartment: { department: string; male: number; female: number; other: number }[];
  
  // Calculated
  femalePercentage: number;
  avgAge: number;
}

const GENDER_LABELS: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
  non_binary: "Não-binário",
  prefer_not_to_say: "Prefere não dizer",
};

const ETHNICITY_LABELS: Record<string, string> = {
  white: "Branco",
  black: "Negro",
  brown: "Pardo",
  asian: "Asiático",
  indigenous: "Indígena",
  not_declared: "Não declarado",
};

const EDUCATION_LABELS: Record<string, string> = {
  elementary: "Ensino Fundamental",
  high_school: "Ensino Médio",
  technical: "Técnico",
  undergraduate: "Graduação",
  postgraduate: "Pós-graduação",
  masters: "Mestrado",
  doctorate: "Doutorado",
  postdoc: "Pós-doutorado",
};

const TERMINATION_REASON_LABELS: Record<string, string> = {
  pedido_demissao: "Pedido de demissão",
  sem_justa_causa: "Sem justa causa",
  justa_causa: "Justa causa",
  antecipada_termo_empregador: "Antecipação de termo",
  fim_contrato: "Fim de contrato",
  acordo_mutuo: "Acordo mútuo",
  outros: "Outros",
};

const TERMINATION_CAUSE_LABELS: Record<string, string> = {
  recebimento_proposta: "Recebeu proposta",
  baixo_desempenho: "Baixo desempenho",
  corte_custos: "Corte de custos",
  relocacao: "Relocação",
  insatisfacao: "Insatisfação",
  problemas_pessoais: "Problemas pessoais",
  outros: "Outros",
};

const TERMINATION_DECISION_LABELS: Record<string, string> = {
  pediu_pra_sair: "Pediu para sair",
  foi_demitido: "Foi demitido",
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  full_time: "Tempo integral",
  part_time: "Meio período",
  contractor: "PJ",
  intern: "Estagiário",
};

export const useAnalyticsData = (isDemoMode: boolean = false) => {
  return useQuery({
    queryKey: ["analytics-data", isDemoMode],
    queryFn: async (): Promise<AnalyticsData> => {
      // Modo demo: retorna dados fictícios imediatamente
      if (isDemoMode) {
        return mockAnalyticsData;
      }

      const now = new Date();
      const twelveMonthsAgo = subMonths(now, 12);
      
      // Fetch employees with department info
      const { data: employeesRaw, error: empError } = await supabase
        .from("employees")
        .select(`
          id,
          status,
          gender,
          ethnicity,
          birth_date,
          department_id,
          departments!employees_department_id_fkey (name),
          education_level,
          employment_type,
          termination_date,
          termination_reason,
          termination_decision,
          termination_cause
        `);
      
      if (empError) throw empError;
      
      // Fetch contracts for hire dates
      const employeeIds = employeesRaw?.map(emp => emp.id) || [];
      const { data: contracts } = await supabase
        .from("employees_contracts")
        .select("user_id, hire_date")
        .in("user_id", employeeIds);
      
      const contractsMap = new Map(
        contracts?.map(c => [c.user_id, c.hire_date]) || []
      );
      
      // Fetch departments
      const { data: departments, error: deptError } = await supabase
        .from("departments")
        .select("id, name");
      
      if (deptError) throw deptError;
      
      // Fetch jobs
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, status");
      
      if (jobsError) throw jobsError;
      
      // Map employees with hire_date
      const employees: EmployeeAnalytics[] = (employeesRaw || []).map((emp: any) => ({
        id: emp.id,
        status: emp.status,
        gender: emp.gender,
        ethnicity: emp.ethnicity,
        birth_date: emp.birth_date,
        department_id: emp.department_id,
        department_name: emp.departments?.name || null,
        education_level: emp.education_level,
        employment_type: emp.employment_type,
        hire_date: contractsMap.get(emp.id) || null,
        termination_date: emp.termination_date,
        termination_reason: emp.termination_reason,
        termination_decision: emp.termination_decision,
        termination_cause: emp.termination_cause,
      }));
      
      // Calculate metrics
      const activeEmployees = employees.filter(e => e.status === "active");
      const terminatedEmployees = employees.filter(e => e.status === "terminated");
      
      // KPIs
      const activeCount = activeEmployees.length;
      const openJobs = (jobs || []).filter(j => j.status === "active").length;
      
      // Turnover rate (last 12 months)
      const terminationsLast12 = terminatedEmployees.filter(e => {
        if (!e.termination_date) return false;
        const termDate = parseISO(e.termination_date);
        return termDate >= twelveMonthsAgo;
      });
      
      const hiresLast12 = employees.filter(e => {
        if (!e.hire_date) return false;
        const hireDate = parseISO(e.hire_date);
        return hireDate >= twelveMonthsAgo;
      });
      
      const avgHeadcount = (activeCount + activeCount + terminationsLast12.length) / 2;
      const turnoverRate = avgHeadcount > 0 
        ? (terminationsLast12.length / avgHeadcount) * 100 
        : 0;
      
      // Average tenure
      const tenures = activeEmployees
        .filter(e => e.hire_date)
        .map(e => differenceInMonths(now, parseISO(e.hire_date!)) / 12);
      const avgTenureYears = tenures.length > 0 
        ? tenures.reduce((a, b) => a + b, 0) / tenures.length 
        : 0;
      
      // Monthly data (last 12 months)
      const monthlyData: MonthlyData[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStr = format(monthDate, "yyyy-MM");
        const monthLabel = format(monthDate, "MMM/yy");
        
        const monthHires = employees.filter(e => {
          if (!e.hire_date) return false;
          return e.hire_date.startsWith(monthStr);
        }).length;
        
        const monthTerminations = terminatedEmployees.filter(e => {
          if (!e.termination_date) return false;
          return e.termination_date.startsWith(monthStr);
        }).length;
        
        // Calculate headcount at end of month
        const headcount = employees.filter(e => {
          const hireDate = e.hire_date ? parseISO(e.hire_date) : null;
          const termDate = e.termination_date ? parseISO(e.termination_date) : null;
          
          const wasHired = hireDate && hireDate <= monthDate;
          const wasTerminated = termDate && termDate <= monthDate;
          
          return wasHired && !wasTerminated;
        }).length;
        
        // Calculate monthly turnover rate
        const monthlyTurnoverRate = headcount > 0 
          ? (monthTerminations / headcount) * 100 
          : 0;
        
        monthlyData.push({
          month: monthLabel,
          headcount,
          hires: monthHires,
          terminations: monthTerminations,
          turnoverRate: monthlyTurnoverRate,
        });
      }
      
      // Department distribution
      const deptCounts = new Map<string, number>();
      activeEmployees.forEach(e => {
        const deptName = e.department_name || "Não definido";
        deptCounts.set(deptName, (deptCounts.get(deptName) || 0) + 1);
      });
      const departmentDistribution = Array.from(deptCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      
      // Contract type distribution
      const contractCounts = new Map<string, number>();
      activeEmployees.forEach(e => {
        const type = CONTRACT_TYPE_LABELS[e.employment_type] || e.employment_type;
        contractCounts.set(type, (contractCounts.get(type) || 0) + 1);
      });
      const contractTypeDistribution = Array.from(contractCounts.entries())
        .map(([name, count]) => ({ name, count }));
      
      // Tenure distribution
      const tenureRanges = [
        { range: "< 1 ano", min: 0, max: 1 },
        { range: "1-2 anos", min: 1, max: 2 },
        { range: "2-3 anos", min: 2, max: 3 },
        { range: "3-5 anos", min: 3, max: 5 },
        { range: "5+ anos", min: 5, max: Infinity },
      ];
      const tenureDistribution = tenureRanges.map(({ range, min, max }) => {
        const count = activeEmployees.filter(e => {
          if (!e.hire_date) return false;
          const years = differenceInMonths(now, parseISO(e.hire_date)) / 12;
          return years >= min && years < max;
        }).length;
        return { range, count };
      });
      
      // Termination reasons
      const reasonCounts = new Map<string, number>();
      terminatedEmployees.forEach(e => {
        if (e.termination_reason) {
          const label = TERMINATION_REASON_LABELS[e.termination_reason] || e.termination_reason;
          reasonCounts.set(label, (reasonCounts.get(label) || 0) + 1);
        }
      });
      const terminationReasons = Array.from(reasonCounts.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);
      
      // Termination causes
      const causeCounts = new Map<string, number>();
      terminatedEmployees.forEach(e => {
        if (e.termination_cause) {
          const label = TERMINATION_CAUSE_LABELS[e.termination_cause] || e.termination_cause;
          causeCounts.set(label, (causeCounts.get(label) || 0) + 1);
        }
      });
      const terminationCauses = Array.from(causeCounts.entries())
        .map(([cause, count]) => ({ cause, count }))
        .sort((a, b) => b.count - a.count);
      
      // Termination decisions
      const decisionCounts = new Map<string, number>();
      terminatedEmployees.forEach(e => {
        if (e.termination_decision) {
          const label = TERMINATION_DECISION_LABELS[e.termination_decision] || e.termination_decision;
          decisionCounts.set(label, (decisionCounts.get(label) || 0) + 1);
        }
      });
      const terminationDecisions = Array.from(decisionCounts.entries())
        .map(([decision, count]) => ({ decision, count }))
        .sort((a, b) => b.count - a.count);
      
      // Gender distribution
      const genderCounts = new Map<string, number>();
      activeEmployees.forEach(e => {
        const gender = e.gender ? (GENDER_LABELS[e.gender] || e.gender) : "Não informado";
        genderCounts.set(gender, (genderCounts.get(gender) || 0) + 1);
      });
      const genderDistribution = Array.from(genderCounts.entries())
        .map(([gender, count]) => ({ gender, count }));
      
      // Female percentage
      const femaleCount = activeEmployees.filter(e => e.gender === "female").length;
      const femalePercentage = activeCount > 0 ? (femaleCount / activeCount) * 100 : 0;
      
      // Ethnicity distribution
      const ethnicityCounts = new Map<string, number>();
      activeEmployees.forEach(e => {
        const ethnicity = e.ethnicity ? (ETHNICITY_LABELS[e.ethnicity] || e.ethnicity) : "Não informado";
        ethnicityCounts.set(ethnicity, (ethnicityCounts.get(ethnicity) || 0) + 1);
      });
      const ethnicityDistribution = Array.from(ethnicityCounts.entries())
        .map(([ethnicity, count]) => ({ ethnicity, count }))
        .sort((a, b) => b.count - a.count);
      
      // Age distribution (pyramid)
      const ageRanges = [
        { range: "18-25", min: 18, max: 25 },
        { range: "26-35", min: 26, max: 35 },
        { range: "36-45", min: 36, max: 45 },
        { range: "46-55", min: 46, max: 55 },
        { range: "56+", min: 56, max: Infinity },
      ];
      const ageDistribution = ageRanges.map(({ range, min, max }) => {
        const inRange = activeEmployees.filter(e => {
          if (!e.birth_date) return false;
          const age = differenceInYears(now, parseISO(e.birth_date));
          return age >= min && age <= max;
        });
        return {
          range,
          male: inRange.filter(e => e.gender === "male").length,
          female: inRange.filter(e => e.gender === "female").length,
          other: inRange.filter(e => e.gender && e.gender !== "male" && e.gender !== "female").length,
        };
      });
      
      // Average age
      const ages = activeEmployees
        .filter(e => e.birth_date)
        .map(e => differenceInYears(now, parseISO(e.birth_date!)));
      const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;
      
      // Education distribution
      const educationCounts = new Map<string, number>();
      activeEmployees.forEach(e => {
        const level = e.education_level ? (EDUCATION_LABELS[e.education_level] || e.education_level) : "Não informado";
        educationCounts.set(level, (educationCounts.get(level) || 0) + 1);
      });
      const educationDistribution = Array.from(educationCounts.entries())
        .map(([level, count]) => ({ level, count }))
        .sort((a, b) => b.count - a.count);
      
      // Gender by department
      const deptGenderMap = new Map<string, { male: number; female: number; other: number }>();
      activeEmployees.forEach(e => {
        const dept = e.department_name || "Não definido";
        if (!deptGenderMap.has(dept)) {
          deptGenderMap.set(dept, { male: 0, female: 0, other: 0 });
        }
        const counts = deptGenderMap.get(dept)!;
        if (e.gender === "male") counts.male++;
        else if (e.gender === "female") counts.female++;
        else if (e.gender) counts.other++;
      });
      const genderByDepartment = Array.from(deptGenderMap.entries())
        .map(([department, counts]) => ({ department, ...counts }))
        .sort((a, b) => (b.male + b.female + b.other) - (a.male + a.female + a.other));
      
      return {
        employees,
        departments: departments || [],
        jobs: jobs || [],
        activeEmployees: activeCount,
        turnoverRate,
        openJobs,
        avgTenureYears,
        hiresLast12Months: hiresLast12.length,
        terminationsLast12Months: terminationsLast12.length,
        monthlyData,
        departmentDistribution,
        contractTypeDistribution,
        tenureDistribution,
        terminationReasons,
        terminationCauses,
        terminationDecisions,
        genderDistribution,
        ethnicityDistribution,
        ageDistribution,
        educationDistribution,
        genderByDepartment,
        femalePercentage,
        avgAge,
      };
    },
  });
};
