import { addMonths, differenceInMonths, differenceInDays, isBefore, startOfDay, getDay, parseISO, isAfter, format } from "date-fns";

/**
 * Regras de Férias CLT + Pop
 * 
 * 1. Pode solicitar férias a partir do 10º mês de trabalho
 * 2. Pode gozar férias somente após completar 12 meses
 * 3. Tem até 23 meses (1 ano + 11 meses) após o período aquisitivo para gozar
 * 4. Não pode acumular 2 períodos aquisitivos sem gozar férias
 * 5. Mínimo de 5 dias corridos por período (CLT Art. 134, §1º)
 * 6. Férias não podem iniciar em sábado ou domingo (CLT Art. 134, §3º)
 */

export interface VacationEligibility {
  monthsWorked: number;
  canRequest: boolean;           // >= 10 meses - pode solicitar
  canEnjoy: boolean;             // >= 12 meses - pode gozar
  earliestEnjoyDate: Date;       // Data mínima para gozar férias
  remainingMonthsToRequest: number;
  remainingMonthsToEnjoy: number;
  hireDate: Date;
}

export interface AcquisitionPeriod {
  number: number;                // Número do período (1º, 2º, etc.)
  startDate: Date;               // Início do período aquisitivo
  endDate: Date;                 // Fim do período aquisitivo (12 meses)
  concessiveStart: Date;         // Início do período concessivo
  concessiveEnd: Date;           // Fim do período concessivo (23 meses após início)
  deadlineToEnjoy: Date;         // Prazo limite para gozar
}

export interface AcquisitionInfo {
  currentPeriod: AcquisitionPeriod | null;
  previousPeriod: AcquisitionPeriod | null;
  isOverdue: boolean;            // Se passou do prazo de algum período
  daysUntilDeadline: number;     // Dias até o prazo do período mais urgente
  hasAccumulatedPeriods: boolean; // Se tem períodos acumulados
  periods: AcquisitionPeriod[];
}

