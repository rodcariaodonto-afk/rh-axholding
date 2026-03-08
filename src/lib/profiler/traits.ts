// Profiler Comportamental - Traits Data
// Adjectives for behavioral assessment

export interface Trait {
  id: string;
  label: string;
  profiles: string[]; // Which profile codes this trait contributes to
  weight: number;
}

// Traits for "Eu Real" (How you really are) - Stage 1
export const realTraits: Trait[] = [
  // Executor traits (D - Dominance)
  { id: "decidido", label: "Decidido", profiles: ["EXE"], weight: 2 },
  { id: "competitivo", label: "Competitivo", profiles: ["EXE"], weight: 2 },
  { id: "direto", label: "Direto", profiles: ["EXE"], weight: 2 },
  { id: "assertivo", label: "Assertivo", profiles: ["EXE"], weight: 2 },
  { id: "ambicioso", label: "Ambicioso", profiles: ["EXE"], weight: 1 },
  { id: "corajoso", label: "Corajoso", profiles: ["EXE"], weight: 1 },
  { id: "determinado", label: "Determinado", profiles: ["EXE"], weight: 2 },
  { id: "independente", label: "Independente", profiles: ["EXE"], weight: 1 },
  { id: "audacioso", label: "Audacioso", profiles: ["EXE"], weight: 1 },
  { id: "persistente", label: "Persistente", profiles: ["EXE", "PLA"], weight: 1 },
  
  // Comunicador traits (I - Influence)
  { id: "entusiasmado", label: "Entusiasmado", profiles: ["COM"], weight: 2 },
  { id: "persuasivo", label: "Persuasivo", profiles: ["COM"], weight: 2 },
  { id: "otimista", label: "Otimista", profiles: ["COM"], weight: 2 },
  { id: "sociavel", label: "Sociável", profiles: ["COM"], weight: 2 },
  { id: "inspirador", label: "Inspirador", profiles: ["COM"], weight: 2 },
  { id: "carismatico", label: "Carismático", profiles: ["COM"], weight: 1 },
  { id: "expressivo", label: "Expressivo", profiles: ["COM"], weight: 1 },
  { id: "animado", label: "Animado", profiles: ["COM"], weight: 1 },
  { id: "confiante", label: "Confiante", profiles: ["COM", "EXE"], weight: 1 },
  { id: "criativo", label: "Criativo", profiles: ["COM"], weight: 1 },
  
  // Planejador traits (S - Steadiness)
  { id: "paciente", label: "Paciente", profiles: ["PLA"], weight: 2 },
  { id: "leal", label: "Leal", profiles: ["PLA"], weight: 2 },
  { id: "confiavel", label: "Confiável", profiles: ["PLA"], weight: 2 },
  { id: "cooperativo", label: "Cooperativo", profiles: ["PLA"], weight: 2 },
  { id: "estavel", label: "Estável", profiles: ["PLA"], weight: 2 },
  { id: "calmo", label: "Calmo", profiles: ["PLA"], weight: 1 },
  { id: "consistente", label: "Consistente", profiles: ["PLA"], weight: 1 },
  { id: "atencioso", label: "Atencioso", profiles: ["PLA"], weight: 1 },
  { id: "diplomatico", label: "Diplomático", profiles: ["PLA", "COM"], weight: 1 },
  { id: "compreensivo", label: "Compreensivo", profiles: ["PLA"], weight: 1 },
  
  // Analista traits (C - Conscientiousness)
  { id: "preciso", label: "Preciso", profiles: ["ANA"], weight: 2 },
  { id: "analitico", label: "Analítico", profiles: ["ANA"], weight: 2 },
  { id: "sistematico", label: "Sistemático", profiles: ["ANA"], weight: 2 },
  { id: "organizado", label: "Organizado", profiles: ["ANA"], weight: 2 },
  { id: "detalhista", label: "Detalhista", profiles: ["ANA"], weight: 2 },
  { id: "cauteloso", label: "Cauteloso", profiles: ["ANA"], weight: 1 },
  { id: "logico", label: "Lógico", profiles: ["ANA"], weight: 1 },
  { id: "perfeccionista", label: "Perfeccionista", profiles: ["ANA"], weight: 1 },
  { id: "meticuloso", label: "Meticuloso", profiles: ["ANA"], weight: 1 },
  { id: "reflexivo", label: "Reflexivo", profiles: ["ANA"], weight: 1 },
];

