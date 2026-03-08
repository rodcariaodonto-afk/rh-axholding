// Profiler Comportamental - Profiles Data
// Based on DISC methodology with original Portuguese content

export interface Profile {
  code: string;
  name: string;
  subcategory: string;
  basicSkills: string;
  mainSkills: string;
  mainAdvantages: string;
  mainDisadvantages: string;
  summary: string;
  color: string;
}

export const profiles: Record<string, Profile> = {
  EXE: {
    code: "EXE",
    name: "Executor",
    subcategory: "Dominante / Direcionado a Resultados",
    basicSkills: "Liderança, Determinação, Competitividade, Foco em Resultados",
    mainSkills: "O perfil Executor destaca-se pela sua capacidade excepcional de tomar decisões rápidas e assertivas, mesmo em cenários de alta pressão e incerteza. Profissionais com este perfil demonstram uma orientação natural para resultados tangíveis, estabelecendo metas ambiciosas e trabalhando incansavelmente para alcançá-las. Sua abordagem direta e objetiva permite cortar através de complexidades desnecessárias, focando no que realmente importa para o sucesso do projeto ou da organização. São excelentes em situações que exigem ação imediata e não hesitam em assumir responsabilidades significativas. Sua energia contagiante e determinação inspiram equipes a superar obstáculos aparentemente intransponíveis.",
    mainAdvantages: "Executores trazem uma energia transformadora para qualquer ambiente de trabalho. Sua principal vantagem reside na capacidade de converter visões em realidade através de ações concretas e mensuráveis. Em momentos de crise, são os primeiros a tomar a frente e estabelecer um plano de ação claro. Sua natureza competitiva os impulsiona a buscar constantemente a excelência e a superar expectativas. São catalisadores de mudança, capazes de quebrar padrões estagnados e introduzir novas dinâmicas mais eficientes. A franqueza com que comunicam suas expectativas elimina ambiguidades e acelera processos decisórios. Em ambientes que valorizam agilidade e resultados, Executores se destacam como líderes naturais.",
    mainDisadvantages: "A intensidade do Executor pode gerar desafios significativos no ambiente de trabalho. Sua impaciência com processos lentos ou pessoas que trabalham em ritmo diferente pode criar tensões interpessoais e desmotivar a equipe. A tendência a tomar decisões rapidamente pode resultar em escolhas precipitadas que desconsideram informações importantes ou impactos a longo prazo. Podem ser percebidos como autoritários, dominadores ou insensíveis às necessidades emocionais dos colegas. A dificuldade em delegar tarefas e confiar nos outros pode levar ao microgerenciamento e ao esgotamento. Em busca de resultados, podem atropelar relacionamentos e criar um ambiente de trabalho tenso. A resistência a receber feedback ou admitir erros pode limitar seu crescimento pessoal e profissional.",
    summary: "Líder nato com foco em resultados e ação decisiva.",
    color: "hsl(0, 84%, 60%)" // Vermelho
  },
  COM: {
    code: "COM",
    name: "Comunicador",
    subcategory: "Influente / Orientado a Pessoas",
    basicSkills: "Persuasão, Entusiasmo, Networking, Criatividade Social",
    mainSkills: "O perfil Comunicador possui uma habilidade natural extraordinária para estabelecer conexões genuínas com pessoas de todos os backgrounds e níveis hierárquicos. Sua capacidade de articular ideias de forma envolvente e persuasiva os torna excelentes em apresentações, negociações e na construção de relacionamentos estratégicos. Profissionais com este perfil são mestres em ler o ambiente social e adaptar sua comunicação para ressoar com diferentes públicos. Sua energia positiva e otimismo são contagiantes, elevando o moral da equipe mesmo em períodos desafiadores. São naturalmente inclinados a colaboração e trabalham ativamente para criar ambientes harmoniosos e motivadores.",
    mainAdvantages: "Comunicadores são verdadeiros construtores de pontes dentro das organizações. Sua maior vantagem está na capacidade de mobilizar pessoas em torno de objetivos comuns, transformando grupos dispersos em equipes coesas e engajadas. Possuem um talento único para identificar e desenvolver talentos nos outros, atuando como mentores informais e promotores de carreira. Em situações de conflito, são mediadores naturais, capazes de encontrar pontos de consenso entre partes divergentes. Sua rede de contatos frequentemente se torna um ativo valioso para a organização, abrindo portas e criando oportunidades de negócio. A atmosfera positiva que criam aumenta a satisfação e retenção da equipe.",
    mainDisadvantages: "A natureza sociável do Comunicador pode trazer desafios operacionais consideráveis. Sua tendência a priorizar relacionamentos pode resultar em dificuldade para dar feedbacks negativos ou tomar decisões impopulares, evitando confrontos necessários. O excesso de otimismo pode levar à subestimação de riscos e problemas reais. Podem ter dificuldade em manter o foco em tarefas detalhadas ou repetitivas, dispersando energia em múltiplas direções. A necessidade de aprovação social pode comprometer a objetividade em decisões importantes. Tendem a falar mais do que ouvir e podem dominar conversas, deixando outros sem espaço. A gestão do tempo é frequentemente um desafio, com tendência a socializar em excesso em detrimento de entregas. Podem prometer mais do que conseguem cumprir na tentativa de agradar.",
    summary: "Conector natural com habilidade de influenciar e motivar pessoas.",
    color: "hsl(45, 93%, 47%)" // Amarelo
  },
  PLA: {
    code: "PLA",
    name: "Planejador",
    subcategory: "Estável / Focado em Processos",
    basicSkills: "Paciência, Consistência, Cooperação, Confiabilidade",
    mainSkills: "O perfil Planejador se distingue pela sua abordagem metódica e consistente em todas as atividades que realiza. Profissionais com este perfil são pilares de estabilidade em suas equipes, oferecendo suporte confiável e previsível que permite aos outros trabalharem com segurança. Sua paciência excepcional os capacita a lidar com tarefas de longa duração sem perder a qualidade ou o foco. São excelentes ouvintes e conselheiros, criando um ambiente seguro para que colegas compartilhem preocupações e ideias. Sua lealdade às pessoas e processos estabelecidos proporciona continuidade e preservação do conhecimento institucional. Trabalham incansavelmente nos bastidores para garantir que tudo funcione harmoniosamente.",
    mainAdvantages: "Planejadores são o alicerce sobre o qual organizações bem-sucedidas são construídas. Sua principal vantagem é a capacidade de manter operações funcionando de forma suave e eficiente, mesmo durante períodos de turbulência externa. São especialistas em criar e seguir processos que garantem qualidade consistente e reduzem erros. Sua natureza cooperativa facilita o trabalho em equipe e minimiza atritos interpessoais. Em projetos de longo prazo, sua persistência e dedicação asseguram que objetivos sejam alcançados mesmo quando outros desistem. A estabilidade emocional que demonstram serve como âncora para equipes em momentos de incerteza, transmitindo calma e confiança.",
    mainDisadvantages: "A preferência por estabilidade do Planejador pode criar obstáculos significativos em ambientes dinâmicos. Sua resistência a mudanças pode torná-los lentos para adaptar-se a novas situações ou adotar inovações necessárias. A aversão a conflitos pode levá-los a evitar conversas difíceis e aceitar situações insatisfatórias passivamente. Podem ter dificuldade em tomar decisões rápidas ou agir sem planejamento extensivo, perdendo oportunidades. A tendência a priorizar harmonia pode resultar em falta de assertividade e dificuldade em defender suas próprias ideias ou interesses. Podem ser percebidos como lentos, resistentes ou excessivamente cautelosos. A lealdade excessiva a métodos antigos pode impedir a melhoria de processos. Dificuldade em lidar com múltiplas prioridades simultâneas ou ambientes de alta pressão.",
    summary: "Base sólida da equipe com foco em estabilidade e cooperação.",
    color: "hsl(142, 71%, 45%)" // Verde
  },
  ANA: {
    code: "ANA",
    name: "Analista",
    subcategory: "Consciencioso / Orientado a Detalhes",
    basicSkills: "Precisão, Análise Crítica, Organização, Qualidade",
    mainSkills: "O perfil Analista demonstra uma capacidade excepcional para examinar informações com rigor e profundidade, identificando padrões, inconsistências e oportunidades que passam despercebidos por outros. Profissionais com este perfil são movidos pela busca da excelência e não se contentam com resultados mediocres. Sua mente sistemática os permite criar estruturas organizacionais eficientes e processos à prova de erros. São especialistas em transformar dados complexos em insights acionáveis, fornecendo base sólida para tomadas de decisão estratégicas. Sua atenção meticulosa aos detalhes garante que nenhum aspecto importante seja negligenciado em projetos críticos.",
    mainAdvantages: "Analistas são os guardiões da qualidade e precisão nas organizações. Sua maior vantagem reside na capacidade de prever problemas antes que ocorram, identificando riscos e vulnerabilidades através de análise criteriosa. São excelentes em estabelecer padrões de excelência e criar métricas significativas para avaliar desempenho. Em ambientes regulados ou que exigem conformidade, são indispensáveis para garantir aderência a normas e procedimentos. Sua documentação meticulosa preserva conhecimento crítico e facilita auditorias. A objetividade com que avaliam situações permite decisões baseadas em fatos, não em emoções ou suposições. São fundamentais em projetos que exigem precisão técnica.",
    mainDisadvantages: "O perfeccionismo do Analista pode ser um obstáculo significativo para a produtividade e relacionamentos. A tendência a analisar excessivamente pode levar à paralisia por análise, atrasando decisões e entregas. O alto padrão de qualidade pode resultar em críticas excessivas ao trabalho dos outros e dificuldade em aceitar soluções 'boas o suficiente'. Podem ser percebidos como frios, distantes ou excessivamente críticos, criando barreiras interpessoais. A dificuldade em trabalhar em ambientes ambíguos ou com informações incompletas pode gerar ansiedade e frustração. Tendem a se isolar para trabalhar e podem ter dificuldade em colaborar efetivamente. A resistência em delegar por medo de erros pode sobrecarregá-los. Dificuldade em comunicar ideias complexas de forma acessível para não-especialistas.",
    summary: "Guardião da qualidade com mente analítica e sistemática.",
    color: "hsl(217, 91%, 60%)" // Azul
  },
  // Combinações de perfis
  EXE_COM: {
    code: "EXE_COM",
    name: "Executor-Comunicador",
    subcategory: "Líder Carismático",
    basicSkills: "Liderança Inspiradora, Persuasão, Iniciativa, Visão",
    mainSkills: "A combinação Executor-Comunicador cria profissionais com uma rara habilidade de liderar através de inspiração e ação simultâneas. Estes indivíduos não apenas definem a direção estratégica, mas também conseguem mobilizar pessoas para segui-los com entusiasmo genuíno. Sua comunicação é orientada a resultados, mas entregue de forma que energiza e motiva a equipe. São excelentes em vender ideias e conquistar buy-in para iniciativas ambiciosas. Em negociações complexas, combinam assertividade com charme para alcançar acordos favoráveis. Sua presença em reuniões tende a catalisar decisões e acelerar processos que estavam estagnados.",
    mainAdvantages: "Profissionais com este perfil combinado são catalisadores de transformação organizacional. Conseguem articular visões inspiradoras e, simultaneamente, criar urgência para ação. São excepcionais em ambientes de vendas complexas, onde é necessário construir relacionamentos enquanto se fecha negócios. Em posições de liderança, criam culturas de alta performance sem sacrificar o engajamento da equipe. Sua rede de influência cresce rapidamente, abrindo portas para parcerias e oportunidades estratégicas. São particularmente eficazes em startups e ambientes de rápido crescimento, onde carisma e execução precisam andar juntos. Transformam resistência em adesão.",
    mainDisadvantages: "A combinação de dominância e influência pode criar desafios únicos. A necessidade de estar sempre no comando e no centro das atenções pode gerar competição excessiva com outros líderes. Podem ser percebidos como manipuladores ou excessivamente políticos em suas abordagens. A impaciência com detalhes e processos pode resultar em execução superficial. Tendem a iniciar muitos projetos sem necessariamente finalizá-los. A confiança excessiva pode cegar para riscos reais e feedbacks críticos. Podem criar dependência da equipe em sua presença, dificultando autonomia. A intensidade pode ser desgastante para colegas que preferem ambientes mais calmos. Dificuldade em reconhecer limites próprios e da equipe.",
    summary: "Líder carismático que inspira ação e conquista resultados.",
    color: "hsl(22, 100%, 50%)" // Laranja
  },
  COM_PLA: {
    code: "COM_PLA",
    name: "Comunicador-Planejador",
    subcategory: "Facilitador Harmonioso",
    basicSkills: "Diplomacia, Empatia, Mediação, Suporte",
    mainSkills: "A combinação Comunicador-Planejador produz profissionais excepcionalmente hábeis em criar e manter ambientes de trabalho harmoniosos e produtivos. Estes indivíduos combinam excelentes habilidades interpessoais com paciência e consistência, tornando-se recursos valiosos para resolução de conflitos e construção de consenso. São naturalmente inclinados a considerar as necessidades e sentimentos de todos os stakeholders antes de tomar decisões. Sua abordagem paciente na comunicação permite que construam relacionamentos duradouros baseados em confiança mútua. Em equipes diversas, atuam como cola social que mantém o grupo coeso e funcional.",
    mainAdvantages: "Profissionais com este perfil são mestres em criar ambientes psicologicamente seguros onde a colaboração floresce. Sua maior vantagem está na capacidade de suavizar transições e mudanças organizacionais, ajudando pessoas a se adaptarem com menor resistência. São excelentes em funções que exigem atendimento ao cliente interno ou externo, onde empatia e consistência são essenciais. Em projetos que envolvem múltiplos departamentos, atuam como facilitadores naturais, navegando políticas internas com diplomacia. Sua lealdade aos relacionamentos construídos cria uma rede de apoio confiável dentro da organização. Reduzem turnover através de suporte genuíno.",
    mainDisadvantages: "A forte orientação para harmonia pode criar desafios em situações que exigem confronto ou decisões difíceis. A dificuldade em dizer 'não' pode resultar em sobrecarga de trabalho e compromissos excessivos. Podem evitar conflitos necessários para manter a paz superficial, deixando problemas se agravarem. A necessidade de consenso pode tornar processos decisórios lentos e ineficientes. Podem ser percebidos como indecisos ou facilmente influenciáveis. A tendência a personalizar relações profissionais pode dificultar separação entre pessoal e trabalho. Dificuldade em dar feedbacks negativos diretos pode prejudicar o desenvolvimento da equipe. Podem sacrificar próprias necessidades em favor dos outros, gerando ressentimento a longo prazo.",
    summary: "Facilitador que constrói harmonia e relacionamentos duradouros.",
    color: "hsl(94, 66%, 45%)" // Verde-amarelado
  },
  PLA_ANA: {
    code: "PLA_ANA",
    name: "Planejador-Analista",
    subcategory: "Especialista Técnico",
    basicSkills: "Metodologia, Precisão, Consistência, Expertise",
    mainSkills: "A combinação Planejador-Analista forma profissionais com uma capacidade única de desenvolver e manter sistemas complexos com precisão e confiabilidade excepcionais. Estes indivíduos combinam a paciência necessária para trabalhos de longa duração com o rigor analítico que garante qualidade superior. São especialistas em criar documentação técnica detalhada e processos replicáveis que preservam conhecimento crítico. Sua abordagem metódica aos problemas garante que soluções sejam bem fundamentadas e sustentáveis a longo prazo. Em ambientes técnicos, são frequentemente reconhecidos como autoridades em suas áreas de especialização.",
    mainAdvantages: "Profissionais com este perfil são pilares de excelência técnica nas organizações. Sua maior vantagem reside na capacidade de combinar profundidade de conhecimento com consistência de entrega, garantindo resultados de alta qualidade repetidamente. São ideais para funções que exigem manutenção de sistemas críticos ou conformidade regulatória rigorosa. Em auditorias, sua documentação meticulosa e processos bem definidos facilitam demonstração de compliance. Servem como mentores técnicos valiosos, transferindo conhecimento de forma estruturada para novos membros da equipe. Sua previsibilidade reduz riscos operacionais e aumenta a confiança dos stakeholders.",
    mainDisadvantages: "A combinação de cautela e perfeccionismo pode criar barreiras significativas em ambientes ágeis. A forte resistência a mudanças e riscos pode impedir inovação e adaptação necessárias. Processos decisórios podem ser extremamente lentos devido à necessidade de análise exaustiva. Podem ter grande dificuldade em trabalhar com prazos apertados ou informações incompletas. A tendência ao isolamento pode dificultar colaboração e comunicação com áreas não-técnicas. Podem ser percebidos como inflexíveis, burocráticos ou desconectados das necessidades do negócio. Dificuldade em simplificar comunicação técnica para públicos leigos. A autocrítica excessiva pode limitar a tomada de iniciativa e assunção de novos desafios.",
    summary: "Especialista técnico com metodologia rigorosa e consistente.",
    color: "hsl(180, 70%, 40%)" // Ciano
  },
  ANA_EXE: {
    code: "ANA_EXE",
    name: "Analista-Executor",
    subcategory: "Estrategista Pragmático",
    basicSkills: "Análise Estratégica, Decisão Informada, Eficiência, Foco",
    mainSkills: "A combinação Analista-Executor cria profissionais que equilibram análise rigorosa com orientação decidida para ação. Estes indivíduos não se perdem em paralisia por análise; em vez disso, coletam informações suficientes para tomar decisões bem fundamentadas e então executam com determinação. São excelentes em identificar a solução mais eficiente para problemas complexos e implementá-la rapidamente. Sua abordagem combina o melhor dos dois mundos: a precisão do pensamento analítico com a urgência do mindset executor. Em ambientes competitivos, esta combinação se traduz em vantagem estratégica significativa.",
    mainAdvantages: "Profissionais com este perfil são particularmente valiosos em funções que exigem tanto pensamento estratégico quanto capacidade de execução. Sua maior vantagem está na habilidade de transformar dados e análises em ações concretas que geram resultados mensuráveis. São excelentes em otimização de processos, identificando ineficiências através de análise e implementando melhorias de forma assertiva. Em gestão de projetos complexos, equilibram planejamento detalhado com flexibilidade para adaptar quando necessário. Sua objetividade nas avaliações, combinada com foco em resultados, os torna consultores internos eficazes para decisões estratégicas.",
    mainDisadvantages: "A combinação de exigência analítica com urgência por resultados pode criar tensões internas e externas. Podem ser excessivamente críticos e impacientes com colegas que não atendem seus padrões elevados. A baixa tolerância a erros (próprios e dos outros) pode criar ambiente de trabalho tenso. Dificuldade em aceitar abordagens diferentes das suas, podendo desconsiderar contribuições válidas. Podem ter problemas em trabalhar em equipe devido à preferência por controle e autonomia. A comunicação direta combinada com crítica analítica pode ser percebida como agressiva ou desrespeitosa. Tendência a focar excessivamente em eficiência pode negligenciar aspectos humanos e relacionais. Dificuldade em delegar por desconfiança na qualidade do trabalho dos outros.",
    summary: "Estrategista que transforma análise em ação decisiva.",
    color: "hsl(270, 60%, 50%)" // Roxo
  }
};

export const getProfileByCode = (code: string): Profile | null => {
  return profiles[code] || null;
};

export const getAllProfiles = (): Profile[] => {
  return Object.values(profiles);
};
