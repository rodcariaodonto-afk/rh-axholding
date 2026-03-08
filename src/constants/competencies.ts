// Hard Skills by Area
export interface HardSkill {
  id: string;
  name: string;
  levels: {
    junior: number;
    pleno: number;
    senior: number;
  };
}

export interface HardSkillArea {
  id: string;
  name: string;
  skills: HardSkill[];
}

export interface SoftSkill {
  id: string;
  name: string;
  description: string;
  levels: {
    junior: { level1: number; level2: number; level3: number };
    pleno: { level1: number; level2: number; level3: number };
    senior: { level1: number; level2: number; level3: number };
  };
}

export const hardSkillsByArea: HardSkillArea[] = [
  {
    id: "agilista",
    name: "Agilista",
    skills: [
      { id: "86a1c35er", name: "Conhecimento de metodologias ágeis", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "86a1c35hp", name: "Conhecimento de mapeamento e otimização de fluxos", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "86a1c35kf", name: "Conhecimento sobre o ciclo de vida dos produtos", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "86a1c35zy", name: "Levantamento de Requisitos", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "86a1c36ra", name: "Gestão de backlog", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "86a1c3fqp", name: "Facilitação de Atividades e Cerimônias", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "86a1c3g4w", name: "Métricas Ágeis", levels: { junior: 2, pleno: 4, senior: 5 } },
    ],
  },
  {
    id: "desenvolvedor",
    name: "Desenvolvedor",
    skills: [
      { id: "dev-git", name: "Conhecimento de controle de versão com GIT", levels: { junior: 3, pleno: 4, senior: 5 } },
      { id: "dev-tests", name: "Conhecimento em Testes", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "dev-solid", name: "SOLID", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "dev-lang", name: "Proficiência na linguagem/framework de atuação", levels: { junior: 3, pleno: 5, senior: 5 } },
      { id: "dev-cicd", name: "Conhecimento de CI/CD", levels: { junior: 1, pleno: 4, senior: 5 } },
      { id: "dev-uiux", name: "Conhecimento de UI/UX", levels: { junior: 1, pleno: 3, senior: 5 } },
      { id: "dev-native", name: "Conhecimento em Integração com nativo (iOS/Android)", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "dev-review", name: "Code Review", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "dev-arch", name: "Conhecimento em arquitetura", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "dev-network", name: "Camada de rede e segurança", levels: { junior: 1, pleno: 3, senior: 5 } },
    ],
  },
  {
    id: "designer",
    name: "Designer",
    skills: [
      { id: "86a0hf0nw", name: "Conhecimento em Figma", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "86a0hf0qq", name: "Conhecimento em Design Thinking", levels: { junior: 1, pleno: 3, senior: 4 } },
      { id: "86a0hf10j", name: "Princípios de design de interação e arquitetura", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "86a0hf14k", name: "Design critics", levels: { junior: 1, pleno: 4, senior: 5 } },
      { id: "86a0hf17h", name: "Prototipagem", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "86a0hf1aa", name: "Conhecimento básico em FrontEnd", levels: { junior: 1, pleno: 1, senior: 3 } },
      { id: "86a1290hp", name: "Conhecimento em boas práticas de design", levels: { junior: 2, pleno: 3, senior: 5 } },
      { id: "86a129ap4", name: "Princípios de acessibilidade", levels: { junior: 1, pleno: 3, senior: 4 } },
      { id: "86a129y6f", name: "Design System", levels: { junior: 1, pleno: 3, senior: 4 } },
    ],
  },
  {
    id: "people",
    name: "People",
    skills: [
      { id: "86a0hgtpz", name: "Visão sistêmica dos processos de RH", levels: { junior: 2, pleno: 4, senior: 5 } },
      { id: "86a0hgtv5", name: "Técnicas de Tech Recruiter", levels: { junior: 3, pleno: 4, senior: 5 } },
      { id: "86a0hgu0f", name: "Orientação a dados", levels: { junior: 2, pleno: 3, senior: 5 } },
      { id: "86a0hgu4a", name: "Conhecimento de rotinas administrativas", levels: { junior: 2, pleno: 4, senior: 5 } },
    ],
  },
  {
    id: "ux-writer",
    name: "UX Writer",
    skills: [
      { id: "86a12wyej", name: "Conhecimento em figma", levels: { junior: 1, pleno: 2, senior: 3 } },
      { id: "86a12wyg7", name: "Princípios de acessibilidade", levels: { junior: 2, pleno: 3, senior: 5 } },
      { id: "86a12wyj5", name: "Revisão textual", levels: { junior: 3, pleno: 4, senior: 5 } },
      { id: "86a12wymd", name: "Conhecimento da língua portuguesa", levels: { junior: 4, pleno: 4, senior: 5 } },
      { id: "86a12wyp1", name: "Copywriting", levels: { junior: 2, pleno: 3, senior: 4 } },
      { id: "86a12wyqc", name: "Conhecimento em Design Thinking", levels: { junior: 1, pleno: 2, senior: 3 } },
      { id: "86a12wyt7", name: "Conhecimento em boas práticas de design", levels: { junior: 1, pleno: 2, senior: 3 } },
      { id: "86a12wyvx", name: "Conhecimento em experiência do usuário", levels: { junior: 1, pleno: 2, senior: 3 } },
      { id: "86a12wyx6", name: "Noção em User Research", levels: { junior: 1, pleno: 2, senior: 3 } },
      { id: "86a12wyy9", name: "Criação de prompt writing", levels: { junior: 1, pleno: 2, senior: 4 } },
    ],
  },
];

