export interface EmployeeContractData {
  base_salary: number;
  health_insurance: number;
  dental_insurance?: number;
  transportation_voucher: number;
  meal_voucher: number;
  other_benefits: number;
  contract_type: "clt" | "pj" | "internship" | "temporary" | "other";
}

export interface CostSettings {
  rat_rate: number;
  system_s_rate: number;
  inss_employer_rate: number;
  fgts_rate: number;
  enable_severance_provision: boolean;
}

export interface EmployeeCostBreakdown {
  // Valores base
  base_salary: number;
  benefits: number; // VR + VT + PS + HO + OB
  
  // Encargos sobre salário
  inss_employer: number;
  rat: number;
  system_s: number;
  fgts: number;
  total_charges: number;
  
  // Provisões mensais
  thirteenth_salary: number;
  vacation: number;
  vacation_bonus: number; // 1/3
  fgts_thirteenth: number;
  fgts_vacation: number;
  severance_provision: number; // opcional
  total_provisions: number;
  
  // Totais
  payroll_only: number; // SB
  values_without_taxes: number; // SB + Benefícios
  total_with_charges: number; // SB + Benefícios + Encargos + Provisões
}

/**
 * Calcula encargos sobre o salário bruto
 */
export function calculateCharges(
  baseSalary: number,
  settings: CostSettings
): {
  inss_employer: number;
  rat: number;
  system_s: number;
  fgts: number;
  total: number;
} {
  const inss_employer = baseSalary * (settings.inss_employer_rate / 100);
  const rat = baseSalary * (settings.rat_rate / 100);
  const system_s = baseSalary * (settings.system_s_rate / 100);
  const fgts = baseSalary * (settings.fgts_rate / 100);
  
  return {
    inss_employer,
    rat,
    system_s,
    fgts,
    total: inss_employer + rat + system_s + fgts,
  };
}

/**
 * Calcula provisões mensais
 * Para PJ: apenas férias (sem 13º e sem FGTS)
 * Para CLT: todas as provisões
 */
export function calculateProvisions(
  baseSalary: number,
  settings: CostSettings,
  contractType: "clt" | "pj" | "internship" | "temporary" | "other"
): {
  thirteenth_salary: number;
  vacation: number;
  vacation_bonus: number;
  fgts_thirteenth: number;
  fgts_vacation: number;
  severance_provision: number;
  total: number;
} {
  const isCLT = contractType === "clt";
  
  // PJ: apenas provisão de férias
  if (contractType === "pj") {
    const vacation = baseSalary / 12;
    const vacation_bonus = baseSalary / 36; // 1/3 de férias
    
    return {
      thirteenth_salary: 0,
      vacation,
      vacation_bonus,
      fgts_thirteenth: 0,
      fgts_vacation: 0,
      severance_provision: 0,
      total: vacation + vacation_bonus,
    };
  }
  
  // CLT: todas as provisões
  const thirteenth_salary = baseSalary / 12;
  const vacation = baseSalary / 12;
  const vacation_bonus = baseSalary / 36; // 1/3 de férias
  
  const fgts_thirteenth = thirteenth_salary * (settings.fgts_rate / 100);
  const fgts_vacation = (vacation + vacation_bonus) * (settings.fgts_rate / 100);
  
  const severance_provision = settings.enable_severance_provision
    ? (baseSalary * (settings.fgts_rate / 100) * 0.40) / 12
    : 0;
  
  return {
    thirteenth_salary,
    vacation,
    vacation_bonus,
    fgts_thirteenth,
    fgts_vacation,
    severance_provision,
    total:
      thirteenth_salary +
      vacation +
      vacation_bonus +
      fgts_thirteenth +
      fgts_vacation +
      severance_provision,
  };
}

/**
 * Calcula breakdown completo de custos de um colaborador
 * CLT: todos os encargos e provisões
 * PJ: apenas provisão de férias, sem encargos trabalhistas
 */
export function calculateEmployeeCost(
  contract: EmployeeContractData,
  settings: CostSettings
): EmployeeCostBreakdown {
  const benefits =
    (contract.health_insurance || 0) +
    (contract.dental_insurance || 0) +
    (contract.transportation_voucher || 0) +
    (contract.meal_voucher || 0) +
    (contract.other_benefits || 0);

  const isCLT = contract.contract_type === "clt";
  
  // Encargos: apenas para CLT
  const charges = isCLT 
    ? calculateCharges(contract.base_salary, settings)
    : { inss_employer: 0, rat: 0, system_s: 0, fgts: 0, total: 0 };
  
  // Provisões: completas para CLT, apenas férias para PJ
  const provisions = calculateProvisions(contract.base_salary, settings, contract.contract_type);

  return {
    base_salary: contract.base_salary,
    benefits,
    
    inss_employer: charges.inss_employer,
    rat: charges.rat,
    system_s: charges.system_s,
    fgts: charges.fgts,
    total_charges: charges.total,
    
    thirteenth_salary: provisions.thirteenth_salary,
    vacation: provisions.vacation,
    vacation_bonus: provisions.vacation_bonus,
    fgts_thirteenth: provisions.fgts_thirteenth,
    fgts_vacation: provisions.fgts_vacation,
    severance_provision: provisions.severance_provision,
    total_provisions: provisions.total,
    
    payroll_only: contract.base_salary,
    values_without_taxes: contract.base_salary + benefits,
    total_with_charges: contract.base_salary + benefits + charges.total + provisions.total,
  };
}

/**
 * Calcula totais consolidados para múltiplos colaboradores
 */
export interface ConsolidatedCosts {
  total_employees: number;
  total_payroll: number;
  total_values_without_taxes: number;
  total_with_charges: number;
  total_benefits: number;
  total_charges: number;
  total_provisions: number;
  
  // Percentuais
  benefits_percentage: number;
  charges_percentage: number;
  provisions_percentage: number;
}

export function calculateConsolidatedCosts(
  breakdowns: EmployeeCostBreakdown[]
): ConsolidatedCosts {
  const total_employees = breakdowns.length;
  const total_payroll = breakdowns.reduce((sum, b) => sum + b.payroll_only, 0);
  const total_values_without_taxes = breakdowns.reduce((sum, b) => sum + b.values_without_taxes, 0);
  const total_with_charges = breakdowns.reduce((sum, b) => sum + b.total_with_charges, 0);
  const total_benefits = breakdowns.reduce((sum, b) => sum + b.benefits, 0);
  const total_charges = breakdowns.reduce((sum, b) => sum + b.total_charges, 0);
  const total_provisions = breakdowns.reduce((sum, b) => sum + b.total_provisions, 0);
  
  return {
    total_employees,
    total_payroll,
    total_values_without_taxes,
    total_with_charges,
    total_benefits,
    total_charges,
    total_provisions,
    
    benefits_percentage: total_payroll > 0 ? (total_benefits / total_payroll) * 100 : 0,
    charges_percentage: total_payroll > 0 ? (total_charges / total_payroll) * 100 : 0,
    provisions_percentage: total_payroll > 0 ? (total_provisions / total_payroll) * 100 : 0,
  };
}
