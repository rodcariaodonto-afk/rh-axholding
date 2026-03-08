import type { ScaleLabelType, EvaluationType } from "@/types/evaluation";

export const EVALUATION_WIZARD_STEPS = [
  {
    id: 1,
    title: "CRIAR AVALIAÇÃO",
    description: "Nome, descrição e prazo",
  },
  {
    id: 2,
    title: "ESCALAS",
    description: "Níveis e rótulos",
  },
  {
    id: 3,
    title: "CONFIGURAÇÕES",
    description: "Tipo e filtros",
  },
  {
    id: 4,
    title: "PARTICIPANTES",
    description: "Avaliador e avaliado",
  },
];

export interface ScaleLabelOption {
  id: ScaleLabelType;
  name: string;
  labels5: string[];
  labels4: string[];
}

export const SCALE_LABEL_OPTIONS: ScaleLabelOption[] = [
  {
    id: 'concordancia',
    name: 'Concordância',
    labels5: ['Discordo fortemente', 'Discordo', 'Neutro', 'Concordo', 'Concordo fortemente'],
    labels4: ['Discordo fortemente', 'Discordo', 'Concordo', 'Concordo fortemente'],
  },
  {
    id: 'excelencia',
    name: 'Excelência',
    labels5: ['Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'],
    labels4: ['Ruim', 'Regular', 'Bom', 'Excelente'],
  },
  {
    id: 'expectativa',
    name: 'Expectativa',
    labels5: ['Muito abaixo', 'Abaixo', 'Dentro', 'Acima', 'Muito acima'],
    labels4: ['Abaixo', 'Dentro', 'Acima', 'Muito acima'],
  },
  {
    id: 'frequencia',
    name: 'Frequência',
    labels5: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'],
    labels4: ['Raramente', 'Às vezes', 'Frequentemente', 'Sempre'],
  },
  {
    id: 'custom',
    name: 'Personalizado',
    labels5: ['', '', '', '', ''],
    labels4: ['', '', '', ''],
  },
];

export const EVALUATION_TYPE_OPTIONS: Array<{
  id: EvaluationType;
  name: string;
  description: string;
  icon: string;
}> = [
  {
    id: '90',
    name: '90°',
    description: 'Líder avalia liderado',
    icon: '↓',
  },
  {
    id: '180',
    name: '180°',
    description: 'Líder avalia liderado + Liderado avalia líder',
    icon: '↕',
  },
  {
    id: '360',
    name: '360°',
    description: 'Líder, liderado e pares se avaliam mutuamente',
    icon: '⟳',
  },
  {
    id: 'custom',
    name: 'Customizada',
    description: 'Defina livremente quem avalia quem',
    icon: '✎',
  },
];

export const RELATIONSHIP_LABELS: Record<string, string> = {
  manager: 'Gestor',
  peer: 'Par',
  self: 'Autoavaliação',
  direct_report: 'Liderado',
};

export const RELATIONSHIP_COLORS: Record<string, string> = {
  manager: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  peer: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  self: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  direct_report: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export const CONTRACT_TYPE_OPTIONS = [
  { value: 'clt', label: 'CLT' },
  { value: 'pj', label: 'PJ' },
  { value: 'estagio', label: 'Estágio' },
  { value: 'temporario', label: 'Temporário' },
  { value: 'terceirizado', label: 'Terceirizado' },
];

export const EVALUATION_STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

export const EVALUATION_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export const PARTICIPANT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em andamento',
  completed: 'Concluída',
};

export const PARTICIPANT_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};