export const softSkills: SoftSkill[] = [
  {
    id: "comunicacao",
    name: "Comunicação",
    description: "Habilidade de transmitir uma informação com clareza e assertividade, garantindo a compreensão de quem recebe a mensagem.",
    levels: {
      junior: { level1: 2, level2: 3, level3: 3 },
      pleno: { level1: 3, level2: 3, level3: 4 },
      senior: { level1: 4, level2: 5, level3: 5 },
    },
  },
  {
    id: "inteligencia-emocional",
    name: "Inteligência Emocional",
    description: "Capacidade de compreender e lidar com as suas próprias emoções, saber administrá-las e conduzi-las a seu favor de modo a se relacionar melhor consigo mesmo e com as pessoas ao seu redor.",
    levels: {
      junior: { level1: 2, level2: 2, level3: 2 },
      pleno: { level1: 2, level2: 3, level3: 3 },
      senior: { level1: 4, level2: 5, level3: 5 },
    },
  },
  {
    id: "aprendizagem-agil",
    name: "Aprendizagem Ágil",
    description: "Capacidade de aprender de forma contínua, mantendo o conhecimento ativo e atualizado.",
    levels: {
      junior: { level1: 2, level2: 3, level3: 3 },
      pleno: { level1: 3, level2: 4, level3: 4 },
      senior: { level1: 4, level2: 5, level3: 5 },
    },
  },
  {
    id: "criatividade",
    name: "Criatividade",
    description: "Capacidade de analisar e compreender problemas, encontrando caminhos criativos e não tradicionais para solucioná-los.",
    levels: {
      junior: { level1: 1, level2: 2, level3: 2 },
      pleno: { level1: 3, level2: 3, level3: 3 },
      senior: { level1: 4, level2: 5, level3: 5 },
    },
  },
  {
    id: "lideranca",
    name: "Liderança",
    description: "Capacidade de influenciar, motivar e guiar um grupo de pessoas em direção a um objetivo comum.",
    levels: {
      junior: { level1: 1, level2: 1, level3: 1 },
      pleno: { level1: 2, level2: 2, level3: 2 },
      senior: { level1: 4, level2: 5, level3: 5 },
    },
  },
  {
    id: "negociacao-influencia",
    name: "Negociação e influência",
    description: "Habilidade de convencer alguém a fazer algo, chegando a um resultado compartilhado.",
    levels: {
      junior: { level1: 1, level2: 1, level3: 1 },
      pleno: { level1: 2, level2: 2, level3: 2 },
      senior: { level1: 4, level2: 5, level3: 5 },
    },
  },
  {
    id: "pensamento-critico",
    name: "Pensamento crítico",
    description: "Capacidade de analisar uma situação, considerando suas variáveis, e propondo soluções eficientes e lógicas.",
    levels: {
      junior: { level1: 2, level2: 3, level3: 3 },
      pleno: { level1: 3, level2: 3, level3: 3 },
      senior: { level1: 4, level2: 5, level3: 5 },
    },
  },
  {
    id: "produtividade",
    name: "Produtividade",
    description: "Capacidade de gerenciar seu tempo, priorizar tarefas e focar energia no que realmente importa.",
    levels: {
      junior: { level1: 1, level2: 2, level3: 2 },
      pleno: { level1: 3, level2: 3, level3: 4 },
      senior: { level1: 4, level2: 4, level3: 5 },
    },
  },
  {
    id: "relacionamento-interpessoal",
    name: "Relacionamento interpessoal",
    description: "Vínculo criado entre dois ou mais indivíduos, com base em suas interações e no contexto social em que atuam.",
    levels: {
      junior: { level1: 1, level2: 2, level3: 3 },
      pleno: { level1: 3, level2: 3, level3: 4 },
      senior: { level1: 4, level2: 5, level3: 5 },
    },
  },
];
