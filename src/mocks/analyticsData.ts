import { AnalyticsData } from "@/hooks/useAnalyticsData";

export const mockAnalyticsData: AnalyticsData = {
  // === RAW DATA (não exibidos diretamente) ===
  employees: [],
  departments: [],
  jobs: [],

  // === ABA GERAL - KPIs ===
  activeEmployees: 156,
  turnoverRate: 8.4,
  openJobs: 7,
  avgTenureYears: 2.8,

  // === ABA CONTRATAÇÃO - KPIs ===
  hiresLast12Months: 42,
  terminationsLast12Months: 14,

  // === EVOLUÇÃO MENSAL (12 meses com crescimento realista) ===
  monthlyData: [
    { month: "Fev/25", headcount: 128, hires: 4, terminations: 2, turnoverRate: 1.6 },
    { month: "Mar/25", headcount: 132, hires: 5, terminations: 1, turnoverRate: 0.8 },
    { month: "Abr/25", headcount: 135, hires: 4, terminations: 1, turnoverRate: 0.7 },
    { month: "Mai/25", headcount: 138, hires: 4, terminations: 1, turnoverRate: 0.7 },
    { month: "Jun/25", headcount: 140, hires: 3, terminations: 1, turnoverRate: 0.7 },
    { month: "Jul/25", headcount: 143, hires: 4, terminations: 1, turnoverRate: 0.7 },
    { month: "Ago/25", headcount: 146, hires: 4, terminations: 1, turnoverRate: 0.7 },
    { month: "Set/25", headcount: 148, hires: 3, terminations: 1, turnoverRate: 0.7 },
    { month: "Out/25", headcount: 151, hires: 4, terminations: 1, turnoverRate: 0.7 },
    { month: "Nov/25", headcount: 153, hires: 3, terminations: 1, turnoverRate: 0.7 },
    { month: "Dez/25", headcount: 154, hires: 2, terminations: 1, turnoverRate: 0.6 },
    { month: "Jan/26", headcount: 156, hires: 3, terminations: 1, turnoverRate: 0.6 },
  ],

  // === DISTRIBUIÇÃO POR DEPARTAMENTO (típico software house) ===
  departmentDistribution: [
    { name: "Engenharia", count: 62 },
    { name: "Produto", count: 24 },
    { name: "Design", count: 16 },
    { name: "Comercial", count: 18 },
    { name: "Customer Success", count: 14 },
    { name: "Pessoas (RH)", count: 8 },
    { name: "Financeiro", count: 8 },
    { name: "Operações", count: 6 },
  ],

  // === TIPO DE CONTRATO ===
  contractTypeDistribution: [
    { name: "Tempo integral", count: 128 },
    { name: "PJ", count: 18 },
    { name: "Estagiário", count: 8 },
    { name: "Meio período", count: 2 },
  ],

  // === TEMPO DE CASA ===
  tenureDistribution: [
    { range: "< 1 ano", count: 38 },
    { range: "1-2 anos", count: 46 },
    { range: "2-3 anos", count: 34 },
    { range: "3-5 anos", count: 28 },
    { range: "5+ anos", count: 10 },
  ],

  // === DESLIGAMENTOS - MOTIVOS ===
  terminationReasons: [
    { reason: "Pedido de demissão", count: 8 },
    { reason: "Sem justa causa", count: 3 },
    { reason: "Acordo mútuo", count: 2 },
    { reason: "Fim de contrato", count: 1 },
  ],

  // === DESLIGAMENTOS - CAUSAS ===
  terminationCauses: [
    { cause: "Recebeu proposta", count: 5 },
    { cause: "Relocação", count: 3 },
    { cause: "Problemas pessoais", count: 2 },
    { cause: "Insatisfação", count: 2 },
    { cause: "Baixo desempenho", count: 2 },
  ],

  // === DESLIGAMENTOS - DECISÃO ===
  terminationDecisions: [
    { decision: "Pediu para sair", count: 10 },
    { decision: "Foi demitido", count: 4 },
  ],

  // === DIVERSIDADE - GÊNERO ===
  genderDistribution: [
    { gender: "Masculino", count: 91 },
    { gender: "Feminino", count: 60 },
    { gender: "Não-binário", count: 3 },
    { gender: "Prefere não dizer", count: 2 },
  ],

  // === DIVERSIDADE - ETNIA ===
  ethnicityDistribution: [
    { ethnicity: "Branco", count: 68 },
    { ethnicity: "Pardo", count: 44 },
    { ethnicity: "Negro", count: 28 },
    { ethnicity: "Asiático", count: 10 },
    { ethnicity: "Indígena", count: 2 },
    { ethnicity: "Não declarado", count: 4 },
  ],

  // === PIRÂMIDE ETÁRIA ===
  ageDistribution: [
    { range: "18-25", male: 14, female: 12, other: 1 },
    { range: "26-35", male: 48, female: 32, other: 2 },
    { range: "36-45", male: 22, female: 12, other: 0 },
    { range: "46-55", male: 5, female: 3, other: 0 },
    { range: "56+", male: 2, female: 1, other: 0 },
  ],

  // === FORMAÇÃO ACADÊMICA ===
  educationDistribution: [
    { level: "Graduação", count: 72 },
    { level: "Pós-graduação", count: 34 },
    { level: "Ensino Médio", count: 18 },
    { level: "Mestrado", count: 16 },
    { level: "Técnico", count: 12 },
    { level: "Doutorado", count: 4 },
  ],

  // === GÊNERO POR DEPARTAMENTO ===
  genderByDepartment: [
    { department: "Engenharia", male: 44, female: 16, other: 2 },
    { department: "Produto", male: 12, female: 11, other: 1 },
    { department: "Design", male: 5, female: 11, other: 0 },
    { department: "Comercial", male: 10, female: 8, other: 0 },
    { department: "Customer Success", male: 4, female: 10, other: 0 },
    { department: "Pessoas (RH)", male: 2, female: 6, other: 0 },
    { department: "Financeiro", male: 4, female: 4, other: 0 },
    { department: "Operações", male: 4, female: 2, other: 0 },
  ],

  // === MÉTRICAS CALCULADAS ===
  femalePercentage: 38.5,
  avgAge: 31.2,
};
