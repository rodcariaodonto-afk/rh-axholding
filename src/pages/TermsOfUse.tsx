import LegalPageLayout from "@/components/LegalPageLayout";

const sections = [
  { id: "aceitacao", label: "1. Aceitação" },
  { id: "servico", label: "2. Descrição do Serviço" },
  { id: "uso", label: "3. Uso Aceitável" },
  { id: "propriedade", label: "4. Propriedade Intelectual" },
  { id: "responsabilidade", label: "5. Limitação" },
  { id: "integracoes", label: "6. Integrações" },
  { id: "modificacoes", label: "7. Modificações" },
  { id: "foro", label: "8. Foro" },
];

export default function TermsOfUse() {
  return (
    <LegalPageLayout title="Termos de Uso" sections={sections}>
      <p className="text-gray-400 text-sm mb-8">Última atualização: Abril de 2026</p>

      <section id="aceitacao" className="mb-10">
        <h2 className="text-xl mb-3">Cláusula 1 — Aceitação dos Termos</h2>
        <p>
          1.1. Ao acessar o site <strong>rhaxis.com.br</strong> e/ou utilizar a plataforma RH Smart IA, incluindo seus módulos <strong>AX People</strong>, <strong>AX Talent</strong>, <strong>AX Analytics</strong>, <strong>AX Pay</strong> e <strong>AX Pulse</strong>, o usuário declara ter lido, compreendido e concordado integralmente com os presentes Termos de Uso.
        </p>
        <p>
          1.2. Caso o usuário não concorde com qualquer disposição destes termos, deverá cessar imediatamente o uso da plataforma.
        </p>
        <p>
          1.3. A utilização dos serviços por pessoa jurídica implica que o representante legal ou usuário autorizado aceita estes termos em nome da organização.
        </p>
      </section>

      <section id="servico" className="mb-10">
        <h2 className="text-xl mb-3">Cláusula 2 — Descrição do Serviço</h2>
        <p>
          2.1. A <strong>RHAxis</strong> é uma plataforma SaaS (Software as a Service) de gestão de Recursos Humanos com Inteligência Artificial, desenvolvida e mantida pela <strong>AX Holding</strong>.
        </p>
        <p>
          2.2. A plataforma oferece funcionalidades que incluem, mas não se limitam a:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Automação de processos de Departamento Pessoal (folha de pagamento, ponto eletrônico, férias);</li>
          <li>Recrutamento e seleção com triagem inteligente por IA;</li>
          <li>Desenvolvimento de talentos (PDIs, avaliações de desempenho, treinamentos);</li>
          <li>People Analytics com dashboards preditivos e análise de turnover;</li>
          <li>Gestão de clima organizacional e engajamento via IA preditiva (AX Pulse).</li>
        </ul>
      </section>

      <section id="uso" className="mb-10">
        <h2 className="text-xl mb-3">Cláusula 3 — Uso Aceitável</h2>
        <p>3.1. O usuário compromete-se a:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Fornecer informações verdadeiras, completas e atualizadas nos formulários de cadastro e contato (Nome, E-mail, Telefone, Empresa);</li>
          <li>Não utilizar a plataforma para fins ilícitos, fraudulentos, difamatórios ou que violem a legislação vigente;</li>
          <li>Não tentar acessar áreas restritas da plataforma sem autorização;</li>
          <li>Não realizar engenharia reversa, descompilação ou cópia do software;</li>
          <li>Manter a confidencialidade de suas credenciais de acesso.</li>
        </ul>
        <p className="mt-3">
          3.2. O descumprimento destas obrigações poderá resultar na suspensão ou cancelamento imediato do acesso, sem prejuízo de eventuais medidas judiciais cabíveis.
        </p>
      </section>

      <section id="propriedade" className="mb-10">
        <h2 className="text-xl mb-3">Cláusula 4 — Propriedade Intelectual</h2>
        <p>
          4.1. Todos os direitos de propriedade intelectual sobre o software, a marca <strong>RHAxis</strong>, logotipos, algoritmos de IA preditiva, interfaces, textos, imagens e demais conteúdos presentes no site e na plataforma pertencem exclusivamente à <strong>AX Holding</strong>.
        </p>
        <p>
          4.2. É expressamente vedada a reprodução, distribuição, modificação ou utilização de qualquer conteúdo sem autorização prévia e por escrito da AX Holding.
        </p>
        <p>
          4.3. A contratação dos serviços não confere ao usuário qualquer direito de propriedade sobre o software, sendo concedida apenas uma licença limitada, não exclusiva e revogável de uso durante a vigência do contrato.
        </p>
      </section>

      <section id="responsabilidade" className="mb-10">
        <h2 className="text-xl mb-3">Cláusula 5 — Limitação de Responsabilidade</h2>
        <p>
          5.1. A RHAxis envidará seus melhores esforços para garantir alta disponibilidade da plataforma, em conformidade com os Acordos de Nível de Serviço (SLA) aplicáveis a cada plano contratado.
        </p>
        <p>
          5.2. A RHAxis <strong>não se responsabiliza</strong> por:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Interrupções, falhas ou indisponibilidades causadas por serviços de terceiros, provedores de infraestrutura ou eventos de força maior;</li>
          <li>Danos decorrentes de mau uso, negligência ou violação destes Termos por parte do cliente ou seus usuários;</li>
          <li>Perda de dados resultante de falhas atribuíveis ao próprio cliente;</li>
          <li>Decisões tomadas com base em análises ou relatórios gerados pela inteligência artificial da plataforma.</li>
        </ul>
        <p className="mt-3">
          5.3. Em nenhuma hipótese a responsabilidade total da RHAxis excederá o valor efetivamente pago pelo cliente nos 12 (doze) meses anteriores ao evento que deu origem à reclamação.
        </p>
      </section>

      <section id="integracoes" className="mb-10">
        <h2 className="text-xl mb-3">Cláusula 6 — Integrações de Terceiros</h2>
        <p>
          6.1. A plataforma poderá utilizar APIs, bibliotecas e integrações de terceiros para a prestação de seus serviços, incluindo provedores de autenticação, armazenamento em nuvem, processamento de pagamentos e inteligência artificial.
        </p>
        <p>
          6.2. O uso dessas integrações está sujeito à disponibilidade, termos e condições dos respectivos provedores. A RHAxis não se responsabiliza por alterações unilaterais, descontinuidades ou falhas em serviços de terceiros.
        </p>
      </section>

      <section id="modificacoes" className="mb-10">
        <h2 className="text-xl mb-3">Cláusula 7 — Modificações dos Termos</h2>
        <p>
          7.1. A RHAxis reserva-se o direito de atualizar, modificar ou revisar os presentes Termos de Uso a qualquer momento, a seu exclusivo critério.
        </p>
        <p>
          7.2. Os usuários ativos serão notificados sobre alterações relevantes por e-mail ou através de avisos na plataforma, com antecedência mínima de 15 (quinze) dias.
        </p>
        <p>
          7.3. A continuidade do uso dos serviços após a entrada em vigor das alterações será considerada como aceitação tácita dos novos termos.
        </p>
      </section>

      <section id="foro" className="mb-10">
        <h2 className="text-xl mb-3">Cláusula 8 — Foro e Legislação Aplicável</h2>
        <p>
          8.1. Os presentes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
        </p>
        <p>
          8.2. Fica eleito o foro da comarca da sede da <strong>AX Holding</strong> no Brasil como competente para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia expressa de qualquer outro, por mais privilegiado que seja.
        </p>
      </section>
    </LegalPageLayout>
  );
}