export interface VacationPeriodValidation {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Calcula a elegibilidade do colaborador para férias
 */
export function calculateVacationEligibility(hireDateStr: string): VacationEligibility {
  const hireDate = parseISO(hireDateStr);
  const today = startOfDay(new Date());
  
  const monthsWorked = differenceInMonths(today, hireDate);
  const canRequest = monthsWorked >= 10;
  const canEnjoy = monthsWorked >= 12;
  
  // Data mínima para gozar = 12 meses após admissão
  const earliestEnjoyDate = addMonths(hireDate, 12);
  
  const remainingMonthsToRequest = Math.max(0, 10 - monthsWorked);
  const remainingMonthsToEnjoy = Math.max(0, 12 - monthsWorked);
  
  return {
    monthsWorked,
    canRequest,
    canEnjoy,
    earliestEnjoyDate,
    remainingMonthsToRequest,
    remainingMonthsToEnjoy,
    hireDate,
  };
}

/**
 * Calcula os períodos aquisitivos do colaborador
 * Cada período aquisitivo é de 12 meses
 * O período concessivo é de 12 meses após o aquisitivo (total 23 meses do início)
 */
export function calculateAcquisitionPeriods(hireDateStr: string): AcquisitionInfo {
  const hireDate = parseISO(hireDateStr);
  const today = startOfDay(new Date());
  
  const monthsWorked = differenceInMonths(today, hireDate);
  const periods: AcquisitionPeriod[] = [];
  
  // Calcular quantos períodos aquisitivos completos existem
  const completedPeriods = Math.floor(monthsWorked / 12);
  
  // Gerar os períodos
  for (let i = 0; i < completedPeriods + 1; i++) {
    const periodStart = addMonths(hireDate, i * 12);
    const periodEnd = addMonths(periodStart, 12);
    const concessiveStart = periodEnd;
    // Prazo de 23 meses a partir do início do período aquisitivo
    // (12 meses aquisitivo + 11 meses concessivo)
    const concessiveEnd = addMonths(periodStart, 23);
    
    // Só incluir se o período aquisitivo já começou
    if (isBefore(periodStart, today)) {
      periods.push({
        number: i + 1,
        startDate: periodStart,
        endDate: periodEnd,
        concessiveStart,
        concessiveEnd,
        deadlineToEnjoy: concessiveEnd,
      });
    }
  }
  
  const currentPeriod = periods.length > 0 ? periods[periods.length - 1] : null;
  const previousPeriod = periods.length > 1 ? periods[periods.length - 2] : null;
  
  // Verificar se algum período está vencido
  let isOverdue = false;
  let daysUntilDeadline = Infinity;
  
  for (const period of periods) {
    // Se o período aquisitivo está completo e passou do prazo
    if (isAfter(today, period.endDate) && isAfter(today, period.deadlineToEnjoy)) {
      isOverdue = true;
    }
    
    // Calcular dias até o prazo mais próximo (de períodos já adquiridos)
    if (isAfter(today, period.endDate) && isBefore(today, period.deadlineToEnjoy)) {
      const days = differenceInDays(period.deadlineToEnjoy, today);
      if (days < daysUntilDeadline) {
        daysUntilDeadline = days;
      }
    }
  }
  
  if (daysUntilDeadline === Infinity) {
    daysUntilDeadline = -1;
  }
  
  // Verificar acúmulo de períodos (mais de 1 período completo sem gozar)
  const completedPeriodsWithoutVacation = periods.filter(
    p => isAfter(today, p.endDate)
  ).length;
  
  const hasAccumulatedPeriods = completedPeriodsWithoutVacation >= 2;
  
  return {
    currentPeriod,
    previousPeriod,
    isOverdue,
    daysUntilDeadline,
    hasAccumulatedPeriods,
    periods,
  };
}

/**
 * Valida as regras CLT para o período de férias
 */
export function validateVacationPeriod(
  startDate: Date | null,
  totalDays: number,
  hireDateStr: string | null,
  isVacationPolicy: boolean,
  isAdminBypass: boolean = false
): VacationPeriodValidation {
  // Se não é política de férias ou é bypass admin, não validar regras CLT
  if (!isVacationPolicy) {
    return { isValid: true };
  }
  
  // Validação de mínimo de 5 dias (sempre aplicar)
  if (totalDays > 0 && totalDays < 5) {
    return {
      isValid: false,
      error: "O período mínimo de férias é de 5 dias corridos (CLT Art. 134, §1º)",
    };
  }
  
  // Validação de início em dia útil
  if (startDate) {
    const dayOfWeek = getDay(startDate);
    if (dayOfWeek === 0) {
      return {
        isValid: false,
        error: "Férias não podem iniciar em domingo (CLT Art. 134, §3º)",
      };
    }
    if (dayOfWeek === 6) {
      return {
        isValid: false,
        error: "Férias não podem iniciar em sábado (CLT Art. 134, §3º)",
      };
    }
  }
  
  // Se é bypass admin, pular validações de período aquisitivo
  if (isAdminBypass) {
    return { isValid: true };
  }
  
  // Validações que dependem da data de admissão
  if (!hireDateStr) {
    return {
      isValid: false,
      error: "Não foi possível verificar a data de admissão do colaborador",
    };
  }
  
  const eligibility = calculateVacationEligibility(hireDateStr);
  
  // Verificar se pode solicitar (10 meses)
  if (!eligibility.canRequest) {
    return {
      isValid: false,
      error: `Você ainda não pode solicitar férias. Faltam ${eligibility.remainingMonthsToRequest} mese(s) para completar o período mínimo.`,
    };
  }
  
  // Verificar se a data de início é após 12 meses
  if (startDate && !eligibility.canEnjoy) {
    if (isBefore(startDate, eligibility.earliestEnjoyDate)) {
      return {
        isValid: false,
        error: `Férias só podem iniciar após ${format(eligibility.earliestEnjoyDate, "dd/MM/yyyy")} (12 meses de trabalho)`,
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Verifica acúmulo de períodos aquisitivos
 * Retorna erro se há períodos vencidos ou acumulados
 */
export function checkAccumulatedPeriods(
  hireDateStr: string,
  vacationsTaken: Array<{ start_date: string; end_date: string; total_days: number }>
): VacationPeriodValidation {
  const acquisitionInfo = calculateAcquisitionPeriods(hireDateStr);
  
  if (acquisitionInfo.isOverdue) {
    return {
      isValid: false,
      error: "Prazo para gozar férias do período anterior expirado. Entre em contato com o RH.",
    };
  }
  
  // Warning se está próximo do prazo (menos de 60 dias)
  if (acquisitionInfo.daysUntilDeadline > 0 && acquisitionInfo.daysUntilDeadline <= 60) {
    return {
      isValid: true,
      warning: `Atenção: faltam ${acquisitionInfo.daysUntilDeadline} dias para o prazo limite de gozo das férias.`,
    };
  }
  
  if (acquisitionInfo.hasAccumulatedPeriods) {
    return {
      isValid: true,
      warning: "Você tem períodos de férias acumulados. Regularize sua situação com o RH.",
    };
  }
  
  return { isValid: true };
}

/**
 * Formata informações sobre elegibilidade para exibição
 */
export function formatEligibilityInfo(eligibility: VacationEligibility): string {
  if (!eligibility.canRequest) {
    const requestDate = addMonths(eligibility.hireDate, 10);
    return `Poderá solicitar férias a partir de ${format(requestDate, "dd/MM/yyyy")} (10 meses de trabalho)`;
  }
  
  if (!eligibility.canEnjoy) {
    return `Poderá gozar férias a partir de ${format(eligibility.earliestEnjoyDate, "dd/MM/yyyy")} (12 meses de trabalho)`;
  }
  
  return `Elegível para férias (${eligibility.monthsWorked} meses de trabalho)`;
}
