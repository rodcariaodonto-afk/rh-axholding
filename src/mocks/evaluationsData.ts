import type { 
  MyPendingEvaluation, 
  MyReceivedEvaluation, 
  CompetencyResult,
  EvaluationCompetencyResponse,
  EvaluationCycle,
} from "@/types/evaluation";

// Mock evaluation cycles
export const mockEvaluationCycles: EvaluationCycle[] = [
  {
    id: "cycle-q1-2026",
    organization_id: "org-001",
    name: "Avaliação de Desempenho Q1 2026",
    description: "Ciclo de avaliação do primeiro trimestre de 2026",
    start_date: "2026-01-15",
    end_date: "2026-03-15",
    scale_levels: 5,
    scale_label_type: "concordancia",
    custom_labels: [],
    evaluation_type: "360",
    allow_self_evaluation: true,
    include_self_in_average: false,
    require_competency_comments: false,
    competency_comments_required: false,
    require_general_comments: true,
    admission_cutoff_date: "2025-10-01",
    contract_types: ["clt", "pj"],
    status: "active",
    created_by: "user-001",
    created_at: "2026-01-01T10:00:00Z",
    updated_at: "2026-01-01T10:00:00Z",
  },
  {
    id: "cycle-q4-2025",
    organization_id: "org-001",
    name: "Avaliação de Desempenho Q4 2025",
    description: "Ciclo de avaliação do quarto trimestre de 2025",
    start_date: "2025-10-01",
    end_date: "2025-12-15",
    scale_levels: 5,
    scale_label_type: "excelencia",
    custom_labels: [],
    evaluation_type: "180",
    allow_self_evaluation: true,
    include_self_in_average: true,
    require_competency_comments: false,
    competency_comments_required: false,
    require_general_comments: true,
    admission_cutoff_date: null,
    contract_types: [],
    status: "completed",
    created_by: "user-001",
    created_at: "2025-09-15T10:00:00Z",
    updated_at: "2025-12-16T10:00:00Z",
  },
];

// Mock pending evaluations for the current user as evaluator
export const mockPendingEvaluations: MyPendingEvaluation[] = [
  {
    participant_id: "part-001",
    cycle_id: "cycle-q1-2026",
    cycle_name: "Avaliação de Desempenho Q1 2026",
    cycle_end_date: "2026-03-15",
    evaluated_id: "emp-001",
    evaluated_name: "João Pedro Silva",
    evaluated_photo: null,
    evaluated_position: "Desenvolvedor Sênior",
    relationship: "manager",
    status: "pending",
    scale_levels: 5,
    scale_labels: ["Discordo fortemente", "Discordo", "Neutro", "Concordo", "Concordo fortemente"],
    require_comments: false,
    require_general_comments: true,
  },
  {
    participant_id: "part-002",
    cycle_id: "cycle-q1-2026",
    cycle_name: "Avaliação de Desempenho Q1 2026",
    cycle_end_date: "2026-03-15",
    evaluated_id: "emp-002",
    evaluated_name: "Maria Santos Costa",
    evaluated_photo: null,
    evaluated_position: "Designer UX",
    relationship: "peer",
    status: "pending",
    scale_levels: 5,
    scale_labels: ["Discordo fortemente", "Discordo", "Neutro", "Concordo", "Concordo fortemente"],
    require_comments: false,
    require_general_comments: true,
  },
  {
    participant_id: "part-003",
    cycle_id: "cycle-q1-2026",
    cycle_name: "Avaliação de Desempenho Q1 2026",
    cycle_end_date: "2026-03-15",
    evaluated_id: "current-user",
    evaluated_name: "Você (Autoavaliação)",
    evaluated_photo: null,
    evaluated_position: "Tech Lead",
    relationship: "self",
    status: "pending",
    scale_levels: 5,
    scale_labels: ["Discordo fortemente", "Discordo", "Neutro", "Concordo", "Concordo fortemente"],
    require_comments: false,
    require_general_comments: true,
  },
];

