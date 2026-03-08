// Motivos de desligamento agrupados por categoria (CLT/eSocial)
export const TERMINATION_REASON_GROUPS = [
  {
    category: "Iniciativa do Empregador",
    options: [
      { value: "sem_justa_causa", label: "Rescisão sem justa causa" },
      { value: "justa_causa", label: "Rescisão com justa causa" },
      { value: "antecipada_termo_empregador", label: "Antecipação de contrato pelo empregador" },
    ],
    inferDecision: "foi_demitido" as const,
  },
  {
    category: "Iniciativa do Empregado",
    options: [
      { value: "pedido_demissao", label: "Pedido de demissão" },
      { value: "rescisao_indireta", label: "Rescisão indireta" },
      { value: "antecipada_termo_empregado", label: "Antecipação de contrato pelo empregado" },
    ],
    inferDecision: "pediu_pra_sair" as const,
  },
  {
    category: "Acordo Mútuo",
    options: [
      { value: "acordo_mutuo", label: "Acordo mútuo (Art. 484-A CLT)" },
    ],
    inferDecision: null,
  },
  {
    category: "Término de Contrato",
    options: [
      { value: "fim_contrato", label: "Término de contrato a termo" },
    ],
    inferDecision: null,
  },
  {
    category: "Aposentadoria",
    options: [
      { value: "aposentadoria_idade", label: "Aposentadoria por idade" },
      { value: "aposentadoria_invalidez", label: "Aposentadoria por invalidez" },
      { value: "aposentadoria_compulsoria", label: "Aposentadoria compulsória" },
    ],
    inferDecision: "pediu_pra_sair" as const,
  },
  {
    category: "Outros",
    options: [
      { value: "falecimento", label: "Falecimento do empregado" },
      { value: "forca_maior", label: "Força maior" },
      { value: "outros", label: "Outros motivos" },
    ],
    inferDecision: null,
  },
];

// Decisão de demissão (voluntário/involuntário)
export const TERMINATION_DECISION_OPTIONS = [
  { value: "pediu_pra_sair", label: "Voluntário (iniciativa do empregado)" },
  { value: "foi_demitido", label: "Involuntário (iniciativa do empregador)" },
];

// Motivos internos (classificação gerencial)
export const TERMINATION_CAUSE_OPTIONS = [
  { value: "recebimento_proposta", label: "Recebimento de proposta" },
  { value: "insatisfacao", label: "Insatisfação com ambiente de trabalho" },
  { value: "relocacao", label: "Relocação/mudança de cidade" },
  { value: "problemas_pessoais", label: "Problemas pessoais" },
  { value: "baixo_desempenho", label: "Baixo desempenho" },
  { value: "corte_custos", label: "Corte de custos" },
  { value: "reestruturacao", label: "Reajuste na estrutura" },
  { value: "outros", label: "Outros" },
];

// Mapeamento para labels de exibição
export const TERMINATION_REASON_LABELS: Record<string, string> = 
  TERMINATION_REASON_GROUPS.flatMap(g => g.options)
    .reduce((acc, opt) => ({ ...acc, [opt.value]: opt.label }), {});

export const TERMINATION_DECISION_LABELS: Record<string, string> = 
  TERMINATION_DECISION_OPTIONS.reduce((acc, opt) => ({ ...acc, [opt.value]: opt.label }), {});

export const TERMINATION_CAUSE_LABELS: Record<string, string> = 
  TERMINATION_CAUSE_OPTIONS.reduce((acc, opt) => ({ ...acc, [opt.value]: opt.label }), {});

// Helper para encontrar a inferência de decisão baseada no motivo legal
export const getInferredDecision = (reasonValue: string): string | null => {
  const group = TERMINATION_REASON_GROUPS.find(g => 
    g.options.some(opt => opt.value === reasonValue)
  );
  return group?.inferDecision ?? null;
};
