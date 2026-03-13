import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

const PaymentSchedule = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Programação de Pagamento</h1>
        <p className="text-muted-foreground">
          Calendário de pagamentos agendados e status.
        </p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CreditCard className="size-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">Em breve</p>
          <p className="text-sm">Este módulo será implementado na Fase 3.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSchedule;
