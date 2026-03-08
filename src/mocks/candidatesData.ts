import type { JobApplication, CandidateStage } from "@/hooks/useJobApplications";

// Generate a consistent UUID-like string from an index
const generateId = (prefix: string, index: number): string => {
  const paddedIndex = index.toString().padStart(4, '0');
  return `${prefix}-demo-${paddedIndex}-0000-000000000000`;
};

// Brazilian first names
const firstNames = [
  "Ana", "Bruno", "Carla", "Diego", "Eduarda", "Felipe", "Gabriela", "Henrique",
  "Isabela", "João", "Karen", "Lucas", "Marina", "Nicolas", "Olivia", "Pedro",
  "Rafaela", "Samuel", "Tatiana", "Victor", "Yasmin", "Wagner", "Amanda", "Bernardo",
  "Cecília", "Daniel", "Elisa", "Fernando", "Helena", "Igor", "Julia", "Kaique",
  "Laura", "Matheus", "Natália", "Otávio", "Paula", "Ricardo", "Sofia", "Thiago",
];

// Brazilian last names
const lastNames = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira",
  "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Lopes",
  "Soares", "Fernandes", "Vieira", "Barbosa", "Rocha", "Dias", "Nascimento", "Andrade",
  "Moreira", "Nunes", "Marques", "Machado", "Mendes", "Freitas", "Cardoso", "Ramos",
];

// Brazilian cities
const cities = [
  { city: "São Paulo", state: "SP" },
  { city: "Rio de Janeiro", state: "RJ" },
  { city: "Belo Horizonte", state: "MG" },
  { city: "Porto Alegre", state: "RS" },
  { city: "Curitiba", state: "PR" },
  { city: "Brasília", state: "DF" },
  { city: "Salvador", state: "BA" },
  { city: "Fortaleza", state: "CE" },
  { city: "Recife", state: "PE" },
  { city: "Florianópolis", state: "SC" },
];

// Profiler codes
const profilerCodes = ["DI", "DC", "DS", "DE", "ID", "IC", "IS", "IE", "CD", "CI", "CS", "CE", "SD", "SI", "SC", "SE", "ED", "EI", "EC", "ES"];

// Generate a random date in the past N days
const randomPastDate = (maxDaysAgo: number): string => {
  const daysAgo = Math.floor(Math.random() * maxDaysAgo);
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

// Generate a random birth date (age between 20 and 45)
const randomBirthDate = (): string => {
  const age = 20 + Math.floor(Math.random() * 25);
  const year = new Date().getFullYear() - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

// Generate mock candidates
const generateMockCandidates = (jobId: string): JobApplication[] => {
  const candidates: JobApplication[] = [];
  
  // Distribution of candidates by stage
  const stageDistribution: { stage: CandidateStage; count: number }[] = [
    { stage: "selecao", count: 18 },
    { stage: "fit_cultural", count: 12 },
    { stage: "fit_tecnico", count: 8 },
    { stage: "pre_admissao", count: 4 },
    { stage: "contratado", count: 2 },
    { stage: "rejeitado", count: 10 },
    { stage: "banco_talentos", count: 5 },
  ];

  let candidateIndex = 0;

  stageDistribution.forEach(({ stage, count }) => {
    for (let i = 0; i < count; i++) {
      const firstName = firstNames[candidateIndex % firstNames.length];
      const lastName = lastNames[candidateIndex % lastNames.length];
      const location = cities[candidateIndex % cities.length];
      
      // AI score distribution - higher scores in later stages
      let aiScore: number | null = null;
      if (Math.random() > 0.15) { // 85% have scores
        const baseScore = stage === "selecao" ? 40 
          : stage === "fit_cultural" ? 55 
          : stage === "fit_tecnico" ? 65 
          : stage === "pre_admissao" ? 78 
          : stage === "contratado" ? 85 
          : stage === "rejeitado" ? 35 
          : 50;
        aiScore = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 30) - 10));
      }

      // Profiler results - 70% have completed
      const hasProfiler = Math.random() > 0.3;
      const profilerCode = hasProfiler ? profilerCodes[candidateIndex % profilerCodes.length] : null;

      candidates.push({
        id: generateId("cand", candidateIndex),
        job_id: jobId,
        candidate_name: `${firstName} ${lastName}`,
        candidate_email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        candidate_birth_date: randomBirthDate(),
        resume_url: null,
        status: "active",
        stage,
        notes: null,
        profiler_result_code: profilerCode,
        profiler_result_detail: hasProfiler ? { 
          primary: profilerCode?.charAt(0),
          secondary: profilerCode?.charAt(1),
        } : null,
        profiler_completed_at: hasProfiler ? randomPastDate(30) : null,
        ai_score: aiScore,
        ai_report: aiScore ? `**Análise do Candidato**\n\nPontuação geral: ${aiScore}/100\n\n**Pontos fortes:**\n- Experiência relevante na área\n- Boa formação acadêmica\n- Habilidades técnicas alinhadas\n\n**Pontos de atenção:**\n- Necessita aprimorar comunicação\n- Pouca experiência em gestão de projetos\n\n**Recomendação:** ${aiScore >= 70 ? "Avançar para próxima etapa" : aiScore >= 50 ? "Avaliar com cautela" : "Não recomendado para a vaga"}` : null,
        ai_analysis_status: aiScore ? 'completed' : 'not_requested',
        applied_at: randomPastDate(45),
        updated_at: randomPastDate(10),
        candidate_state: location.state,
        candidate_city: location.city,
        candidate_phone: `(${10 + Math.floor(Math.random() * 90)}) 9${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        candidate_race: ["branca", "preta", "parda", "amarela", "indigena"][Math.floor(Math.random() * 5)],
        candidate_gender: ["masculino", "feminino", "nao_binario"][Math.floor(Math.random() * 3)],
        candidate_sexual_orientation: null,
        candidate_pcd: Math.random() > 0.9,
        candidate_pcd_type: null,
        desired_position: null,
        desired_seniority: null,
      });

      candidateIndex++;
    }
  });

  // Sort by applied_at descending
  return candidates.sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());
};

// Export a function that generates mock candidates for any job ID
export const getMockCandidates = (jobId: string): JobApplication[] => {
  return generateMockCandidates(jobId);
};

// Export pre-generated mock candidates for a demo job
export const DEMO_JOB_ID = "demo-job-0001-0000-000000000000";
export const mockCandidates = generateMockCandidates(DEMO_JOB_ID);
