import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark } from "lucide-react";

const LaborData = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dados Trabalhistas</h1>
        <p className="text-muted-foreground">
          Escala de trabalho, salário e benefícios dos colaboradores.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Landmark className="size-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Em breve</p>
          <p className="text-sm">Este módulo será implementado na Fase 2.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LaborData;
