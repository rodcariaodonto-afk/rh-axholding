import { Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Feriados = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feriados</h1>
        <p className="text-muted-foreground">Cadastro e gestão de feriados nacionais, estaduais e municipais.</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Calendar className="size-12 text-muted-foreground opacity-40" />
          <p className="text-muted-foreground">Funcionalidade em desenvolvimento.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Feriados;
