import { JustificativasAprovacaoTab } from "@/components/JustificativasAprovacaoTab";

const Justificativas = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Justificativas de Ponto</h1>
        <p className="text-muted-foreground">Aprovação e gestão de justificativas enviadas pelos colaboradores.</p>
      </div>
      <JustificativasAprovacaoTab />
    </div>
  );
};

export default Justificativas;
