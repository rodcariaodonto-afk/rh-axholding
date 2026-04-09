import LegalPageLayout from "@/components/LegalPageLayout";

const sections = [
  { id: "intro", label: "Introdução" },
  { id: "dados", label: "Dados Coletados" },
  { id: "finalidade", label: "Finalidade" },
  { id: "compartilhamento", label: "Compartilhamento" },
  { id: "retencao", label: "Retenção" },
  { id: "cookies", label: "Cookies" },
  { id: "seguranca", label: "Segurança" },
  { id: "contato", label: "Contato" },
];

export default function PrivacyPolicy() {
  return (
    <LegalPageLayout title="Política de Privacidade" sections={sections}>
      <p className="text-gray-400 text-sm mb-8">Última atualização: Abril de 2026</p>

      <section id="intro" className="mb-10">
        <h2 className="text-xl mb-3">1. Introdução</h2>
        <p>
          A <strong>RHAxis</strong> ("nós", "nosso"), solução desenvolvida e mantida pela <strong>AX Holding</strong>, valoriza a privacidade e a proteção dos dados pessoais de seus usuários, clientes e visitantes. Esta Política de Privacidade descreve como coletamos, utilizamos, armazenamos e protegemos as informações pessoais em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD) e demais legislações aplicáveis.
        </p>
        <p>
          Ao acessar nosso site (<strong>rhaxis.com.br</strong>) ou utilizar a plataforma RH Smart IA, você declara estar ciente e de acordo com os termos aqui dispostos.
        </p>
      </section>

      <section id="dados" className="mb-10">
        <h2 className="text-xl mb-3">2. Dados Pessoais Coletados</h2>
        <p>Coletamos os seguintes dados pessoais fornecidos voluntariamente pelos usuários:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Nome completo</strong></li>
          <li><strong>Endereço de e-mail</strong></li>
          <li><strong>Número de telefone</strong></li>
        </ul>
        <p className="mt-3">
          Esses dados são coletados por meio de formulários de contato, solicitações de demonstração, landing pages e cadastros na plataforma.
        </p>
      </section>

      <section id="finalidade" className="mb-10">
        <h2 className="text-xl mb-3">3. Finalidade da Coleta</h2>
        <p>Os dados pessoais coletados são utilizados exclusivamente para as seguintes finalidades:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Comunicação direta com o usuário (respostas a dúvidas, suporte e atendimento);</li>
          <li>Envio de propostas comerciais, ofertas e informações sobre nossos produtos e serviços;</li>
          <li>Agendamento de demonstrações e reuniões comerciais;</li>
          <li>Personalização da experiência do usuário na plataforma.</li>
        </ul>
        <p className="mt-3">
          Não utilizamos seus dados para finalidades diversas das aqui descritas sem o seu consentimento prévio e expresso.
        </p>
      </section>

      <section id="compartilhamento" className="mb-10">
        <h2 className="text-xl mb-3">4. Compartilhamento de Dados</h2>
        <p>
          Os dados pessoais poderão ser compartilhados com <strong>terceiros estritamente necessários</strong> para a operação e funcionamento da plataforma, incluindo:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Provedores de infraestrutura em nuvem e hospedagem;</li>
          <li>Serviços de autenticação e segurança;</li>
          <li>APIs e integrações de sistemas parceiros que suportam funcionalidades da plataforma;</li>
          <li>Ferramentas de análise e comunicação.</li>
        </ul>
        <p className="mt-3">
          Todos os parceiros e prestadores de serviço são contratualmente obrigados a manter a confidencialidade e a segurança dos dados processados, em conformidade com a LGPD.
        </p>
      </section>

      <section id="retencao" className="mb-10">
        <h2 className="text-xl mb-3">5. Retenção de Dados</h2>
        <p>
          Os dados pessoais coletados serão armazenados pelo período de <strong>1 (um) ano</strong>, contado a partir da data da coleta ou do último contato ativo com o titular. Após esse período, os dados serão eliminados de forma segura, salvo quando houver obrigação legal ou regulatória que justifique a retenção por prazo superior.
        </p>
      </section>

      <section id="cookies" className="mb-10">
        <h2 className="text-xl mb-3">6. Cookies e Tecnologias de Rastreamento</h2>
        <p>Nosso site utiliza cookies e tecnologias similares para:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Melhorar a experiência de navegação do usuário;</li>
          <li>Analisar o tráfego e o comportamento de uso do site;</li>
          <li>Otimizar campanhas de marketing e publicidade;</li>
          <li>Personalizar conteúdos exibidos.</li>
        </ul>
        <p className="mt-3">
          Utilizamos ferramentas como o <strong>Google Analytics</strong> e outras plataformas de análise para coletar dados agregados e anônimos sobre o uso do site. Você pode gerenciar as preferências de cookies através das configurações do seu navegador.
        </p>
      </section>

      <section id="seguranca" className="mb-10">
        <h2 className="text-xl mb-3">7. Segurança dos Dados</h2>
        <p>
          A RHAxis adota medidas técnicas e administrativas robustas para proteger os dados pessoais contra acessos não autorizados, destruição, perda, alteração ou qualquer forma de tratamento inadequado. Nossa plataforma é:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>SOC 2 Type II Compliant</strong> — Auditoria independente de controles de segurança, disponibilidade e confidencialidade;</li>
          <li><strong>LGPD Compliant</strong> — Total conformidade com a Lei Geral de Proteção de Dados;</li>
          <li>Criptografia de dados em trânsito (TLS/SSL) e em repouso;</li>
          <li>Controles de acesso baseados em função (RBAC) e autenticação multifator.</li>
        </ul>
      </section>

      <section id="contato" className="mb-10">
        <h2 className="text-xl mb-3">8. Canal de Contato</h2>
        <p>
          Para dúvidas, solicitações ou exercício dos seus direitos como titular de dados, entre em contato com nosso Encarregado de Proteção de Dados (DPO) através do e-mail:
        </p>
        <p className="mt-2">
          <strong>
            <a href="mailto:privacidade@rhaxis.com.br" className="text-blue-400">privacidade@rhaxis.com.br</a>
          </strong>
        </p>
        <p className="mt-3">
          Você também pode exercer seus direitos através do nosso{" "}
          <a href="/lgpd" className="text-blue-400 hover:underline">Portal LGPD</a>.
        </p>
      </section>
    </LegalPageLayout>
  );
}