// Mock received evaluations
export const mockReceivedEvaluations: MyReceivedEvaluation[] = [
  {
    cycle_id: "cycle-q4-2025",
    cycle_name: "Avaliação de Desempenho Q4 2025",
    cycle_start_date: "2025-10-01",
    cycle_end_date: "2025-12-15",
    overall_average: 4.2,
    total_evaluators: 5,
    by_relationship: {
      manager: { average: 4.5, count: 1 },
      peer: { average: 4.1, count: 3 },
      direct_report: { average: 4.0, count: 0 },
      self: { average: 4.0, count: 1 },
    },
  },
];

// Mock soft skills for results
const mockSoftSkillsList = [
  { id: "comunicacao", name: "Comunicação", description: "Habilidade de transmitir informação com clareza" },
  { id: "inteligencia-emocional", name: "Inteligência Emocional", description: "Capacidade de compreender e lidar com emoções" },
  { id: "aprendizagem-agil", name: "Aprendizagem Ágil", description: "Capacidade de aprender de forma contínua" },
  { id: "lideranca", name: "Liderança", description: "Capacidade de influenciar e guiar pessoas" },
  { id: "pensamento-critico", name: "Pensamento Crítico", description: "Capacidade de analisar situações e propor soluções" },
  { id: "produtividade", name: "Produtividade", description: "Capacidade de gerenciar tempo e priorizar tarefas" },
];

// Mock competency results
export const mockCompetencyResults: CompetencyResult[] = mockSoftSkillsList.map((skill) => ({
  competency_id: skill.id,
  competency_name: skill.name,
  competency_description: skill.description,
  competency_type: 'soft_skill' as const,
  average: 3.5 + Math.random() * 1.5,
  responses: [
    {
      evaluator_name: "Ana Carolina Mendes",
      evaluator_relationship: "manager" as const,
      score: 4 + Math.floor(Math.random() * 2),
      comment: Math.random() > 0.5 ? `Excelente em ${skill.name.toLowerCase()}.` : null,
    },
    {
      evaluator_name: "Bruno Ferreira",
      evaluator_relationship: "peer" as const,
      score: 3 + Math.floor(Math.random() * 2),
      comment: null,
    },
  ],
}));

// Mock general comments
export const mockGeneralComments = [
  {
    evaluator_name: "Ana Carolina Mendes",
    evaluator_relationship: "manager" as const,
    comment: "Profissional dedicado e comprometido com os resultados. Demonstra proatividade em buscar soluções.",
  },
  {
    evaluator_name: "Bruno Ferreira",
    evaluator_relationship: "peer" as const,
    comment: "Ótimo colega de trabalho, sempre disposto a ajudar a equipe.",
  },
];

// Helper to get initial responses for answering
export const getInitialResponses = (softSkills: Array<{ id: string; name: string }>): EvaluationCompetencyResponse[] => {
  return softSkills.map((skill) => ({
    competency_id: skill.id,
    competency_name: skill.name,
    competency_type: 'soft_skill' as const,
    score: null,
    comment: '',
  }));
};

// localStorage keys
export const EVALUATION_STORAGE_KEYS = {
  PENDING: 'evaluation_pending_list',
  DRAFTS: 'evaluation_drafts',
  RECEIVED: 'evaluation_received_list',
  RESULTS: 'evaluation_results',
  CYCLES: 'evaluation_cycles',
} as const;

// Initialize mock data in localStorage
export const initializeMockEvaluationData = () => {
  if (!localStorage.getItem(EVALUATION_STORAGE_KEYS.PENDING)) {
    localStorage.setItem(EVALUATION_STORAGE_KEYS.PENDING, JSON.stringify(mockPendingEvaluations));
  }
  if (!localStorage.getItem(EVALUATION_STORAGE_KEYS.RECEIVED)) {
    localStorage.setItem(EVALUATION_STORAGE_KEYS.RECEIVED, JSON.stringify(mockReceivedEvaluations));
  }
  if (!localStorage.getItem(EVALUATION_STORAGE_KEYS.CYCLES)) {
    localStorage.setItem(EVALUATION_STORAGE_KEYS.CYCLES, JSON.stringify(mockEvaluationCycles));
  }
  if (!localStorage.getItem(EVALUATION_STORAGE_KEYS.RESULTS)) {
    localStorage.setItem(EVALUATION_STORAGE_KEYS.RESULTS, JSON.stringify({
      'cycle-q4-2025': {
        competencies: mockCompetencyResults,
        generalComments: mockGeneralComments,
      },
    }));
  }
};