// Traits for "Eu Percebido" (How others expect you to be) - Stage 2
export const perceivedTraits: Trait[] = [
  // Executor traits
  { id: "p_lider", label: "Líder", profiles: ["EXE"], weight: 2 },
  { id: "p_rapido", label: "Rápido", profiles: ["EXE"], weight: 1 },
  { id: "p_forte", label: "Forte", profiles: ["EXE"], weight: 1 },
  { id: "p_dominante", label: "Dominante", profiles: ["EXE"], weight: 2 },
  { id: "p_desafiador", label: "Desafiador", profiles: ["EXE"], weight: 1 },
  { id: "p_orientadoresultados", label: "Orientado a Resultados", profiles: ["EXE"], weight: 2 },
  { id: "p_autoconfiante", label: "Autoconfiante", profiles: ["EXE"], weight: 1 },
  { id: "p_empreendedor", label: "Empreendedor", profiles: ["EXE"], weight: 1 },
  { id: "p_inovador", label: "Inovador", profiles: ["EXE", "COM"], weight: 1 },
  { id: "p_proativo", label: "Proativo", profiles: ["EXE"], weight: 1 },
  
  // Comunicador traits
  { id: "p_comunicativo", label: "Comunicativo", profiles: ["COM"], weight: 2 },
  { id: "p_amigavel", label: "Amigável", profiles: ["COM"], weight: 2 },
  { id: "p_motivador", label: "Motivador", profiles: ["COM"], weight: 2 },
  { id: "p_popular", label: "Popular", profiles: ["COM"], weight: 1 },
  { id: "p_influente", label: "Influente", profiles: ["COM"], weight: 2 },
  { id: "p_extrovertido", label: "Extrovertido", profiles: ["COM"], weight: 1 },
  { id: "p_alegre", label: "Alegre", profiles: ["COM"], weight: 1 },
  { id: "p_espontaneo", label: "Espontâneo", profiles: ["COM"], weight: 1 },
  { id: "p_convincente", label: "Convincente", profiles: ["COM"], weight: 1 },
  { id: "p_articulado", label: "Articulado", profiles: ["COM"], weight: 1 },
  
  // Planejador traits
  { id: "p_apoiador", label: "Apoiador", profiles: ["PLA"], weight: 2 },
  { id: "p_harmonioso", label: "Harmonioso", profiles: ["PLA"], weight: 1 },
  { id: "p_previsivel", label: "Previsível", profiles: ["PLA"], weight: 1 },
  { id: "p_colaborador", label: "Colaborador", profiles: ["PLA"], weight: 2 },
  { id: "p_equilibrado", label: "Equilibrado", profiles: ["PLA"], weight: 1 },
  { id: "p_tranquilo", label: "Tranquilo", profiles: ["PLA"], weight: 2 },
  { id: "p_acolhedor", label: "Acolhedor", profiles: ["PLA"], weight: 1 },
  { id: "p_generoso", label: "Generoso", profiles: ["PLA", "COM"], weight: 1 },
  { id: "p_solidario", label: "Solidário", profiles: ["PLA"], weight: 1 },
  { id: "p_dedicado", label: "Dedicado", profiles: ["PLA"], weight: 1 },
  
  // Analista traits
  { id: "p_criterioso", label: "Criterioso", profiles: ["ANA"], weight: 2 },
  { id: "p_tecnico", label: "Técnico", profiles: ["ANA"], weight: 1 },
  { id: "p_rigoroso", label: "Rigoroso", profiles: ["ANA"], weight: 1 },
  { id: "p_especialista", label: "Especialista", profiles: ["ANA"], weight: 2 },
  { id: "p_exigente", label: "Exigente", profiles: ["ANA"], weight: 1 },
  { id: "p_objetivo", label: "Objetivo", profiles: ["ANA"], weight: 2 },
  { id: "p_metodico", label: "Metódico", profiles: ["ANA"], weight: 1 },
  { id: "p_investigativo", label: "Investigativo", profiles: ["ANA"], weight: 1 },
  { id: "p_concentrado", label: "Concentrado", profiles: ["ANA"], weight: 1 },
  { id: "p_racional", label: "Racional", profiles: ["ANA"], weight: 1 },
];

export const getAllRealTraits = (): Trait[] => realTraits;
export const getAllPerceivedTraits = (): Trait[] => perceivedTraits;
