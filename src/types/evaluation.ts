// Evaluation Types for Performance Evaluation Module

export type EvaluationType = '90' | '180' | '360' | 'custom';
export type EvaluationCycleStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type EvaluationParticipantStatus = 'pending' | 'in_progress' | 'completed';
export type EvaluationRelationship = 'manager' | 'peer' | 'self' | 'direct_report';
export type ScaleLabelType = 'concordancia' | 'excelencia' | 'expectativa' | 'frequencia' | 'custom';

export interface EvaluationCycle {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  scale_levels: 4 | 5;
  scale_label_type: ScaleLabelType;
  custom_labels?: string[];
  evaluation_type: EvaluationType;
  allow_self_evaluation: boolean;
  include_self_in_average: boolean;
  require_competency_comments: boolean;
  competency_comments_required: boolean;
  require_general_comments: boolean;
  admission_cutoff_date: string | null;
  contract_types: string[];
  status: EvaluationCycleStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EvaluationParticipant {
  id: string;
  cycle_id: string;
  evaluator_id: string;
  evaluated_id: string;
  relationship: EvaluationRelationship;
  status: EvaluationParticipantStatus;
  completed_at: string | null;
  created_at: string;
  evaluator?: {
    id: string;
    full_name: string | null;
    email: string;
    photo_url: string | null;
  };
  evaluated?: {
    id: string;
    full_name: string | null;
    email: string;
    photo_url: string | null;
  };
}

export interface EvaluationResponse {
  id: string;
  participant_id: string;
  competency_type: 'hard_skill' | 'soft_skill';
  competency_id: string;
  score: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvaluationGeneralComment {
  id: string;
  participant_id: string;
  comment: string;
  created_at: string;
}

// Form data for the wizard
export interface EvaluationFormData {
  // Step 1: Basic Info
  name: string;
  description: string;
  start_date: Date | null;
  end_date: Date | null;
  
  // Step 2: Scales
  scale_levels: 4 | 5;
  scale_label_type: ScaleLabelType;
  custom_labels: string[];
  require_competency_comments: boolean;
  competency_comments_required: boolean;
  require_general_comments: boolean;
  
  // Step 3: Config
  evaluation_type: EvaluationType;
  allow_self_evaluation: boolean;
  include_self_in_average: boolean;
  admission_cutoff_date: Date | null;
  contract_types: string[];
  
  // Step 4: Participants
  participants: Array<{
    evaluator_id: string;
    evaluated_id: string;
    relationship: EvaluationRelationship;
  }>;
}

export const defaultEvaluationFormData: EvaluationFormData = {
  name: '',
  description: '',
  start_date: null,
  end_date: null,
  scale_levels: 5,
  scale_label_type: 'concordancia',
  custom_labels: ['', '', '', '', ''],
  require_competency_comments: false,
  competency_comments_required: false,
  require_general_comments: false,
  evaluation_type: '90',
  allow_self_evaluation: false,
  include_self_in_average: false,
  admission_cutoff_date: null,
  contract_types: [],
  participants: [],
};

// ============================================
// Employee-facing evaluation types
// ============================================

// Avaliação pendente do ponto de vista do avaliador
export interface MyPendingEvaluation {
  participant_id: string;
  cycle_id: string;
  cycle_name: string;
  cycle_end_date: string;
  evaluated_id: string;
  evaluated_name: string;
  evaluated_photo: string | null;
  evaluated_position: string | null;
  relationship: EvaluationRelationship;
  status: EvaluationParticipantStatus;
  scale_levels: 4 | 5;
  scale_labels: string[];
  require_comments: boolean;
  require_general_comments: boolean;
}

// Resultado recebido como avaliado
export interface MyReceivedEvaluation {
  cycle_id: string;
  cycle_name: string;
  cycle_start_date: string;
  cycle_end_date: string;
  overall_average: number;
  total_evaluators: number;
  by_relationship: {
    manager: { average: number; count: number };
    peer: { average: number; count: number };
    direct_report: { average: number; count: number };
    self: { average: number | null; count: 0 | 1 };
  };
}

// Detalhamento de uma competência avaliada
export interface CompetencyResult {
  competency_id: string;
  competency_name: string;
  competency_description?: string;
  competency_type: 'hard_skill' | 'soft_skill';
  average: number;
  responses: Array<{
    evaluator_name: string;
    evaluator_relationship: EvaluationRelationship;
    score: number;
    comment: string | null;
  }>;
}

// Resposta de uma competência individual
export interface EvaluationCompetencyResponse {
  competency_id: string;
  competency_name: string;
  competency_type: 'hard_skill' | 'soft_skill';
  score: number | null;
  comment: string;
}

// Rascunho/Submissão salva
export interface EvaluationDraft {
  participant_id: string;
  responses: EvaluationCompetencyResponse[];
  general_comment: string;
  status: 'draft' | 'submitted';
  saved_at: string;
  submitted_at: string | null;
}

// Labels de escala por tipo
export const scaleLabelsMap: Record<ScaleLabelType, { labels4: string[]; labels5: string[] }> = {
  concordancia: {
    labels4: ['Discordo', 'Discordo parcialmente', 'Concordo parcialmente', 'Concordo'],
    labels5: ['Discordo fortemente', 'Discordo', 'Neutro', 'Concordo', 'Concordo fortemente'],
  },
  excelencia: {
    labels4: ['Insuficiente', 'Regular', 'Bom', 'Excelente'],
    labels5: ['Insuficiente', 'Regular', 'Bom', 'Muito bom', 'Excelente'],
  },
  expectativa: {
    labels4: ['Abaixo', 'Parcialmente', 'Atende', 'Supera'],
    labels5: ['Muito abaixo', 'Abaixo', 'Atende', 'Acima', 'Muito acima'],
  },
  frequencia: {
    labels4: ['Raramente', 'Às vezes', 'Frequentemente', 'Sempre'],
    labels5: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'],
  },
  custom: {
    labels4: ['', '', '', ''],
    labels5: ['', '', '', '', ''],
  },
};

// Helper to get scale labels
export const getScaleLabels = (type: ScaleLabelType, levels: 4 | 5, customLabels?: string[]): string[] => {
  if (type === 'custom' && customLabels && customLabels.length === levels) {
    return customLabels;
  }
  return levels === 4 ? scaleLabelsMap[type].labels4 : scaleLabelsMap[type].labels5;
};
